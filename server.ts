import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { DRIVERS, MANAGERS, TECHNICAL_DIRECTORS, ENGINE_SUPPLIERS } from "./src/data.ts";
import type { Driver, Manager, TechnicalDirector, EngineSupplier } from "./src/data.ts";

const PORT = 3000;

interface Player {
  id: string;
  name: string;
  budget: number;
  drivers: Driver[];
  manager: Manager | null;
  technicalDirector: TechnicalDirector | null;
  engine: EngineSupplier | null;
  isReady: boolean;
}

interface GameState {
  players: Player[];
  status: "lobby" | "engine-selection" | "auction" | "results";
  currentItem: Driver | Manager | TechnicalDirector | null;
  itemType: "driver" | "manager" | "technicalDirector" | null;
  currentBid: number;
  highestBidder: string | null;
  timer: number;
  itemIndex: number;
  showBudgets: boolean;
  auctionQueue: (Driver | Manager | TechnicalDirector)[];
  auctionTypes: ("driver" | "manager" | "technicalDirector")[];
}

const rooms = new Map<string, GameState>();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", ({ roomId, playerName }) => {
      socket.join(roomId);
      
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          players: [],
          status: "lobby",
          currentItem: null,
          itemType: null,
          currentBid: 0,
          highestBidder: null,
          timer: 0,
          itemIndex: 0,
          showBudgets: true,
          auctionQueue: [],
          auctionTypes: [],
        });
      }

      const room = rooms.get(roomId)!;
      if (room.status !== "lobby") {
        socket.emit("error", "Game already in progress");
        return;
      }

      room.players.push({
        id: socket.id,
        name: playerName,
        budget: 1000, // $1000M
        drivers: [],
        manager: null,
        technicalDirector: null,
        engine: null,
        isReady: false,
      });

      io.to(roomId).emit("room-update", room);
    });

    socket.on("leave-room", (roomId) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        socket.leave(roomId);
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          io.to(roomId).emit("room-update", room);
        }
      }
    });

    socket.on("remove-player", ({ roomId, playerId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      // Only the host (first player) can remove players
      if (socket.id !== room.players[0]?.id) return;

      const playerIndex = room.players.findIndex(p => p.id === playerId);
      if (playerIndex !== -1 && playerId !== socket.id) {
        const removedPlayer = room.players[playerIndex];
        room.players.splice(playerIndex, 1);
        io.to(playerId).emit("kicked");
        io.to(roomId).emit("room-update", room);
      }
    });

    socket.on("toggle-budgets", (roomId) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== "lobby") return;
      if (socket.id !== room.players[0]?.id) return;
      room.showBudgets = !room.showBudgets;
      io.to(roomId).emit("room-update", room);
    });

    socket.on("start-game", (roomId) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.status = "engine-selection";
      io.to(roomId).emit("room-update", room);
    });

    socket.on("choose-engine", ({ roomId, manufacturer }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== "engine-selection") return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player || player.engine) return;

      const engine = ENGINE_SUPPLIERS.find(e => e.manufacturer === manufacturer);
      if (!engine) return;

      player.engine = engine;
      player.budget -= engine.fixed_cost;

      // Check if all players have chosen an engine
      if (room.players.every(p => p.engine)) {
        const playerCount = room.players.length;
        
        const shuffledDrivers = [...DRIVERS].sort(() => Math.random() - 0.5).slice(0, playerCount * 2);
        const shuffledManagers = [...MANAGERS].sort(() => Math.random() - 0.5).slice(0, playerCount);
        const shuffledTDs = [...TECHNICAL_DIRECTORS].sort(() => Math.random() - 0.5).slice(0, playerCount);

        // Interleave items for a better auction experience
        const queue: (Driver | Manager | TechnicalDirector)[] = [];
        const types: ("driver" | "manager" | "technicalDirector")[] = [];
        
        // Group by type as requested: Drivers -> Managers -> Technical Directors
        shuffledDrivers.forEach(d => {
          queue.push(d);
          types.push("driver");
        });
        shuffledManagers.forEach(m => {
          queue.push(m);
          types.push("manager");
        });
        shuffledTDs.forEach(td => {
          queue.push(td);
          types.push("technicalDirector");
        });

        room.auctionQueue = queue;
        room.auctionTypes = types;
        
        room.status = "auction";
        room.itemIndex = 0;
        startNextItem(roomId);
      } else {
        io.to(roomId).emit("room-update", room);
      }
    });

    socket.on("place-bid", ({ roomId, amount }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== "auction") return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;

      // Check if player is already the highest bidder
      if (room.highestBidder === socket.id) return;

      // Check if player already has reached the limit for the current item type
      if (room.itemType === "driver" && player.drivers.length >= 2) return;
      if (room.itemType === "manager" && player.manager) return;
      if (room.itemType === "technicalDirector" && player.technicalDirector) return;

      if (amount > room.currentBid && amount <= player.budget) {
        room.currentBid = amount;
        room.highestBidder = socket.id;
        room.timer = Math.max(room.timer, 10); // Reset timer to at least 10s on new bid
        io.to(roomId).emit("room-update", room);
      }
    });

    socket.on("disconnect", () => {
      rooms.forEach((room, roomId) => {
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);
          if (room.players.length === 0) {
            rooms.delete(roomId);
          } else {
            io.to(roomId).emit("room-update", room);
          }
        }
      });
    });
  });

  function startNextItem(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    if (room.itemIndex >= room.auctionQueue.length) {
      room.status = "results";
      room.currentItem = null;
      io.to(roomId).emit("room-update", room);
      return;
    }

    room.currentItem = room.auctionQueue[room.itemIndex];
    room.itemType = room.auctionTypes[room.itemIndex] as any;
    room.currentBid = 10; // Starting bid
    room.highestBidder = null;
    room.timer = 15;

    io.to(roomId).emit("room-update", room);
    startTimer(roomId);
  }

  function startTimer(roomId: string) {
    const interval = setInterval(() => {
      const r = rooms.get(roomId);
      if (!r || r.status !== "auction") {
        clearInterval(interval);
        return;
      }

      r.timer--;
      if (r.timer <= 0) {
        clearInterval(interval);
        finalizeItem(roomId);
      } else {
        io.to(roomId).emit("timer-update", r.timer);
      }
    }, 1000);
  }

  function finalizeItem(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    if (room.highestBidder) {
      const winner = room.players.find(p => p.id === room.highestBidder);
      if (winner) {
        winner.budget -= room.currentBid;
        if (room.itemType === "driver") {
          winner.drivers.push(room.currentItem as Driver);
        } else if (room.itemType === "manager") {
          winner.manager = room.currentItem as Manager;
        } else if (room.itemType === "technicalDirector") {
          winner.technicalDirector = room.currentItem as TechnicalDirector;
        }
      }

      io.to(roomId).emit("item-sold", {
        winner: winner?.name || "Unknown",
        item: room.currentItem?.name,
        price: room.currentBid
      });

      room.itemIndex++;
      setTimeout(() => {
        startNextItem(roomId);
      }, 3000);
    } else {
      // UNSOLD: Discard the current item and add a NEW one of the same type to the end of the queue
      let pool: (Driver | Manager | TechnicalDirector)[] = [];
      if (room.itemType === "driver") pool = DRIVERS;
      else if (room.itemType === "manager") pool = MANAGERS;
      else if (room.itemType === "technicalDirector") pool = TECHNICAL_DIRECTORS;

      // Find an item not in the current queue and not owned by anyone
      const usedNames = new Set(room.auctionQueue.map(i => i.name));
      room.players.forEach(p => {
        p.drivers.forEach(d => usedNames.add(d.name));
        if (p.manager) usedNames.add(p.manager.name);
        if (p.technicalDirector) usedNames.add(p.technicalDirector.name);
      });

      const available = pool.filter(i => !usedNames.has(i.name));
      
      if (available.length > 0) {
        const replacement = available[Math.floor(Math.random() * available.length)];
        // Insert immediately after the current item so it's auctioned next
        room.auctionQueue.splice(room.itemIndex + 1, 0, replacement);
        room.auctionTypes.splice(room.itemIndex + 1, 0, room.itemType as any);
      }

      io.to(roomId).emit("item-sold", {
        winner: "No one",
        item: room.currentItem?.name || "Item",
        price: 0
      });

      room.itemIndex++;
      setTimeout(() => {
        startNextItem(roomId);
      }, 1500);
    }
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import { useState, useEffect, useMemo } from "react";
import socket from "./socket";
import { Driver, Manager, TechnicalDirector, EngineSupplier, DRIVERS, MANAGERS, TECHNICAL_DIRECTORS, ENGINE_SUPPLIERS } from "./data";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Users, Timer, Wallet, User, Briefcase, Play, LogIn, ArrowUpDown, Search, X, LogOut } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Player {
  id: string;
  name: string;
  budget: number;
  drivers: Driver[];
  manager: Manager | null;
  technicalDirector: TechnicalDirector | null;
  engine: EngineSupplier | null;
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
  auctionQueue: (Driver | Manager | TechnicalDirector)[];
}

export default function App() {
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    drivers: { key: 'name' | 'rating'; direction: 'asc' | 'desc' };
    managers: { key: 'name' | 'rating'; direction: 'asc' | 'desc' };
    technicalDirectors: { key: 'name' | 'rating'; direction: 'asc' | 'desc' };
    engines: { key: 'manufacturer' | 'overall_rating'; direction: 'asc' | 'desc' };
  }>({
    drivers: { key: 'rating', direction: 'desc' },
    managers: { key: 'rating', direction: 'desc' },
    technicalDirectors: { key: 'rating', direction: 'desc' },
    engines: { key: 'overall_rating', direction: 'desc' },
  });

  const [activeTab, setActiveTab] = useState<'drivers' | 'managers' | 'technicalDirectors' | 'engines'>('drivers');
  const [searchQuery, setSearchQuery] = useState("");
  const [room, setRoom] = useState<GameState | null>(null);
  const [joined, setJoined] = useState(false);
  const [lastSold, setLastSold] = useState<{ winner: string; item: string; price: number } | null>(null);
  
  const [showScouting, setShowScouting] = useState(false);

  useEffect(() => {
    socket.on("room-update", (updatedRoom: GameState) => {
      setRoom(updatedRoom);
    });

    socket.on("timer-update", (timer: number) => {
      setRoom((prev) => prev ? { ...prev, timer } : null);
    });

    socket.on("item-sold", (data) => {
      setLastSold(data);
      setTimeout(() => setLastSold(null), 2500);
    });

    socket.on("kicked", () => {
      setJoined(false);
      setRoom(null);
      alert("You have been removed from the room.");
    });

    return () => {
      socket.off("room-update");
      socket.off("timer-update");
      socket.off("item-sold");
      socket.off("kicked");
    };
  }, []);

  const joinRoom = () => {
    if (roomId && playerName) {
      socket.emit("join-room", { roomId, playerName });
      setJoined(true);
    }
  };

  const leaveRoom = () => {
    socket.emit("leave-room", roomId);
    setJoined(false);
    setRoom(null);
  };

  const removePlayer = (playerId: string) => {
    socket.emit("remove-player", { roomId, playerId });
  };

  const startGame = () => {
    socket.emit("start-game", roomId);
  };

  const placeBid = (amount: number) => {
    socket.emit("place-bid", { roomId, amount });
  };

  const chooseEngine = (manufacturer: string) => {
    socket.emit("choose-engine", { roomId, manufacturer });
  };

  const calculateScore = (player: Player) => {
    const driverScore = player.drivers.reduce((acc, d) => acc + d.rating, 0);
    const managerScore = player.manager?.rating || 0;
    const tdScore = player.technicalDirector?.rating || 0;
    const engineScore = player.engine?.overall_rating || 0;
    return driverScore + managerScore + tdScore + engineScore;
  };

  const upcomingItems = useMemo(() => {
    if (!room || room.status !== "auction") return [];
    return room.auctionQueue.slice(room.itemIndex + 1, room.itemIndex + 4);
  }, [room?.itemIndex, room?.auctionQueue, room?.status]);

  const sortedData = useMemo(() => {
    const sort = (data: any[], config: { key: string; direction: string }) => {
      const filtered = data.filter(item => {
        const name = item.name || item.manufacturer;
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      });
      return [...filtered].sort((a, b) => {
        if (a[config.key] < b[config.key]) return config.direction === 'asc' ? -1 : 1;
        if (a[config.key] > b[config.key]) return config.direction === 'asc' ? 1 : -1;
        return 0;
      });
    };

    return {
      drivers: sort(DRIVERS, sortConfig.drivers),
      managers: sort(MANAGERS, sortConfig.managers),
      technicalDirectors: sort(TECHNICAL_DIRECTORS, sortConfig.technicalDirectors),
      engines: sort(ENGINE_SUPPLIERS, sortConfig.engines),
    };
  }, [sortConfig, searchQuery]);

  const renderScoutingDatabase = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="font-mono text-[10px] uppercase opacity-50 tracking-widest">Scouting Database</h3>
        <div className="flex flex-wrap gap-2">
          {(['drivers', 'managers', 'technicalDirectors', 'engines'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSearchQuery("");
              }}
              className={cn(
                "font-mono text-[10px] uppercase px-3 py-1 border border-[#141414] transition-all",
                activeTab === tab ? "bg-[#141414] text-[#E4E3E0]" : "bg-white hover:bg-gray-100"
              )}
            >
              {tab === 'technicalDirectors' ? 'Tech Directors' : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={14} />
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          className="w-full p-3 pl-10 border border-[#141414] font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#141414]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="bg-white border border-[#141414] overflow-hidden">
        <div className="grid grid-cols-12 bg-gray-100 border-b border-[#141414] font-mono text-[10px] uppercase tracking-widest">
          <button 
            onClick={() => toggleSort(activeTab, activeTab === 'engines' ? 'manufacturer' : 'name')}
            className={cn(
              activeTab === 'engines' ? "col-span-6" : "col-span-8",
              "p-3 text-left hover:bg-gray-200 flex items-center gap-2 transition-colors",
              (sortConfig[activeTab].key === 'name' || sortConfig[activeTab].key === 'manufacturer') && "bg-gray-200"
            )}
          >
            {activeTab === 'engines' ? 'Manufacturer' : 'Name'}
            <ArrowUpDown size={10} className={cn(
              "transition-transform",
              (sortConfig[activeTab].key === 'name' || sortConfig[activeTab].key === 'manufacturer') && sortConfig[activeTab].direction === 'desc' && "rotate-180"
            )} />
          </button>
          {activeTab === 'engines' && (
            <>
              <div className="col-span-2 p-3 text-center border-l border-gray-200">Pwr/Rel</div>
              <div className="col-span-2 p-3 text-center border-l border-gray-200">Cost</div>
            </>
          )}
          <button 
            onClick={() => toggleSort(activeTab, activeTab === 'engines' ? 'overall_rating' : 'rating')}
            className={cn(
              activeTab === 'engines' ? "col-span-2" : "col-span-4",
              "p-3 text-right hover:bg-gray-200 flex items-center justify-end gap-2 transition-colors border-l border-gray-200",
              (sortConfig[activeTab].key === 'rating' || sortConfig[activeTab].key === 'overall_rating') && "bg-gray-200"
            )}
          >
            Rating 
            <ArrowUpDown size={10} className={cn(
              "transition-transform",
              (sortConfig[activeTab].key === 'rating' || sortConfig[activeTab].key === 'overall_rating') && sortConfig[activeTab].direction === 'desc' && "rotate-180"
            )} />
          </button>
        </div>
        <div className="max-h-[400px] overflow-y-auto font-mono text-[10px]">
          {sortedData[activeTab].map((item: any, i: number) => (
            <div 
              key={i} 
              className={cn(
                "grid grid-cols-12 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors",
                'manufacturer' in item && "bg-blue-50/10"
              )}
            >
              <div className={cn(
                activeTab === 'engines' ? "col-span-6" : "col-span-8",
                "p-3 flex flex-col gap-0.5"
              )}>
                <span className="font-bold uppercase">{'name' in item ? item.name : item.manufacturer}</span>
                <span className="opacity-50 italic">
                  {'status' in item ? item.status : 'era' in item ? item.era : `Type: ${item.type}`}
                </span>
              </div>
              {activeTab === 'engines' && 'power' in item && (
                <>
                  <div className="col-span-2 p-3 text-center border-l border-gray-100 flex flex-col justify-center">
                    <span>{item.power}</span>
                    <span className="opacity-30">/</span>
                    <span>{item.reliability}</span>
                  </div>
                  <div className="col-span-2 p-3 text-center border-l border-gray-100 flex items-center justify-center font-bold">
                    ${item.fixed_cost}M
                  </div>
                </>
              )}
              <div className={cn(
                activeTab === 'engines' ? "col-span-2" : "col-span-4",
                "p-3 text-right border-l border-gray-100 flex items-center justify-end text-sm font-black italic"
              )}>
                {'rating' in item ? item.rating : 'overall_rating' in item ? item.overall_rating : '-'}
              </div>
            </div>
          ))}
          {sortedData[activeTab].length === 0 && (
            <div className="p-8 text-center opacity-30 italic">No results found</div>
          )}
        </div>
      </div>
    </div>
  );

  const toggleSort = (category: 'drivers' | 'managers' | 'technicalDirectors' | 'engines', key: string) => {
    setSortConfig(prev => ({
      ...prev,
      [category]: {
        key,
        direction: prev[category].key === key && prev[category].direction === 'desc' ? 'asc' : 'desc'
      }
    }));
  };

  if (!joined) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center space-y-2">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase italic">F1 Auction</h1>
            <p className="font-mono text-[10px] opacity-50 uppercase tracking-widest">Multiplayer Tycoon Game</p>
          </div>

          <div className="space-y-4 bg-white p-8 border border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase opacity-50">Player Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full p-3 border border-[#141414] focus:outline-none focus:ring-2 focus:ring-[#141414] font-mono"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase opacity-50">Room ID</label>
              <input
                type="text"
                placeholder="Enter room code"
                className="w-full p-3 border border-[#141414] focus:outline-none focus:ring-2 focus:ring-[#141414] font-mono"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />
            </div>
            <button
              onClick={joinRoom}
              className="w-full bg-[#141414] text-[#E4E3E0] p-4 font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <LogIn size={18} />
              Join Party
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!room) return <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center font-mono text-sm uppercase tracking-widest">Connecting to server...</div>;

  if (room.status === "lobby") {
    return (
      <div className="min-h-screen bg-[#E4E3E0] text-[#141414] p-6 font-sans">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-end border-b border-[#141414] pb-4">
            <div>
              <h2 className="text-2xl sm:text-4xl font-black uppercase italic tracking-tight">Lobby</h2>
              <p className="font-mono text-[10px] sm:text-xs opacity-50">ROOM: {roomId}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 font-mono text-sm">
                <Users size={16} />
                <span>{room.players.length} Players</span>
              </div>
              <button 
                onClick={leaveRoom}
                className="flex items-center gap-2 font-mono text-[10px] uppercase border border-[#141414] px-3 py-1 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
              >
                <LogOut size={12} />
                Leave
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Players & Start */}
            <div className="lg:col-span-1 space-y-8">
              <div className="space-y-4">
                <h3 className="font-mono text-[10px] uppercase opacity-50 tracking-widest">Players Joined</h3>
                <div className="space-y-2">
                  {room.players.map((p, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={p.id}
                      className="flex items-center justify-between p-3 sm:p-4 bg-white border border-[#141414]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs opacity-30">0{i + 1}</span>
                        <span className="font-bold uppercase tracking-tight text-sm sm:text-base">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {i === 0 && <span className="font-mono text-[8px] sm:text-[10px] bg-[#141414] text-[#E4E3E0] px-2 py-1">HOST</span>}
                        {socket.id === room.players[0]?.id && p.id !== socket.id && (
                          <button 
                            onClick={() => removePlayer(p.id)}
                            className="text-[#141414] hover:text-red-600 transition-colors"
                            title="Remove Player"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 sm:p-8 border border-[#141414] flex flex-col justify-center items-center text-center space-y-6">
                <div className="space-y-2">
                  <p className="font-mono text-xs sm:text-sm">Wait for all players to join before starting the auction.</p>
                  <p className="text-[10px] sm:text-xs opacity-50">Minimum 2 players recommended.</p>
                </div>
                {socket.id === room.players[0]?.id && (
                  <button
                    onClick={startGame}
                    className="w-full bg-[#141414] text-[#E4E3E0] p-4 sm:p-6 font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center justify-center gap-3 text-lg sm:text-xl"
                  >
                    <Play size={20} fill="currentColor" />
                    Start Auction
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Scouting Database */}
            <div className="lg:col-span-2 space-y-4">
              {renderScoutingDatabase()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (room.status === "engine-selection") {
    const currentPlayer = room.players.find(p => p.id === socket.id);
    const hasChosen = !!currentPlayer?.engine;

    return (
      <div className="min-h-screen bg-[#E4E3E0] text-[#141414] p-6 font-sans">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black uppercase italic tracking-tight">Choose Your Engine</h2>
            <p className="font-mono text-[10px] sm:text-xs opacity-50 uppercase tracking-widest">Fixed cost will be deducted from your $1000M budget</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ENGINE_SUPPLIERS.map((engine) => (
              <motion.div
                whileHover={!hasChosen ? { scale: 1.02 } : {}}
                key={engine.manufacturer}
                className={cn(
                  "bg-white border-2 p-6 space-y-4 transition-all",
                  currentPlayer?.engine?.manufacturer === engine.manufacturer 
                    ? "border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]" 
                    : "border-transparent shadow-sm",
                  hasChosen && currentPlayer?.engine?.manufacturer !== engine.manufacturer && "opacity-50 grayscale"
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-black uppercase italic">{engine.manufacturer}</h3>
                    <p className="font-mono text-[10px] opacity-50 uppercase">Power Unit Supplier</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black tracking-tighter">{engine.overall_rating}</p>
                    <p className="font-mono text-[10px] opacity-50 uppercase">Rating</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
                  <div className="space-y-1">
                    <p className="font-mono text-[10px] opacity-50 uppercase">Power</p>
                    <div className="h-2 bg-gray-100 overflow-hidden">
                      <div className="h-full bg-green-600" style={{ width: `${engine.power}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="font-mono text-[10px] opacity-50 uppercase">Reliability</p>
                    <div className="h-2 bg-gray-100 overflow-hidden">
                      <div className="h-full bg-blue-600" style={{ width: `${engine.reliability}%` }} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <p className="text-xl font-bold font-mono">${engine.fixed_cost}M</p>
                  {!hasChosen ? (
                    <button
                      onClick={() => chooseEngine(engine.manufacturer)}
                      className="bg-[#141414] text-[#E4E3E0] px-6 py-2 font-bold uppercase text-xs hover:bg-opacity-90 transition-all"
                    >
                      Select Engine
                    </button>
                  ) : currentPlayer?.engine?.manufacturer === engine.manufacturer ? (
                    <span className="font-mono text-[10px] bg-green-100 text-green-800 px-2 py-1 font-bold">SELECTED</span>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-white p-6 border border-[#141414] text-center">
            <p className="font-mono text-sm">
              {hasChosen 
                ? "Waiting for other players to choose their engines..." 
                : "Select an engine to proceed to the auction."}
            </p>
            <div className="flex justify-center gap-2 mt-4">
              {room.players.map(p => (
                <div 
                  key={p.id}
                  className={cn(
                    "w-3 h-3 rounded-full border border-[#141414]",
                    p.engine ? "bg-[#141414]" : "bg-transparent"
                  )}
                  title={p.name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (room.status === "auction") {
    const currentPlayer = room.players.find(p => p.id === socket.id);
    const highestBidderName = room.players.find(p => p.id === room.highestBidder)?.name || "No bids yet";
    const isLastPick = room.itemIndex === room.auctionQueue.length - 1;

    const hasReachedLimit = (
      (room.itemType === "driver" && (currentPlayer?.drivers.length || 0) >= 2) ||
      (room.itemType === "manager" && !!currentPlayer?.manager) ||
      (room.itemType === "technicalDirector" && !!currentPlayer?.technicalDirector)
    );

    return (
      <div className="min-h-screen bg-[#E4E3E0] text-[#141414] p-4 sm:p-6 font-sans overflow-x-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#141414] pb-4 mb-4 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-6">
            <h2 className="text-lg sm:text-2xl font-black uppercase italic tracking-tight">Auction Live</h2>
            <div className="flex items-center gap-2 bg-white px-2 sm:px-3 py-1 border border-[#141414] font-mono text-[10px] sm:text-xs">
              <Timer size={12} />
              <span>{room.timer}s</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setShowScouting(true)}
              className="flex items-center gap-2 bg-white border border-[#141414] px-3 py-1 sm:py-2 font-mono text-xs sm:text-sm hover:bg-gray-100 transition-all"
            >
              <Search size={14} />
              <span className="hidden sm:inline">Scouting</span>
            </button>
            <div className="flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-3 sm:px-4 py-1 sm:py-2 border border-[#141414] font-mono text-xs sm:text-sm">
              <Wallet size={14} />
              <span>${currentPlayer?.budget}M</span>
            </div>
            <button 
              onClick={leaveRoom}
              className="font-mono text-[8px] sm:text-[10px] uppercase border border-[#141414] px-2 py-1 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
            >
              Leave
            </button>
          </div>
        </div>

        {/* Scouting Modal */}
        <AnimatePresence>
          {showScouting && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowScouting(false)}
                className="absolute inset-0 bg-[#141414]/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-2xl bg-[#E4E3E0] border border-[#141414] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-8 overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black uppercase italic tracking-tight">Scouting Database</h2>
                  <button 
                    onClick={() => setShowScouting(false)}
                    className="p-2 hover:bg-white border border-transparent hover:border-[#141414] transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="overflow-y-auto pr-2">
                  {renderScoutingDatabase()}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Main Item Display */}
          <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6">
            <AnimatePresence mode="wait">
              {room.currentItem && (
                <motion.div
                  key={room.currentItem.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="flex-1 min-h-[300px] bg-white border border-[#141414] p-6 sm:p-12 flex flex-col justify-center relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                    <motion.div 
                      className="h-full bg-[#141414]"
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: room.timer, ease: "linear" }}
                      key={room.itemIndex}
                    />
                  </div>

                  <div className="space-y-4 sm:space-y-8 relative z-10">
                    <div className="space-y-1 sm:space-y-2">
                      <span className="font-mono text-[10px] sm:text-xs uppercase opacity-50 tracking-[0.2em]">
                        {room.itemType === 'technicalDirector' ? 'Technical Director' : room.itemType}
                      </span>
                      <h3 className="text-4xl sm:text-7xl font-black uppercase italic leading-none tracking-tighter">{room.currentItem.name}</h3>
                      <p className="font-mono text-sm sm:text-lg opacity-70">
                        {"status" in room.currentItem ? room.currentItem.status : room.currentItem.era}
                      </p>
                    </div>

                    <div className="flex items-baseline gap-2 sm:gap-4">
                      <span className="text-6xl sm:text-9xl font-black tracking-tighter">{room.currentItem.rating}</span>
                      <span className="font-mono text-sm sm:text-xl uppercase opacity-50">Rating</span>
                    </div>
                  </div>

                  {/* Bid Info Overlay */}
                  <div className="absolute bottom-6 right-6 sm:bottom-12 sm:right-12 text-right space-y-1 sm:space-y-2">
                    {hasReachedLimit ? (
                      <div className="bg-red-600 text-white px-4 py-2 font-black uppercase italic tracking-widest text-sm sm:text-xl transform -rotate-2">
                        MAX REACHED
                      </div>
                    ) : (
                      <>
                        <p className="font-mono text-[10px] sm:text-xs uppercase opacity-50">Current Bid</p>
                        <p className="text-3xl sm:text-6xl font-black tracking-tighter">${room.currentBid}M</p>
                        <p className="font-mono text-[10px] sm:text-sm font-bold uppercase truncate max-w-[150px] sm:max-w-none">{highestBidderName}</p>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bidding Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              {[10, 50, 100, 250].map((amount) => (
                <button
                  key={amount}
                  onClick={() => placeBid(room.currentBid + amount)}
                  disabled={hasReachedLimit || (currentPlayer && currentPlayer.budget < room.currentBid + amount)}
                  className="bg-white border border-[#141414] p-3 sm:p-6 font-bold text-sm sm:text-xl hover:bg-[#141414] hover:text-[#E4E3E0] transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#141414]"
                >
                  +${amount}M
                </button>
              ))}
              {isLastPick && (
                <button
                  onClick={() => placeBid(currentPlayer?.budget || 0)}
                  disabled={hasReachedLimit || !currentPlayer || currentPlayer.budget <= room.currentBid}
                  className="col-span-2 sm:col-span-4 bg-red-600 text-white border border-[#141414] p-3 sm:p-6 font-black text-sm sm:text-xl hover:bg-red-700 transition-all disabled:opacity-30 uppercase tracking-widest"
                >
                  All In (${currentPlayer?.budget}M)
                </button>
              )}
            </div>

            {/* Upcoming Items */}
            <div className="bg-white border border-[#141414] p-3 sm:p-4 overflow-x-auto">
              <h4 className="font-mono text-[10px] uppercase opacity-50 tracking-widest mb-3">Upcoming Items</h4>
              <div className="flex gap-3 sm:gap-4 min-w-max">
                {upcomingItems.map((item, i) => (
                  <div key={item.name} className="w-32 sm:flex-1 p-2 sm:p-3 border border-gray-100 flex flex-col gap-1">
                    <span className="font-mono text-[8px] uppercase opacity-50">Next {i + 1}</span>
                    <span className="font-bold uppercase text-[10px] sm:text-xs truncate">{item.name}</span>
                    <span className="font-mono text-[8px] sm:text-[10px] opacity-70 italic">{item.rating} Rating</span>
                  </div>
                ))}
                {upcomingItems.length === 0 && <p className="text-[10px] font-mono opacity-50">Final items in auction...</p>}
              </div>
            </div>
          </div>

          {/* Sidebar: Players & Team */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-6 overflow-y-auto max-h-[400px] lg:max-h-[calc(100vh-120px)] pr-2">
            <h4 className="font-mono text-[10px] uppercase opacity-50 tracking-widest sticky top-0 bg-[#E4E3E0] py-2 z-20">Player Status</h4>
            
            {room.players.map(p => (
              <div key={p.id} className={cn(
                "bg-white border border-[#141414] p-3 sm:p-4 space-y-2 sm:space-y-3 transition-all",
                p.id === socket.id ? "ring-2 ring-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]" : "opacity-80"
              )}>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="font-black uppercase italic text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{p.name} {p.id === socket.id && "(YOU)"}</span>
                  <span className="font-mono text-[10px] sm:text-xs font-bold">${p.budget}M</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="font-mono text-[8px] uppercase opacity-50">Drivers</p>
                    {p.drivers.length > 0 ? p.drivers.map(d => (
                      <div key={d.name} className="text-[8px] sm:text-[10px] font-mono truncate">{d.name} ({d.rating})</div>
                    )) : <p className="text-[8px] sm:text-[10px] font-mono opacity-30 italic">None</p>}
                  </div>
                  <div className="space-y-1">
                    <p className="font-mono text-[8px] uppercase opacity-50">Team & Engine</p>
                    <div className="text-[8px] sm:text-[10px] font-mono truncate">
                      {p.manager ? `${p.manager.name} (${p.manager.rating})` : <span className="opacity-30 italic">No Manager</span>}
                    </div>
                    <div className="text-[8px] sm:text-[10px] font-mono truncate">
                      {p.technicalDirector ? `${p.technicalDirector.name} (${p.technicalDirector.rating})` : <span className="opacity-30 italic">No Tech Director</span>}
                    </div>
                    <div className="text-[8px] sm:text-[10px] font-mono truncate">
                      {p.engine ? `${p.engine.manufacturer} (${p.engine.overall_rating})` : <span className="opacity-30 italic">No Engine</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-1">
                  <span className="font-mono text-[8px] uppercase opacity-50">Current Score</span>
                  <span className="font-black text-base sm:text-lg">{calculateScore(p)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sold Notification */}
        <AnimatePresence>
          {lastSold && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-[#141414] text-[#E4E3E0] px-8 py-4 border border-[#141414] shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] z-50 flex items-center gap-4"
            >
              <div className="bg-white text-[#141414] p-2 rounded-full">
                <Trophy size={20} />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase opacity-50">Item Sold</p>
                <p className="font-bold uppercase tracking-tight">
                  <span className="text-yellow-400">{lastSold.winner}</span> won <span className="italic">{lastSold.item}</span> for ${lastSold.price}M
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (room.status === "results") {
    const sortedPlayers = [...room.players].sort((a, b) => calculateScore(b) - calculateScore(a));

    return (
      <div className="min-h-screen bg-[#E4E3E0] text-[#141414] p-4 sm:p-6 font-sans">
        <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12">
          <div className="text-center space-y-2 sm:space-y-4">
            <h2 className="text-4xl sm:text-8xl font-black uppercase italic tracking-tighter leading-none">Grand Prix Results</h2>
            <p className="font-mono text-[10px] sm:text-sm uppercase tracking-[0.3em] opacity-50">Final Team Ratings</p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {sortedPlayers.map((p, i) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={p.id}
                className={cn(
                  "flex items-center justify-between p-4 sm:p-8 border border-[#141414] relative overflow-hidden",
                  i === 0 ? "bg-[#141414] text-[#E4E3E0] shadow-[8px_8px_0px_0px_rgba(20,20,20,0.2)] sm:shadow-[12px_12px_0px_0px_rgba(20,20,20,0.2)]" : "bg-white"
                )}
              >
                <div className="flex items-center gap-4 sm:gap-8 relative z-10">
                  <span className="text-2xl sm:text-4xl font-black italic opacity-20">{i + 1}</span>
                  <div>
                    <h3 className="text-xl sm:text-3xl font-black uppercase italic tracking-tight truncate max-w-[150px] sm:max-w-none">{p.name}</h3>
                    <div className="flex flex-wrap gap-2 sm:gap-4 font-mono text-[8px] sm:text-[10px] uppercase opacity-60">
                      <span>{p.drivers.length} Drivers</span>
                      <span>{p.manager ? "Manager OK" : "No Manager"}</span>
                      <span>{p.technicalDirector ? "Tech OK" : "No Tech"}</span>
                      <span>{p.engine ? "Engine OK" : "No Engine"}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right relative z-10">
                  <p className="font-mono text-[8px] sm:text-xs uppercase opacity-50">Total Rating</p>
                  <p className="text-3xl sm:text-6xl font-black tracking-tighter">{calculateScore(p)}</p>
                </div>
                {i === 0 && (
                  <div className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 opacity-10">
                    <Trophy size={80} className="sm:w-[120px] sm:h-[120px]" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center pt-8">
            <button
              onClick={() => window.location.reload()}
              className="bg-[#141414] text-[#E4E3E0] px-12 py-4 font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all"
            >
              New Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export interface Driver {
  rank: number;
  name: string;
  status: string;
  rating: number;
}

export interface Manager {
  rank: number;
  name: string;
  era: string;
  rating: number;
}

export interface TechnicalDirector {
  rank: number;
  name: string;
  era: string;
  rating: number;
}

export interface EngineSupplier {
  manufacturer: string;
  overall_rating: number;
  power: number;
  reliability: number;
  fixed_cost: number;
}

export const DRIVERS: Driver[] = [
  { rank: 1, name: "Ayrton Senna", status: "Legend", rating: 99 },
  { rank: 2, name: "Michael Schumacher", status: "Legend", rating: 99 },
  { rank: 3, name: "Lewis Hamilton", status: "Current", rating: 99 },
  { rank: 4, name: "Juan Manuel Fangio", status: "Legend", rating: 98 },
  { rank: 5, name: "Max Verstappen", status: "Current", rating: 98 },
  { rank: 6, name: "Alain Prost", status: "Legend", rating: 98 },
  { rank: 7, name: "Jim Clark", status: "Legend", rating: 97 },
  { rank: 8, name: "Niki Lauda", status: "Legend", rating: 96 },
  { rank: 9, name: "Jackie Stewart", status: "Legend", rating: 96 },
  { rank: 10, name: "Fernando Alonso", status: "Current", rating: 96 },
  { rank: 11, name: "Sebastian Vettel", status: "Recent", rating: 95 },
  { rank: 12, name: "Mika Häkkinen", status: "Legend", rating: 94 },
  { rank: 13, name: "Nelson Piquet", status: "Legend", rating: 93 },
  { rank: 14, name: "Nigel Mansell", status: "Legend", rating: 93 },
  { rank: 15, name: "Kimi Räikkönen", status: "Recent", rating: 92 },
  { rank: 16, name: "Emerson Fittipaldi", status: "Legend", rating: 92 },
  { rank: 17, name: "Stirling Moss", status: "Legend", rating: 92 },
  { rank: 18, name: "Jack Brabham", status: "Legend", rating: 91 },
  { rank: 19, name: "Alberto Ascari", status: "Legend", rating: 91 },
  { rank: 20, name: "Charles Leclerc", status: "Current", rating: 90 },
  { rank: 21, name: "Lando Norris", status: "Current", rating: 89 },
  { rank: 22, name: "Jenson Button", status: "Recent", rating: 89 },
  { rank: 23, name: "Nico Rosberg", status: "Recent", rating: 89 },
  { rank: 24, name: "Gilles Villeneuve", status: "Legend", rating: 89 },
  { rank: 25, name: "George Russell", status: "Current", rating: 88 },
  { rank: 26, name: "Damon Hill", status: "Legend", rating: 88 },
  { rank: 27, name: "Carlos Sainz", status: "Current", rating: 87 },
  { rank: 28, name: "Oscar Piastri", status: "Current", rating: 87 },
  { rank: 29, name: "Daniel Ricciardo", status: "Recent", rating: 86 },
  { rank: 30, name: "Graham Hill", status: "Legend", rating: 86 },
  { rank: 31, name: "Jacques Villeneuve", status: "Legend", rating: 86 },
  { rank: 32, name: "Sergio Pérez", status: "Current", rating: 85 },
  { rank: 33, name: "Valtteri Bottas", status: "Current", rating: 84 },
  { rank: 34, name: "Keke Rosberg", status: "Legend", rating: 84 },
  { rank: 35, name: "John Surtees", status: "Legend", rating: 84 },
  { rank: 36, name: "James Hunt", status: "Legend", rating: 83 },
  { rank: 37, name: "Mario Andretti", status: "Legend", rating: 83 },
  { rank: 38, name: "Pierre Gasly", status: "Current", rating: 82 },
  { rank: 39, name: "Esteban Ocon", status: "Current", rating: 81 },
  { rank: 40, name: "Alex Albon", status: "Current", rating: 80 },
];

export const MANAGERS: Manager[] = [
  { rank: 1, name: "Colin Chapman", era: "Lotus", rating: 98 },
  { rank: 2, name: "Jean Todt", era: "Ferrari", rating: 98 },
  { rank: 3, name: "Enzo Ferrari", era: "Ferrari", rating: 98 },
  { rank: 4, name: "Ron Dennis", era: "McLaren", rating: 97 },
  { rank: 5, name: "Ross Brawn", era: "Brawn GP / Ferrari / Mercedes", rating: 97 },
  { rank: 6, name: "Toto Wolff", era: "Mercedes (Current)", rating: 96 },
  { rank: 7, name: "Christian Horner", era: "Red Bull (Current)", rating: 96 },
  { rank: 8, name: "Frank Williams", era: "Williams", rating: 95 },
  { rank: 9, name: "Bruce McLaren", era: "McLaren", rating: 94 },
  { rank: 10, name: "Ken Tyrrell", era: "Tyrrell", rating: 93 },
  { rank: 11, name: "Flavio Briatore", era: "Benetton / Renault", rating: 90 },
  { rank: 12, name: "Peter Sauber", era: "Sauber", rating: 89 },
  { rank: 13, name: "Frédéric Vasseur", era: "Ferrari (Current)", rating: 88 },
  { rank: 14, name: "Andrea Stella", era: "McLaren (Current)", rating: 87 },
  { rank: 15, name: "Guenther Steiner", era: "Haas (Recent)", rating: 84 },
  { rank: 16, name: "James Vowles", era: "Williams (Current)", rating: 84 },
  { rank: 17, name: "Franz Tost", era: "Toro Rosso / AlphaTauri", rating: 83 },
  { rank: 18, name: "Mike Krack", era: "Aston Martin (Current)", rating: 82 },
  { rank: 19, name: "Laurent Mekies", era: "RB (Current)", rating: 81 },
  { rank: 20, name: "Ayao Komatsu", era: "Haas (Current)", rating: 80 },
];

export const TECHNICAL_DIRECTORS: TechnicalDirector[] = [
  { rank: 1, name: "Adrian Newey", era: "Red Bull / McLaren / Williams", rating: 100 },
  { rank: 2, name: "Rory Byrne", era: "Ferrari / Benetton", rating: 99 },
  { rank: 3, name: "Ross Brawn", era: "Ferrari / Benetton", rating: 99 },
  { rank: 4, name: "Colin Chapman", era: "Lotus", rating: 98 },
  { rank: 5, name: "Mauro Forghieri", era: "Ferrari", rating: 97 },
  { rank: 6, name: "Patrick Head", era: "Williams", rating: 96 },
  { rank: 7, name: "John Barnard", era: "McLaren / Ferrari", rating: 95 },
  { rank: 8, name: "Aldo Costa", era: "Mercedes / Ferrari", rating: 95 },
  { rank: 9, name: "James Allison", era: "Mercedes / Ferrari / Renault", rating: 95 },
  { rank: 10, name: "Gordon Murray", era: "Brabham / McLaren", rating: 94 },
  { rank: 11, name: "Paddy Lowe", era: "Mercedes / McLaren", rating: 94 },
  { rank: 12, name: "Geoff Willis", era: "Mercedes / Red Bull / Williams", rating: 93 },
  { rank: 13, name: "Pierre Waché", era: "Red Bull (Current)", rating: 92 },
  { rank: 14, name: "Enrico Cardile", era: "Ferrari (Recent)", rating: 91 },
  { rank: 15, name: "Dan Fallows", era: "Aston Martin (Current)", rating: 90 },
  { rank: 16, name: "Rob Marshall", era: "McLaren (Current)", rating: 89 },
  { rank: 17, name: "James Key", era: "Sauber (Current)", rating: 88 },
  { rank: 18, name: "Pat Fry", era: "Williams (Current)", rating: 87 },
  { rank: 19, name: "Mattia Binotto", era: "Audi (Current)", rating: 86 },
  { rank: 20, name: "Simone Resta", era: "Mercedes (Recent)", rating: 84 },
];

export const ENGINE_SUPPLIERS: EngineSupplier[] = [
  {
    manufacturer: "Mercedes",
    overall_rating: 96,
    power: 98,
    reliability: 94,
    fixed_cost: 24.5
  },
  {
    manufacturer: "Ferrari",
    overall_rating: 95,
    power: 99,
    reliability: 91,
    fixed_cost: 22.0
  },
  {
    manufacturer: "Honda",
    overall_rating: 94,
    power: 95,
    reliability: 97,
    fixed_cost: 19.5
  },
  {
    manufacturer: "Audi",
    overall_rating: 92,
    power: 93,
    reliability: 91,
    fixed_cost: 16.0
  }
];

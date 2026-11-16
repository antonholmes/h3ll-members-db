export type Member = {
  name: string;
  rank: string;
  level: number | null;
  power: number;
  squadPower: number | null;
  squadType: string;
  squadBase: string;
};
export type RosterData = {
  updatedAt: string;
  source: string;
  members: Member[];
};

export type Event = {
  registered: string;
  team: string;
  enlisted: string;
  attended: string;
};
export type StormMember = {
  name: string;
  rank: string;
  power: number;
  squadPower: number | null;
  squadType: string;
  squadBase: string;
  events: Record<string, Event>;
};
export type StormData = {
  updatedAt: string;
  source: string;
  dates: string[];
  members: StormMember[];
};

export type HistoryRow = {
  savedAt: string;
  date: string;
  name: string;
  rank: string;
  power: number;
  squadPower: number | null;
  registered: string;
  team: string;
  enlisted: string;
  attended: string;
  assigned: string;
};
export type HistoryData = { dates: string[]; rows: HistoryRow[] };

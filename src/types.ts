export type Member = {
  name: string;
  rank: string;
  level: number | null;
  power: number;
  squadPower: number | null;
  squadType: string;
  squadBase: string;
};
export type RosterData = { updatedAt: string; source: string; members: Member[] };

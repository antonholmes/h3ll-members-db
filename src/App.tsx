import { useMemo, useState } from "react";
import data from "./data/roster.json";
import type { RosterData } from "./types";
import Filters from "./components/Filters";
import RosterTable from "./components/RosterTable";
import SummaryStrip from "./components/SummaryStrip";
import TypeBreakdown from "./components/TypeBreakdown";

const roster = data as RosterData;

export default function App() {
  const [tab, setTab] = useState<"roster" | "types">("roster");
  const [search, setSearch] = useState("");
  const [rank, setRank] = useState("");
  const [type, setType] = useState("");

  const ranks = useMemo(() => [...new Set(roster.members.map((m) => m.rank))].sort().reverse(), []);
  const types = useMemo(() => [...new Set(roster.members.map((m) => m.squadBase))].sort(), []);
  const filtered = useMemo(
    () =>
      roster.members.filter(
        (m) =>
          (!rank || m.rank === rank) &&
          (!type || m.squadBase === type) &&
          m.name.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [search, rank, type],
  );

  const tabCls = (t: string) =>
    `rounded-md px-3 py-1.5 text-sm ${tab === t ? "bg-red-600 text-white" : "text-zinc-400 hover:text-zinc-100"}`;

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">H3ll Members DB</h1>
        <span className="text-xs text-zinc-500">Updated {new Date(roster.updatedAt).toLocaleString()}</span>
      </header>
      <SummaryStrip members={filtered} />
      <nav className="flex gap-1">
        <button className={tabCls("roster")} onClick={() => setTab("roster")}>
          Roster
        </button>
        <button className={tabCls("types")} onClick={() => setTab("types")}>
          Squad types
        </button>
      </nav>
      <Filters
        search={search}
        onSearch={setSearch}
        rank={rank}
        onRank={setRank}
        type={type}
        onType={setType}
        ranks={ranks}
        types={types}
      />
      {tab === "roster" ? <RosterTable members={filtered} /> : <TypeBreakdown members={filtered} />}
    </div>
  );
}

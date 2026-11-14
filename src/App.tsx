import { useMemo, useState } from "react";
import data from "./data/roster.json";
import type { RosterData } from "./types";
import Filters from "./components/Filters";
import RosterTable from "./components/RosterTable";
import SquadCards from "./components/SquadCards";
import SummaryStrip from "./components/SummaryStrip";

const roster = data as RosterData;

export default function App() {
  const [tab, setTab] = useState<"roster" | "squads">("roster");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [squad, setSquad] = useState("");

  const roles = useMemo(() => [...new Set(roster.members.map((m) => m.role))].sort(), []);
  const squads = useMemo(() => [...new Set(roster.members.map((m) => m.squad))].sort(), []);
  const filtered = useMemo(
    () =>
      roster.members.filter(
        (m) =>
          (!role || m.role === role) &&
          (!squad || m.squad === squad) &&
          m.name.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [search, role, squad],
  );

  const tabCls = (t: string) =>
    `rounded-md px-3 py-1.5 text-sm ${tab === t ? "bg-red-600 text-white" : "text-zinc-400 hover:text-zinc-100"}`;

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">H3ll Members DB</h1>
        <span className="text-xs text-zinc-500">
          Updated {new Date(roster.updatedAt).toLocaleString()}
        </span>
      </header>
      <SummaryStrip members={filtered} />
      <nav className="flex gap-1">
        <button className={tabCls("roster")} onClick={() => setTab("roster")}>
          Roster
        </button>
        <button className={tabCls("squads")} onClick={() => setTab("squads")}>
          Squads
        </button>
      </nav>
      <Filters
        search={search}
        onSearch={setSearch}
        role={role}
        onRole={setRole}
        squad={squad}
        onSquad={setSquad}
        roles={roles}
        squads={squads}
      />
      {tab === "roster" ? <RosterTable members={filtered} /> : <SquadCards members={filtered} />}
    </div>
  );
}

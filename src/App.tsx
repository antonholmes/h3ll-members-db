import { useCallback, useEffect, useMemo, useState } from "react";
import data from "./data/roster.json";
import type { RosterData } from "./types";
import Filters from "./components/Filters";
import RosterTable from "./components/RosterTable";
import SummaryStrip from "./components/SummaryStrip";
import TypeBreakdown from "./components/TypeBreakdown";
import AdminBox from "./components/AdminBox";
import DesertStorm from "./components/DesertStorm";

const roster = data as RosterData;

export default function App() {
  const [tab, setTab] = useState<"roster" | "types" | "storm">("roster");
  const [search, setSearch] = useState("");
  const [rank, setRank] = useState("");
  const [type, setType] = useState("");
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((b) => setAdmin(!!b.admin))
      .catch(() => {});
  }, []);

  const loggedOut = useCallback(() => {
    setAdmin(false);
    setTab("roster");
  }, []);

  const ranks = useMemo(
    () => [...new Set(roster.members.map((m) => m.rank))].sort().reverse(),
    [],
  );
  const types = useMemo(
    () => [...new Set(roster.members.map((m) => m.squadBase))].sort(),
    [],
  );
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
        <span className="text-xs text-zinc-500">
          Updated {new Date(roster.updatedAt).toLocaleString()}
        </span>
      </header>
      {tab !== "storm" && (
        <SummaryStrip members={filtered}>
          <AdminBox
            admin={admin}
            onLogin={() => setAdmin(true)}
            onLogout={loggedOut}
          />
        </SummaryStrip>
      )}
      <nav className="flex gap-1">
        <button className={tabCls("roster")} onClick={() => setTab("roster")}>
          Roster
        </button>
        <button className={tabCls("types")} onClick={() => setTab("types")}>
          Squad types
        </button>
        {admin && (
          <button className={tabCls("storm")} onClick={() => setTab("storm")}>
            Desert Storm
          </button>
        )}
      </nav>
      {tab !== "storm" && (
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
      )}
      {tab === "roster" && <RosterTable members={filtered} />}
      {tab === "types" && <TypeBreakdown members={filtered} />}
      {tab === "storm" && admin && <DesertStorm onUnauthorized={loggedOut} />}
    </div>
  );
}

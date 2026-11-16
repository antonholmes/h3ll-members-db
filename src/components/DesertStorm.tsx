import { useEffect, useMemo, useState } from "react";
import { formatPower } from "../format";
import type { StormData, StormMember } from "../types";

const dash = "—";

const field =
  "rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm outline-none focus:border-red-500";

function defaultDate(storm: StormData): string {
  const withData = storm.dates.filter((d) =>
    storm.members.some((m) => m.events[d]?.registered),
  );
  return withData[withData.length - 1] ?? storm.dates[storm.dates.length - 1];
}

function fmtDate(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function DesertStorm({
  onUnauthorized,
}: {
  onUnauthorized: () => void;
}) {
  const [storm, setStorm] = useState<StormData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    fetch("/api/desert-storm")
      .then(async (res) => {
        if (res.status === 401) return onUnauthorized();
        const body = await res.json().catch(() => ({}));
        if (!live) return;
        if (!res.ok) setError(body.error ?? "Failed to load Desert Storm data");
        else setStorm(body);
      })
      .catch(() => live && setError("Could not reach the server"));
    return () => {
      live = false;
    };
  }, [onUnauthorized]);

  if (error)
    return (
      <pre className="whitespace-pre-wrap rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
        {error}
      </pre>
    );
  if (!storm) return <div className="text-sm text-zinc-500">Loading…</div>;
  return <DesertStormView storm={storm} />;
}

function DesertStormView({ storm }: { storm: StormData }) {
  const [date, setDate] = useState(() => defaultDate(storm));
  const [search, setSearch] = useState("");
  const [team, setTeam] = useState("");
  const [enlisted, setEnlisted] = useState("");
  const [registeredOnly, setRegisteredOnly] = useState(false);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return storm.members
      .filter((m) => {
        const e = m.events[date];
        return (
          m.name.toLowerCase().includes(q) &&
          (!team || e.team === team) &&
          (!enlisted || e.enlisted === enlisted) &&
          (!registeredOnly || e.registered === "Yes")
        );
      })
      .sort((a, b) => b.power - a.power);
  }, [storm, date, search, team, enlisted, registeredOnly]);

  const all = storm.members.map((m) => m.events[date]);
  const count = (fn: (e: (typeof all)[number]) => boolean) =>
    all.filter(fn).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1">
        {storm.dates.map((d) => (
          <button
            key={d}
            onClick={() => setDate(d)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              d === date
                ? "bg-zinc-100 text-zinc-900"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-100"
            }`}
          >
            {fmtDate(d)}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <Stat label="Registered" value={count((e) => e.registered === "Yes")} />
        <Stat label="Team A" value={count((e) => e.team === "A")} />
        <Stat label="Team B" value={count((e) => e.team === "B")} />
        <Stat label="Starters" value={count((e) => e.enlisted === "Starter")} />
        <Stat label="Subs" value={count((e) => e.enlisted === "Sub")} />
        <Stat label="Attended" value={count((e) => e.attended === "Yes")} />
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <input
          className={`${field} min-w-[12rem] flex-1`}
          placeholder="Search username…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={field}
          value={team}
          onChange={(e) => setTeam(e.target.value)}
        >
          <option value="">All teams</option>
          <option>A</option>
          <option>B</option>
        </select>
        <select
          className={field}
          value={enlisted}
          onChange={(e) => setEnlisted(e.target.value)}
        >
          <option value="">All enlisted</option>
          <option>Starter</option>
          <option>Sub</option>
          <option>No</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={registeredOnly}
            onChange={(e) => setRegisteredOnly(e.target.checked)}
          />
          Registered only
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-2">Username</th>
              <th className="px-3 py-2">R</th>
              <th className="px-3 py-2 text-right">Total power</th>
              <th className="px-3 py-2 text-right">Squad 1 power</th>
              <th className="px-3 py-2">Registered</th>
              <th className="px-3 py-2">Team</th>
              <th className="px-3 py-2">Enlisted</th>
              <th className="px-3 py-2">Attended</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m, i) => (
              <Row key={`${m.name}-${i}`} m={m} date={date} />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-zinc-500">
                  No members match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ m, date }: { m: StormMember; date: string }) {
  const e = m.events[date];
  const yes = (v: string) =>
    v === "Yes" ? (
      <span className="text-green-400">Yes</span>
    ) : v === "No" ? (
      <span className="text-zinc-500">No</span>
    ) : (
      dash
    );
  return (
    <tr className="border-t border-zinc-800 hover:bg-zinc-900/60">
      <td className="px-3 py-1.5">{m.name}</td>
      <td className="px-3 py-1.5">{m.rank || dash}</td>
      <td className="px-3 py-1.5 text-right tabular-nums">
        {formatPower(m.power)}
      </td>
      <td className="px-3 py-1.5 text-right tabular-nums">
        {m.squadPower === null ? dash : formatPower(m.squadPower)}
      </td>
      <td className="px-3 py-1.5">{yes(e.registered)}</td>
      <td className="px-3 py-1.5">{e.team || dash}</td>
      <td className="px-3 py-1.5">{e.enlisted || dash}</td>
      <td className="px-3 py-1.5">{yes(e.attended)}</td>
    </tr>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

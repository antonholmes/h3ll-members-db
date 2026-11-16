import { useEffect, useMemo, useState } from "react";
import { formatPower } from "../format";
import type { HistoryData, HistoryRow } from "../types";

const dash = "—";

function fmtDate(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function summarize(rows: HistoryRow[], team: "A" | "B") {
  const mine = rows.filter((r) => r.assigned.startsWith(`${team} `));
  return {
    strength: mine.reduce((s, r) => s + (r.squadPower ?? 0), 0),
    starters: mine.filter((r) => r.assigned === `${team} Starter`).length,
    subs: mine.filter((r) => r.assigned === `${team} Sub`).length,
    attended: mine.filter((r) => r.attended === "Yes").length,
    total: mine.length,
  };
}

export default function HistoryView({
  onUnauthorized,
}: {
  onUnauthorized: () => void;
}) {
  const [data, setData] = useState<HistoryData | null>(null);
  const [error, setError] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    let live = true;
    fetch("/api/history")
      .then(async (res) => {
        if (res.status === 401) return onUnauthorized();
        const body = await res.json().catch(() => ({}));
        if (!live) return;
        if (!res.ok) setError(body.error ?? "Failed to load history");
        else {
          setData(body);
          setDate(body.dates[body.dates.length - 1] ?? "");
        }
      })
      .catch(() => live && setError("Could not reach the server"));
    return () => {
      live = false;
    };
  }, [onUnauthorized]);

  const weeks = useMemo(
    () =>
      (data?.dates ?? []).map((d) => {
        const rows = data!.rows.filter((r) => r.date === d);
        return { date: d, a: summarize(rows, "A"), b: summarize(rows, "B") };
      }),
    [data],
  );

  if (error)
    return (
      <pre className="whitespace-pre-wrap rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
        {error}
      </pre>
    );
  if (!data) return <div className="text-sm text-zinc-500">Loading…</div>;
  if (!data.dates.length)
    return (
      <div className="text-sm text-zinc-500">
        No history saved yet. Use "Save to history" on the Desert Storm tab.
      </div>
    );

  const rows = data.rows
    .filter((r) => r.date === date)
    .sort((a, b) => b.power - a.power);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2 text-right">A strength</th>
              <th className="px-3 py-2 text-right">A starters / subs</th>
              <th className="px-3 py-2 text-right">B strength</th>
              <th className="px-3 py-2 text-right">B starters / subs</th>
              <th className="px-3 py-2 text-right">Attended (assigned)</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((w) => (
              <tr
                key={w.date}
                onClick={() => setDate(w.date)}
                className={`cursor-pointer border-t border-zinc-800 hover:bg-zinc-900/60 ${w.date === date ? "bg-zinc-900" : ""}`}
              >
                <td className="px-3 py-1.5">{fmtDate(w.date)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {formatPower(w.a.strength)}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {w.a.starters} / {w.a.subs}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {formatPower(w.b.strength)}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {w.b.starters} / {w.b.subs}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {w.a.attended + w.b.attended} of {w.a.total + w.b.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-sm font-semibold text-zinc-400">
        {fmtDate(date)} roster
      </h3>
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-2">Username</th>
              <th className="px-3 py-2">R</th>
              <th className="px-3 py-2 text-right">Squad 1 power</th>
              <th className="px-3 py-2">Registered</th>
              <th className="px-3 py-2">Sheet team</th>
              <th className="px-3 py-2">Enlisted</th>
              <th className="px-3 py-2">Assigned</th>
              <th className="px-3 py-2">Attended</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={`${r.name}-${i}`}
                className="border-t border-zinc-800 hover:bg-zinc-900/60"
              >
                <td className="px-3 py-1.5">{r.name}</td>
                <td className="px-3 py-1.5">{r.rank || dash}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {r.squadPower === null ? dash : formatPower(r.squadPower)}
                </td>
                <td className="px-3 py-1.5">{r.registered || dash}</td>
                <td className="px-3 py-1.5">{r.team || dash}</td>
                <td className="px-3 py-1.5">{r.enlisted || dash}</td>
                <td className="px-3 py-1.5 text-sky-300">
                  {r.assigned || dash}
                </td>
                <td className="px-3 py-1.5">{r.attended || dash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

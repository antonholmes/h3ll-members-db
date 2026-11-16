import type { ReactNode } from "react";
import { formatPower } from "../format";
import type { Member } from "../types";

export default function SummaryStrip({
  members,
  children,
}: {
  members: Member[];
  children?: ReactNode;
}) {
  const total = members.reduce((s, m) => s + m.power, 0);
  const avg = members.length ? total / members.length : 0;
  const ranks = new Map<string, number>();
  members.forEach((m) =>
    ranks.set(m.rank || "?", (ranks.get(m.rank || "?") ?? 0) + 1),
  );
  const sorted = [...ranks.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  const max = Math.max(1, ...ranks.values());

  return (
    <section className="grid gap-3 md:grid-cols-3">
      <Stat label="Members" value={String(members.length)} />
      <Stat
        label="Total hero power"
        value={formatPower(total)}
        sub={`avg ${formatPower(avg)}`}
      />
      <div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
          <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
            Ranks
          </div>
          <div className="space-y-1">
            {sorted.map(([rank, count]) => (
              <div key={rank} className="flex items-center gap-2 text-xs">
                <span className="w-8 text-zinc-400">{rank}</span>
                <div className="h-2 flex-1 rounded bg-zinc-800">
                  <div
                    className="h-2 rounded bg-red-500"
                    style={{ width: `${(count / max) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right tabular-nums">{count}</span>
              </div>
            ))}
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}

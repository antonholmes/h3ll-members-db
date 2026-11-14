import { formatPower } from "../format";
import type { Member } from "../types";

export default function SummaryStrip({ members }: { members: Member[] }) {
  const total = members.reduce((s, m) => s + m.power, 0);
  const roles = new Map<string, number>();
  members.forEach((m) => roles.set(m.role, (roles.get(m.role) ?? 0) + 1));
  const max = Math.max(1, ...roles.values());

  return (
    <section className="grid gap-3 md:grid-cols-3">
      <Stat label="Members" value={String(members.length)} />
      <Stat label="Total power" value={formatPower(total)} />
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
        <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Roles</div>
        <div className="space-y-1">
          {[...roles.entries()].map(([role, count]) => (
            <div key={role} className="flex items-center gap-2 text-xs">
              <span className="w-20 truncate text-zinc-400">{role}</span>
              <div className="h-2 flex-1 rounded bg-zinc-800">
                <div className="h-2 rounded bg-red-500" style={{ width: `${(count / max) * 100}%` }} />
              </div>
              <span className="w-6 text-right tabular-nums">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

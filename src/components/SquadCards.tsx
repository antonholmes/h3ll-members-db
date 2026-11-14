import { formatPower } from "../format";
import type { Member } from "../types";

export default function SquadCards({ members }: { members: Member[] }) {
  const groups = new Map<string, Member[]>();
  members.forEach((m) => groups.set(m.squad, [...(groups.get(m.squad) ?? []), m]));
  const squads = [...groups.entries()]
    .map(([name, list]) => ({
      name,
      list: [...list].sort((a, b) => b.power - a.power),
      total: list.reduce((s, m) => s + m.power, 0),
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {squads.map((s) => (
        <div key={s.name} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
          <div className="flex items-baseline justify-between">
            <h3 className="font-semibold">{s.name}</h3>
            <span className="text-xs text-zinc-500">
              {s.list.length} · {formatPower(s.total)} · avg {formatPower(s.total / s.list.length)}
            </span>
          </div>
          <ul className="mt-2 space-y-0.5 text-sm">
            {s.list.map((m) => (
              <li key={m.name} className="flex justify-between">
                <span>
                  {m.name} <span className="text-xs text-zinc-500">{m.role}</span>
                </span>
                <span className="tabular-nums text-zinc-400">{formatPower(m.power)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

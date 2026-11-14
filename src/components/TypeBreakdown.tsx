import { formatPower } from "../format";
import type { Member } from "../types";

export default function TypeBreakdown({ members }: { members: Member[] }) {
  const groups = new Map<string, Member[]>();
  members.forEach((m) => groups.set(m.squadBase, [...(groups.get(m.squadBase) ?? []), m]));
  const types = [...groups.entries()]
    .map(([name, list]) => {
      const powers = list.map((m) => m.squadPower).filter((p): p is number => p !== null);
      return {
        name: name || "Unknown",
        count: list.length,
        avg: powers.length ? powers.reduce((s, p) => s + p, 0) / powers.length : null,
        top: [...list].sort((a, b) => (b.squadPower ?? 0) - (a.squadPower ?? 0)).slice(0, 5),
      };
    })
    .sort((a, b) => b.count - a.count);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {types.map((t) => (
        <div key={t.name} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
          <div className="flex items-baseline justify-between">
            <h3 className="font-semibold">{t.name}</h3>
            <span className="text-xs text-zinc-500">
              {t.count} members · avg squad {t.avg === null ? "—" : formatPower(t.avg)}
            </span>
          </div>
          <div className="mt-2 text-xs uppercase tracking-wide text-zinc-500">Top squads</div>
          <ul className="mt-1 space-y-0.5 text-sm">
            {t.top.map((m, i) => (
              <li key={`${m.name}-${i}`} className="flex justify-between gap-2">
                <span className="truncate">{m.name}</span>
                <span className="tabular-nums text-zinc-400">
                  {m.squadPower === null ? "—" : formatPower(m.squadPower)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

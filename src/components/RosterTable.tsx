import { useMemo, useState } from "react";
import { formatPower } from "../format";
import type { Member } from "../types";

type Key = keyof Member;
const columns: { key: Key; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "power", label: "Power" },
  { key: "role", label: "Role" },
  { key: "squad", label: "Squad" },
];

export default function RosterTable({ members }: { members: Member[] }) {
  const [sort, setSort] = useState<{ key: Key; desc: boolean }>({ key: "power", desc: true });

  const rows = useMemo(() => {
    const dir = sort.desc ? -1 : 1;
    return [...members].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return cmp * dir;
    });
  }, [members, sort]);

  const toggle = (key: Key) =>
    setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: key === "power" }));

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-sm">
        <thead className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-3 py-2">#</th>
            {columns.map((c) => (
              <th key={c.key} className="cursor-pointer select-none px-3 py-2" onClick={() => toggle(c.key)}>
                {c.label}
                {sort.key === c.key ? (sort.desc ? " ▼" : " ▲") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((m, i) => (
            <tr key={m.name} className="border-t border-zinc-800 hover:bg-zinc-900/60">
              <td className="px-3 py-1.5 tabular-nums text-zinc-500">{i + 1}</td>
              <td className="px-3 py-1.5">{m.name}</td>
              <td className="px-3 py-1.5 tabular-nums">{formatPower(m.power)}</td>
              <td className="px-3 py-1.5">{m.role}</td>
              <td className="px-3 py-1.5">{m.squad}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} className="px-3 py-6 text-center text-zinc-500">
                No members match.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

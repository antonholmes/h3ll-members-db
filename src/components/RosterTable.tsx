import { useMemo, useState } from "react";
import { formatPower } from "../format";
import type { Member } from "../types";

type Key = "name" | "rank" | "level" | "power" | "squadPower" | "squadType";
const columns: { key: Key; label: string; numeric?: boolean }[] = [
  { key: "name", label: "Username" },
  { key: "rank", label: "R" },
  { key: "level", label: "Lvl", numeric: true },
  { key: "power", label: "Total power", numeric: true },
  { key: "squadPower", label: "Squad 1 power", numeric: true },
  { key: "squadType", label: "Squad 1 type" },
];

const dash = "—";

export default function RosterTable({ members }: { members: Member[] }) {
  const [sort, setSort] = useState<{ key: Key; desc: boolean }>({
    key: "power",
    desc: true,
  });

  const rows = useMemo(() => {
    const dir = sort.desc ? -1 : 1;
    return [...members].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      if (x === null || x === "") return y === null || y === "" ? 0 : 1;
      if (y === null || y === "") return -1;
      const cmp =
        typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y));
      return cmp * dir;
    });
  }, [members, sort]);

  const toggle = (key: Key, numeric?: boolean) =>
    setSort((s) =>
      s.key === key ? { key, desc: !s.desc } : { key, desc: !!numeric },
    );

  const cell = (m: Member, key: Key) => {
    switch (key) {
      case "power":
        return formatPower(m.power);
      case "squadPower":
        return m.squadPower === null ? dash : formatPower(m.squadPower);
      case "level":
        return m.level ?? dash;
      case "rank":
        return m.rank || dash;
      case "squadType":
        return m.squadType || dash;
      default:
        return m.name;
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-sm">
        <thead className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-3 py-2">#</th>
            {columns.map((c) => (
              <th
                key={c.key}
                className={`cursor-pointer select-none px-3 py-2 ${c.numeric ? "text-right" : ""}`}
                onClick={() => toggle(c.key, c.numeric)}
              >
                {c.label}
                {sort.key === c.key ? (sort.desc ? " ▼" : " ▲") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((m, i) => (
            <tr
              key={`${m.name}-${i}`}
              className="border-t border-zinc-800 hover:bg-zinc-900/60"
            >
              <td className="px-3 py-1.5 tabular-nums text-zinc-500">
                {i + 1}
              </td>
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-3 py-1.5 tabular-nums ${c.numeric ? "text-right" : ""}`}
                >
                  {cell(m, c.key)}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="px-3 py-6 text-center text-zinc-500"
              >
                No members match.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

type Props = {
  search: string;
  onSearch: (v: string) => void;
  rank: string;
  onRank: (v: string) => void;
  type: string;
  onType: (v: string) => void;
  ranks: string[];
  types: string[];
};

const field = "rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm outline-none focus:border-red-500";

export default function Filters(p: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <input
        className={`${field} min-w-[12rem] flex-1`}
        placeholder="Search username…"
        value={p.search}
        onChange={(e) => p.onSearch(e.target.value)}
      />
      <select className={field} value={p.rank} onChange={(e) => p.onRank(e.target.value)}>
        <option value="">All ranks</option>
        {p.ranks.map((r) => (
          <option key={r} value={r}>
            {r || "Unknown"}
          </option>
        ))}
      </select>
      <select className={field} value={p.type} onChange={(e) => p.onType(e.target.value)}>
        <option value="">All squad types</option>
        {p.types.map((t) => (
          <option key={t} value={t}>
            {t || "Unknown"}
          </option>
        ))}
      </select>
    </div>
  );
}

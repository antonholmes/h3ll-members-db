type Props = {
  search: string;
  onSearch: (v: string) => void;
  role: string;
  onRole: (v: string) => void;
  squad: string;
  onSquad: (v: string) => void;
  roles: string[];
  squads: string[];
};

const field = "rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm outline-none focus:border-red-500";

export default function Filters(p: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <input
        className={`${field} min-w-[12rem] flex-1`}
        placeholder="Search name…"
        value={p.search}
        onChange={(e) => p.onSearch(e.target.value)}
      />
      <select className={field} value={p.role} onChange={(e) => p.onRole(e.target.value)}>
        <option value="">All roles</option>
        {p.roles.map((r) => (
          <option key={r}>{r}</option>
        ))}
      </select>
      <select className={field} value={p.squad} onChange={(e) => p.onSquad(e.target.value)}>
        <option value="">All squads</option>
        {p.squads.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { formatPower } from "../format";
import type { StormData, StormMember } from "../types";

const dash = "—";

const ASSIGN_OPTIONS = ["A Starter", "A Sub", "B Starter", "B Sub"];
const TYPES = ["Tank", "Missile", "Air"] as const;
const TYPE_CAP = 30;
const STARTER_CAP = 20;
const SUB_CAP = 10;
const STORAGE_KEY = "hm_desert_storm_assign_v1";

type Assignments = Record<string, Record<string, string>>;

function loadAssignments(): Assignments {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    const out: Assignments = {};
    for (const [date, map] of Object.entries(raw as Assignments)) {
      out[date] = {};
      for (const [key, v] of Object.entries(map)) {
        if (ASSIGN_OPTIONS.includes(v)) out[date][key] = v;
      }
    }
    return out;
  } catch {
    return {};
  }
}

function memberKeys(members: StormMember[]): string[] {
  const seen = new Map<string, number>();
  return members.map((m) => {
    const n = (seen.get(m.name) ?? 0) + 1;
    seen.set(m.name, n);
    return n === 1 ? m.name : `${m.name}#${n}`;
  });
}

const field =
  "rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm outline-none focus:border-red-500";

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
  const date = storm.dates[0];
  const [search, setSearch] = useState("");
  const [team, setTeam] = useState("");
  const [enlisted, setEnlisted] = useState("");
  const [registeredOnly, setRegisteredOnly] = useState(false);
  const [assignments, setAssignments] = useState<Assignments>(loadAssignments);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
    } catch {
      /* storage unavailable */
    }
  }, [assignments]);

  const people = useMemo(() => {
    const keys = memberKeys(storm.members);
    return storm.members.map((m, i) => ({ m, key: keys[i] }));
  }, [storm]);

  const assigned = assignments[date] ?? {};
  const [saveState, setSaveState] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => setSaveState(null), [date]);

  async function saveHistory() {
    const rowsToSave = people
      .filter(
        ({ m, key }) => m.events[date].registered === "Yes" || assigned[key],
      )
      .map(({ m, key }) => ({
        name: m.name,
        rank: m.rank,
        power: m.power,
        squadPower: m.squadPower,
        registered: m.events[date].registered,
        team: m.events[date].team,
        enlisted: m.events[date].enlisted,
        attended: m.events[date].attended,
        assigned: assigned[key] ?? "",
      }));
    if (
      !window.confirm(
        `Save ${rowsToSave.length} rows for ${fmtDate(date)} to the History tab, then reset this week's assignments? An earlier save for this date will be replaced.`,
      )
    )
      return;
    setSaving(true);
    setSaveState(null);
    try {
      const res = await fetch("/api/save-history", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date, rows: rowsToSave }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setAssignments((prev) => ({ ...prev, [date]: {} }));
        setSaveState({
          kind: "ok",
          text: `Saved ${body.saved} rows for ${fmtDate(date)} to History. Assignments reset.`,
        });
      } else setSaveState({ kind: "error", text: body.error ?? "Save failed" });
    } catch {
      setSaveState({ kind: "error", text: "Could not reach the server" });
    } finally {
      setSaving(false);
    }
  }

  const setAssign = (key: string, value: string) =>
    setAssignments((prev) => {
      const next = { ...(prev[date] ?? {}) };
      if (value) next[key] = value;
      else delete next[key];
      return { ...prev, [date]: next };
    });

  const clearAssign = () => {
    if (window.confirm(`Clear all assignments for ${fmtDate(date)}?`)) {
      setAssignments((prev) => ({ ...prev, [date]: {} }));
    }
  };

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return people
      .filter(({ m }) => {
        const e = m.events[date];
        return (
          m.name.toLowerCase().includes(q) &&
          (!team || e.team === team) &&
          (!enlisted || e.enlisted === enlisted) &&
          (!registeredOnly || e.registered === "Yes")
        );
      })
      .sort((a, b) => b.m.power - a.m.power);
  }, [people, date, search, team, enlisted, registeredOnly]);

  const all = storm.members.map((m) => m.events[date]);
  const count = (fn: (e: (typeof all)[number]) => boolean) =>
    all.filter(fn).length;

  const teamStats = (t: "A" | "B") => {
    const green = people.filter(
      ({ m }) =>
        m.events[date].registered === "Yes" && m.events[date].team === t,
    );
    const blue = people.filter(({ key }) => assigned[key]?.startsWith(`${t} `));
    const sum = (list: typeof people) =>
      list.reduce((s, { m }) => s + (m.squadPower ?? 0), 0);
    const missing = (list: typeof people) =>
      list.filter(({ m }) => m.squadPower === null).length;
    const ofType = (list: typeof people, type: string) =>
      list.filter(({ m }) => m.squadBase.toLowerCase() === type.toLowerCase());
    const types = TYPES.map((type) => {
      const g = ofType(green, type);
      const b = ofType(blue, type);
      return {
        type,
        greenCount: g.length,
        blueCount: b.length,
        greenStrength: sum(g),
        blueStrength: sum(b),
      };
    });
    return {
      types,
      greenNoType: green.filter(({ m }) => !m.squadBase).length,
      blueNoType: blue.filter(({ m }) => !m.squadBase).length,
      greenStrength: sum(green),
      greenMissing: missing(green),
      blueStrength: sum(blue),
      blueMissing: missing(blue),
      greenStarters: count((e) => e.team === t && e.enlisted === "Starter"),
      blueStarters: blue.filter(({ key }) => assigned[key] === `${t} Starter`)
        .length,
      greenSubs: count((e) => e.team === t && e.enlisted === "Sub"),
      blueSubs: blue.filter(({ key }) => assigned[key] === `${t} Sub`).length,
    };
  };
  const statsA = teamStats("A");
  const statsB = teamStats("B");
  const assignedCount = Object.keys(assigned).length;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        Week of{" "}
        {new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}
      </h2>

      <section className="grid gap-3 md:grid-cols-2">
        <TeamCard name="A" s={statsA} />
        <TeamCard name="B" s={statsB} />
      </section>

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
        <button
          onClick={clearAssign}
          disabled={assignedCount === 0}
          className="rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-100 disabled:opacity-40"
        >
          Clear assignments ({assignedCount})
        </button>
        <button
          onClick={saveHistory}
          disabled={saving}
          className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save to history"}
        </button>
      </div>
      {saveState && (
        <div
          className={`text-sm ${saveState.kind === "ok" ? "text-green-400" : "text-red-400"}`}
        >
          {saveState.text}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-2">Username</th>
              <th className="px-3 py-2">R</th>
              <th className="px-3 py-2 text-right">Total power</th>
              <th className="px-3 py-2 text-right">Squad 1 power</th>
              <th className="px-3 py-2">Squad 1 type</th>
              <th className="px-3 py-2">Registered</th>
              <th className="px-3 py-2">Team</th>
              <th className="px-3 py-2">Enlisted</th>
              <th className="px-3 py-2">Attended</th>
              <th className="px-3 py-2">Assign</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ m, key }) => (
              <Row
                key={key}
                m={m}
                date={date}
                assign={assigned[key] ?? ""}
                onAssign={(v) => setAssign(key, v)}
              />
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-3 py-6 text-center text-zinc-500"
                >
                  No members match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-600">
        Assignments are saved in this browser only, separately for each date.
      </p>
    </div>
  );
}

function TeamCard({
  name,
  s,
}: {
  name: string;
  s: {
    greenStrength: number;
    greenMissing: number;
    blueStrength: number;
    blueMissing: number;
    greenStarters: number;
    blueStarters: number;
    greenSubs: number;
    blueSubs: number;
    greenNoType: number;
    blueNoType: number;
    types: {
      type: string;
      greenCount: number;
      blueCount: number;
      greenStrength: number;
      blueStrength: number;
    }[];
  };
}) {
  return (
    <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <h3 className="font-semibold">Team {name}</h3>
      <div>
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          Team {name} strength
        </div>
        <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1">
          <Pair
            color="green"
            label="Registered"
            value={formatPower(s.greenStrength)}
            note={s.greenMissing ? `${s.greenMissing} no squad power` : ""}
          />
          <Pair
            color="blue"
            label="Assigned"
            value={formatPower(s.blueStrength)}
            note={s.blueMissing ? `${s.blueMissing} no squad power` : ""}
          />
        </div>
      </div>
      <Counter
        label={`Team ${name} starters`}
        cap={STARTER_CAP}
        green={s.greenStarters}
        blue={s.blueStarters}
      />
      <Counter
        label={`Team ${name} subs`}
        cap={SUB_CAP}
        green={s.greenSubs}
        blue={s.blueSubs}
      />
      <div>
        <div className="grid grid-cols-[4.5rem_1fr_1fr] gap-x-3 text-xs uppercase tracking-wide text-zinc-500">
          <span>Squad type</span>
          <span className="text-right">Count (of {TYPE_CAP})</span>
          <span className="text-right">Strength</span>
        </div>
        {s.types.map((t) => (
          <div
            key={t.type}
            className="grid grid-cols-[4.5rem_1fr_1fr] gap-x-3 border-t border-zinc-800 py-1 text-sm tabular-nums"
          >
            <span className="text-zinc-400">{t.type}</span>
            <span className="text-right">
              <span
                className={`${colors.green} ${t.greenCount > TYPE_CAP ? "text-red-400" : ""}`}
              >
                {t.greenCount}
              </span>
              <span className="text-zinc-600"> / </span>
              <span
                className={`${colors.blue} ${t.blueCount > TYPE_CAP ? "text-red-400" : ""}`}
              >
                {t.blueCount}
              </span>
            </span>
            <span className="text-right">
              <span className={colors.green}>
                {formatPower(t.greenStrength)}
              </span>
              <span className="text-zinc-600"> / </span>
              <span className={colors.blue}>{formatPower(t.blueStrength)}</span>
            </span>
          </div>
        ))}
        {(s.greenNoType > 0 || s.blueNoType > 0) && (
          <div className="mt-1 text-xs text-zinc-500">
            No squad type: {s.greenNoType} registered / {s.blueNoType} assigned
          </div>
        )}
      </div>
    </div>
  );
}

const colors = {
  green: "text-green-400",
  blue: "text-sky-400",
} as const;

function Pair({
  color,
  label,
  value,
  note,
}: {
  color: keyof typeof colors;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div>
      <div className={`text-2xl font-semibold tabular-nums ${colors[color]}`}>
        {value}
      </div>
      <div className="text-xs text-zinc-500">
        {label}
        {note ? ` · ${note}` : ""}
      </div>
    </div>
  );
}

function Counter({
  label,
  cap,
  green,
  blue,
}: {
  label: string;
  cap: number;
  green: number;
  blue: number;
}) {
  const over = (n: number) => (n > cap ? "text-red-400" : "");
  return (
    <div className="flex items-baseline justify-between gap-2 text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className="tabular-nums">
        <span className={`${colors.green} ${over(green)}`}>{green}</span>
        <span className="text-zinc-600"> / </span>
        <span className={`${colors.blue} ${over(blue)}`}>{blue}</span>
        <span className="text-zinc-500"> of {cap}</span>
      </span>
    </div>
  );
}

function Row({
  m,
  date,
  assign,
  onAssign,
}: {
  m: StormMember;
  date: string;
  assign: string;
  onAssign: (v: string) => void;
}) {
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
      <td className="px-3 py-1.5">{m.squadType || dash}</td>
      <td className="px-3 py-1.5">{yes(e.registered)}</td>
      <td className="px-3 py-1.5">{e.team || dash}</td>
      <td className="px-3 py-1.5">{e.enlisted || dash}</td>
      <td className="px-3 py-1.5">{yes(e.attended)}</td>
      <td className="px-3 py-1.5">
        <select
          value={assign}
          onChange={(ev) => onAssign(ev.target.value)}
          className={`rounded-md border bg-zinc-900 px-2 py-1 text-sm outline-none focus:border-red-500 ${
            assign
              ? "border-sky-700 text-sky-300"
              : "border-zinc-800 text-zinc-500"
          }`}
        >
          <option value="">{dash}</option>
          {ASSIGN_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </td>
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

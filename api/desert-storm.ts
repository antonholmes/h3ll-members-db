import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { num, parseCsv } from "./_lib/csv.js";
import { isAdmin, json } from "./_lib/session.js";

const FIELDS: Record<string, string[]> = {
  registered: ["yes", "no"],
  team: ["a", "b"],
  enlisted: ["starter", "sub", "no"],
  attended: ["yes", "no"],
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

let cache: { at: number; text: string } | null = null;

async function loadCsv(): Promise<string> {
  if (cache && Date.now() - cache.at < 60_000) return cache.text;
  const url = process.env.DESERT_STORM_CSV_URL;
  let text: string;
  if (url) {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok)
      throw new Error(`Fetching the sheet failed: HTTP ${res.status}`);
    text = await res.text();
  } else if (!process.env.VERCEL) {
    text = await readFile(
      join(process.cwd(), "sample-desert-storm.csv"),
      "utf8",
    );
  } else {
    throw new Error("DESERT_STORM_CSV_URL is not configured");
  }
  cache = { at: Date.now(), text };
  return text;
}

export async function GET(request: Request): Promise<Response> {
  if (!isAdmin(request)) return json({ error: "Unauthorized" }, 401);
  try {
    const rows = parseCsv((await loadCsv()).replace(/^﻿/, ""));
    if (rows.length < 2)
      return json({ error: "The sheet has no data rows" }, 422);
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const need = {
      rank: "r",
      name: "username",
      power: "total hero power",
      squadPower: "squad 1 power",
    };
    const missing = Object.values(need).filter((h) => !header.includes(h));
    if (missing.length)
      return json(
        { error: `Sheet is missing columns: ${missing.join(", ")}` },
        422,
      );
    const idx = Object.fromEntries(
      Object.entries(need).map(([k, h]) => [k, header.indexOf(h)]),
    );
    const typeIdx = header.indexOf("squad 1 type");

    const cols: { date: string; field: string; i: number }[] = [];
    header.forEach((h, i) => {
      const m = h.match(
        /^(\d{4}-\d{2}-\d{2})\s+(registered|team|enlisted|attended)$/,
      );
      if (m) cols.push({ date: m[1], field: m[2], i });
    });
    const dates = [...new Set(cols.map((c) => c.date))].sort();
    if (!dates.length)
      return json(
        {
          error:
            'No date columns found. Expected headers like "2026-11-13 Registered".',
        },
        422,
      );

    const errors: string[] = [];
    const members = [];
    for (const [n, r] of rows.slice(1).entries()) {
      const line = n + 2;
      const name = (r[idx.name] ?? "").trim();
      if (!name) continue;
      const power = num(r[idx.power]);
      if (power === null || Number.isNaN(power)) {
        errors.push(`line ${line} (${name}): Total Hero Power is not a number`);
        continue;
      }
      const squadPower = num(r[idx.squadPower]);
      if (Number.isNaN(squadPower)) {
        errors.push(`line ${line} (${name}): Squad 1 Power is not a number`);
        continue;
      }
      const events = Object.fromEntries(
        dates.map((d) => [
          d,
          { registered: "", team: "", enlisted: "", attended: "" } as Record<
            string,
            string
          >,
        ]),
      );
      for (const { date, field, i } of cols) {
        const v = (r[i] ?? "").trim();
        if (!v) continue;
        if (!FIELDS[field].includes(v.toLowerCase())) {
          errors.push(
            `line ${line} (${name}): ${date} ${field} "${v}" is not one of ${FIELDS[field].map(cap).join("/")}`,
          );
          continue;
        }
        events[date][field] = cap(v.toLowerCase());
      }
      const squadType = typeIdx >= 0 ? (r[typeIdx] ?? "").trim() : "";
      members.push({
        name,
        rank: (r[idx.rank] ?? "").trim().toUpperCase(),
        power,
        squadPower,
        squadType,
        squadBase: squadType.split("+")[0].trim(),
        events,
      });
    }
    if (errors.length)
      return json(
        {
          error: `Sheet has invalid values:\n${errors.slice(0, 10).join("\n")}`,
        },
        422,
      );
    return json({ updatedAt: new Date().toISOString(), dates, members });
  } catch (e) {
    return json(
      {
        error:
          e instanceof Error ? e.message : "Failed to load Desert Storm data",
      },
      502,
    );
  }
}

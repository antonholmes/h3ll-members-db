import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { num, parseCsv } from "./_lib/csv.js";
import { isAdmin, json } from "./_lib/session.js";

let cache: { at: number; text: string } | null = null;

async function loadCsv(): Promise<string> {
  if (cache && Date.now() - cache.at < 30_000) return cache.text;
  const url = process.env.HISTORY_CSV_URL;
  let text: string;
  if (url) {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok)
      throw new Error(`Fetching the History tab failed: HTTP ${res.status}`);
    text = await res.text();
  } else if (!process.env.VERCEL) {
    text = await readFile(join(process.cwd(), "sample-history.csv"), "utf8");
  } else {
    throw new Error("HISTORY_CSV_URL is not configured");
  }
  cache = { at: Date.now(), text };
  return text;
}

export async function GET(request: Request): Promise<Response> {
  if (!isAdmin(request)) return json({ error: "Unauthorized" }, 401);
  try {
    const rows = parseCsv((await loadCsv()).replace(/^﻿/, ""));
    if (rows.length < 1) return json({ dates: [], rows: [] });
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const cols = {
      savedAt: "saved at",
      date: "date",
      name: "username",
      rank: "r",
      power: "total hero power",
      squadPower: "squad 1 power",
      registered: "registered",
      team: "team",
      enlisted: "enlisted",
      attended: "attended",
      assigned: "assigned",
    };
    const missing = Object.values(cols).filter((h) => !header.includes(h));
    if (missing.length)
      return json(
        { error: `History tab is missing columns: ${missing.join(", ")}` },
        422,
      );
    const idx = Object.fromEntries(
      Object.entries(cols).map(([k, h]) => [k, header.indexOf(h)]),
    );
    const cell = (r: string[], k: string) => (r[idx[k]] ?? "").trim();

    const out = rows
      .slice(1)
      .filter(
        (r) => cell(r, "name") && /^\d{4}-\d{2}-\d{2}$/.test(cell(r, "date")),
      )
      .map((r) => {
        const power = num(cell(r, "power"));
        const squad = num(cell(r, "squadPower"));
        return {
          savedAt: cell(r, "savedAt"),
          date: cell(r, "date"),
          name: cell(r, "name"),
          rank: cell(r, "rank"),
          power: power === null || Number.isNaN(power) ? 0 : power,
          squadPower: squad === null || Number.isNaN(squad) ? null : squad,
          registered: cell(r, "registered"),
          team: cell(r, "team"),
          enlisted: cell(r, "enlisted"),
          attended: cell(r, "attended"),
          assigned: cell(r, "assigned"),
        };
      });
    const dates = [...new Set(out.map((r) => r.date))].sort();
    return json({ dates, rows: out });
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : "Failed to load history" },
      502,
    );
  }
}

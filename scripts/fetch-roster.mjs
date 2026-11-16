import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const forceSample = process.argv.includes("--sample");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

async function load(envVar, sampleFile) {
  const url = forceSample ? undefined : process.env[envVar];
  if (url) {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error(`Fetching ${envVar} failed: HTTP ${res.status}`);
    return { text: await res.text(), source: "sheet" };
  }
  console.warn(`${envVar} not set (or --sample), using ${sampleFile}`);
  return { text: await readFile(resolve(root, sampleFile), "utf8"), source: "sample" };
}

const num = (v) => {
  const s = (v ?? "").replace(/[,\s]/g, "");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
};

function readTable(text, required) {
  const rows = parseCsv(text.replace(/^﻿/, ""));
  if (rows.length < 2) throw new Error("CSV has no data rows");
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const missing = Object.values(required).filter((h) => !header.includes(h));
  if (missing.length) throw new Error(`CSV missing columns: ${missing.join(", ")}. Found: ${header.join(", ")}`);
  const idx = Object.fromEntries(Object.entries(required).map(([k, h]) => [k, header.indexOf(h)]));
  return { rows: rows.slice(1), header, idx };
}

async function write(file, payload) {
  const out = resolve(root, "src/data", file);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify({ updatedAt: new Date().toISOString(), ...payload }, null, 2));
}

function finish(label, errors, skipped, dupes) {
  if (errors.length) throw new Error(`${label} validation failed:\n  ${errors.join("\n  ")}`);
  if (skipped) console.warn(`warning: ${label}: ${skipped} rows without a username skipped`);
  if (dupes.length) console.warn(`warning: ${label}: duplicate usernames kept: ${dupes.join(", ")}`);
}

async function buildRoster() {
  const { text, source } = await load("ROSTER_CSV_URL", "sample-roster.csv");
  const { rows, idx } = readTable(text, {
    rank: "r",
    level: "lvl",
    name: "username",
    power: "total hero power",
    squadPower: "squad 1 power",
    squadType: "squad 1 type",
  });
  const errors = [];
  const seen = new Set();
  const dupes = [];
  let skipped = 0;
  const members = [];
  rows.forEach((r, i) => {
    const line = i + 2;
    const name = (r[idx.name] ?? "").trim();
    if (!name) return skipped++;
    const power = num(r[idx.power]);
    if (power === null || Number.isNaN(power)) return errors.push(`line ${line} (${name}): Total Hero Power is not a number`);
    const squadPower = num(r[idx.squadPower]);
    if (Number.isNaN(squadPower)) return errors.push(`line ${line} (${name}): Squad 1 Power is not a number`);
    const level = num(r[idx.level]);
    if (Number.isNaN(level)) return errors.push(`line ${line} (${name}): Lvl is not a number`);
    if (seen.has(name.toLowerCase())) dupes.push(name);
    seen.add(name.toLowerCase());
    const squadType = (r[idx.squadType] ?? "").trim();
    members.push({
      name,
      rank: (r[idx.rank] ?? "").trim().toUpperCase(),
      level,
      power,
      squadPower,
      squadType,
      squadBase: squadType.split("+")[0].trim(),
    });
  });
  finish("roster", errors, skipped, dupes);
  await write("roster.json", { source, members });
  console.log(`roster: ${members.length} members (${source})`);
}

await buildRoster();

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "src/data/roster.json");
const required = ["name", "power", "role", "squad"];

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

async function loadCsv() {
  const url = process.env.ROSTER_CSV_URL;
  if (url) {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error(`Fetching ROSTER_CSV_URL failed: HTTP ${res.status}`);
    return { text: await res.text(), source: "sheet" };
  }
  console.warn("ROSTER_CSV_URL not set, using sample-roster.csv");
  return { text: await readFile(resolve(root, "sample-roster.csv"), "utf8"), source: "sample" };
}

const { text, source } = await loadCsv();
const rows = parseCsv(text.replace(/^﻿/, ""));
if (rows.length < 2) throw new Error("CSV has no data rows");

const header = rows[0].map((h) => h.trim().toLowerCase());
const missing = required.filter((h) => !header.includes(h));
if (missing.length) throw new Error(`CSV missing columns: ${missing.join(", ")}. Found: ${header.join(", ")}`);
const idx = Object.fromEntries(required.map((h) => [h, header.indexOf(h)]));

const errors = [];
const seen = new Set();
const members = [];
rows.slice(1).forEach((r, i) => {
  const line = i + 2;
  const name = (r[idx.name] ?? "").trim();
  const power = Number((r[idx.power] ?? "").replace(/[,\s]/g, ""));
  const role = (r[idx.role] ?? "").trim();
  const squad = (r[idx.squad] ?? "").trim();
  if (!name) return errors.push(`line ${line}: empty name`);
  if (!Number.isFinite(power)) return errors.push(`line ${line} (${name}): power is not a number`);
  const key = name.toLowerCase();
  if (seen.has(key)) return errors.push(`line ${line}: duplicate name "${name}"`);
  seen.add(key);
  members.push({ name, power, role: role || "Member", squad: squad || "Unassigned" });
});

if (errors.length) throw new Error(`Roster validation failed:\n  ${errors.join("\n  ")}`);

await mkdir(dirname(out), { recursive: true });
await writeFile(out, JSON.stringify({ updatedAt: new Date().toISOString(), source, members }, null, 2));
console.log(`Wrote ${members.length} members (${source}) to src/data/roster.json`);

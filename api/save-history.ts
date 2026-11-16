import { isAdmin, json } from "./_lib/session.js";

type Row = {
  name: string;
  rank: string;
  power: number;
  squadPower: number | null;
  registered: string;
  team: string;
  enlisted: string;
  attended: string;
  assigned: string;
};

const str = (v: unknown) => typeof v === "string" && v.length <= 200;

function validRow(r: Row): boolean {
  return (
    str(r?.name) &&
    !!r.name &&
    str(r.rank) &&
    typeof r.power === "number" &&
    Number.isFinite(r.power) &&
    (r.squadPower === null ||
      (typeof r.squadPower === "number" && Number.isFinite(r.squadPower))) &&
    str(r.registered) &&
    str(r.team) &&
    str(r.enlisted) &&
    str(r.attended) &&
    str(r.assigned)
  );
}

export async function POST(request: Request): Promise<Response> {
  if (!isAdmin(request)) return json({ error: "Unauthorized" }, 401);
  const url = process.env.APPS_SCRIPT_URL;
  const secret = process.env.APPS_SCRIPT_SECRET;
  if (!url || !secret)
    return json({ error: "Saving to history is not configured" }, 500);

  let body: { date?: unknown; rows?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }
  const date = String(body.date ?? "");
  const rows = body.rows;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Array.isArray(rows) ||
    rows.length > 500 ||
    !rows.every(validRow)
  ) {
    return json({ error: "Invalid data" }, 400);
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ secret, date, rows }),
      redirect: "follow",
    });
    const text = await res.text();
    let data: { saved?: number; error?: string };
    try {
      data = JSON.parse(text);
    } catch {
      return json(
        {
          error:
            "Unexpected reply from Apps Script. Check the web app is deployed with access set to Anyone.",
        },
        502,
      );
    }
    if (!res.ok || data.error)
      return json(
        { error: data.error ?? "Apps Script returned an error" },
        502,
      );
    return json({ ok: true, saved: data.saved ?? rows.length });
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : "Could not reach Apps Script" },
      502,
    );
  }
}

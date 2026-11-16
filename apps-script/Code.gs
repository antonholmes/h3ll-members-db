const SHEET_NAME = "History";
const HEADERS = [
  "Saved at",
  "Date",
  "Username",
  "R",
  "Total Hero Power",
  "Squad 1 Power",
  "Registered",
  "Team",
  "Enlisted",
  "Attended",
  "Assigned",
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const body = JSON.parse(e.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty("SECRET");
    if (!secret || body.secret !== secret) return out({ error: "Unauthorized" });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date) || !Array.isArray(body.rows)) {
      return out({ error: "Bad request" });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
    }
    sheet.getRange("B:B").setNumberFormat("@");

    const last = sheet.getLastRow();
    const existing = last > 1 ? sheet.getRange(2, 1, last - 1, HEADERS.length).getValues() : [];
    const kept = existing.filter((r) => String(r[1]) !== body.date);

    const now = new Date().toISOString();
    const added = body.rows.map((r) => [
      now,
      body.date,
      r.name,
      r.rank,
      r.power,
      r.squadPower === null ? "" : r.squadPower,
      r.registered,
      r.team,
      r.enlisted,
      r.attended,
      r.assigned,
    ]);
    const all = kept.concat(added);

    if (last > 1) sheet.getRange(2, 1, last - 1, HEADERS.length).clearContent();
    if (all.length) sheet.getRange(2, 1, all.length, HEADERS.length).setValues(all);
    return out({ saved: added.length });
  } catch (err) {
    return out({ error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

import { isAdmin, json } from "./_lib/session.js";

export function GET(request: Request): Response {
  return json({ admin: isAdmin(request) });
}

import { json, sessionCookie } from "./_lib/session.js";

export function POST(request: Request): Response {
  return json({ admin: false }, 200, sessionCookie(request, null));
}

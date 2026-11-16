import { createToken, json, safeEqual, sessionCookie } from "./_lib/session.js";

export async function POST(request: Request): Promise<Response> {
  let body: { user?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }
  const user = String(body?.user ?? "");
  const password = String(body?.password ?? "");
  const { ADMIN_USER, ADMIN_PASSWORD, SESSION_SECRET } = process.env;
  if (!ADMIN_USER || !ADMIN_PASSWORD || !SESSION_SECRET)
    return json({ error: "Admin login is not configured" }, 500);

  const okUser = safeEqual(user, ADMIN_USER);
  const okPass = safeEqual(password, ADMIN_PASSWORD);
  if (!okUser || !okPass) {
    await new Promise((r) => setTimeout(r, 1000));
    return json({ error: "Wrong username or password" }, 401);
  }
  return json({ admin: true }, 200, sessionCookie(request, createToken()));
}

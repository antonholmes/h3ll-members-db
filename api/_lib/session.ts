import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE = "hm_session";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET is not configured");
  return s;
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function createToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + MAX_AGE }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | null): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof exp === "number" && exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

export function isAdmin(request: Request): boolean {
  try {
    return verifyToken(readCookie(request, COOKIE));
  } catch {
    return false;
  }
}

export function sessionCookie(request: Request, token: string | null): string {
  const secure =
    request.headers.get("x-forwarded-proto") === "https" ||
    new URL(request.url).protocol === "https:";
  const parts = [
    `${COOKIE}=${token ?? ""}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${token ? MAX_AGE : 0}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function json(data: unknown, status = 200, cookie?: string): Response {
  const headers = new Headers({
    "content-type": "application/json",
    "cache-control": "private, no-store",
  });
  if (cookie) headers.append("set-cookie", cookie);
  return new Response(JSON.stringify(data), { status, headers });
}

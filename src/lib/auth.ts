import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

export interface UserSession {
  login: string;
  name: string | null;
  avatar_url: string;
  token?: string;
  exp?: number;
  iat?: number;
}

import { client, initDb } from "./db";

const COOKIE_NAME = "oss_hub_sess_v3";
const ADMIN_COOKIE_NAME = "oss_admin_sess_v3";
const USER_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export async function isUserAdmin(login?: string | null): Promise<boolean> {
  if (!login) return false;
  try {
    await initDb();
    const result = await client.execute({
      sql: `SELECT login FROM admins WHERE LOWER(login) = LOWER(?) LIMIT 1`,
      args: [login.trim()],
    });
    return result.rows.length > 0;
  } catch (err) {
    console.error("Failed to check admin status in DB:", err);
    return false;
  }
}

function getSecretKey(): string {
  const customSecret =
    process.env.SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    process.env.TURSO_AUTH_TOKEN;

  if (!customSecret) {
    if (process.env.NODE_ENV === "production") {
      console.error("CRITICAL SECURITY ERROR: SESSION_SECRET is not configured in production environment!");
    }
    return "oss-hub-dev-insecure-secret-key-change-me";
  }

  return customSecret;
}

function signPayload(payload: string): string {
  const secret = getSecretKey();
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

function verifyAndUnpack(signedValue: string): string | null {
  const parts = signedValue.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const secret = getSecretKey();
  const expectedSignature = createHmac("sha256", secret).update(payload).digest("hex");

  const sigBuf = Buffer.from(signature, "hex");
  const expBuf = Buffer.from(expectedSignature, "hex");

  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  return payload;
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const payload = verifyAndUnpack(raw);
  if (!payload) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
    if (parsed && typeof parsed.login === "string") {
      // Check expiration if present
      if (parsed.exp && typeof parsed.exp === "number" && Date.now() > parsed.exp) {
        return null;
      }
      return parsed as UserSession;
    }
  } catch (err) {
    console.error("Failed to parse auth session cookie:", err);
  }

  return null;
}

export async function setSession(user: UserSession) {
  const cookieStore = await cookies();
  const now = Date.now();
  const payloadData: UserSession = {
    ...user,
    iat: now,
    exp: now + USER_SESSION_TTL_MS,
  };
  const rawJson = JSON.stringify(payloadData);
  const base64Payload = Buffer.from(rawJson).toString("base64");
  const signed = signPayload(base64Payload);

  cookieStore.set(COOKIE_NAME, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(USER_SESSION_TTL_MS / 1000),
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;

  const isAdmin = await isUserAdmin(session.login);
  if (!isAdmin) return false;

  const cookieStore = await cookies();
  const rawAdmin = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!rawAdmin) return false;

  const payload = verifyAndUnpack(rawAdmin);
  if (!payload) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
    if (
      parsed &&
      parsed.admin === session.login.toLowerCase() &&
      typeof parsed.ts === "number"
    ) {
      // Validate TTL: must not be expired
      if (Date.now() - parsed.ts < ADMIN_SESSION_TTL_MS) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

export async function setAdminSession(password: string): Promise<boolean> {
  const session = await getSession();
  if (!session || !(await isUserAdmin(session.login))) {
    return false;
  }

  const expectedPassword = (process.env.ADMIN_PASSWORD || "").trim();
  if (!expectedPassword || password.trim() !== expectedPassword) {
    return false;
  }

  const now = Date.now();
  const adminPayload = Buffer.from(
    JSON.stringify({
      admin: session.login.toLowerCase(),
      ts: now,
      exp: now + ADMIN_SESSION_TTL_MS,
    })
  ).toString("base64");
  const signedAdmin = signPayload(adminPayload);

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, signedAdmin, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(ADMIN_SESSION_TTL_MS / 1000),
  });
  return true;
}

export async function forceSetAdminSession(login: string) {
  const now = Date.now();
  const adminPayload = Buffer.from(
    JSON.stringify({
      admin: login.toLowerCase(),
      ts: now,
      exp: now + ADMIN_SESSION_TTL_MS,
    })
  ).toString("base64");
  const signedAdmin = signPayload(adminPayload);

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, signedAdmin, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(ADMIN_SESSION_TTL_MS / 1000),
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

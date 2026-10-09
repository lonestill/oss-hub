import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

export interface UserSession {
  login: string;
  name: string | null;
  avatar_url: string;
  token?: string;
}

const COOKIE_NAME = "oss_hub_sess_v3";
const ADMIN_COOKIE_NAME = "oss_admin_sess_v3";

function getSecretKey(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    process.env.TURSO_AUTH_TOKEN ||
    "oss-hub-dev-insecure-secret-key-change-me"
  );
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
      return parsed as UserSession;
    }
  } catch (err) {
    console.error("Failed to parse auth session cookie:", err);
  }

  return null;
}

export async function setSession(user: UserSession) {
  const cookieStore = await cookies();
  const rawJson = JSON.stringify(user);
  const base64 = Buffer.from(rawJson).toString("base64");
  const signed = signPayload(base64);

  cookieStore.set(COOKIE_NAME, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getSession();
  if (!session || session.login.toLowerCase() !== "lonestill") {
    return false;
  }
  const cookieStore = await cookies();
  const rawAdmin = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!rawAdmin) return false;

  const payload = verifyAndUnpack(rawAdmin);
  if (!payload) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
    if (parsed && parsed.admin === "lonestill" && typeof parsed.ts === "number") {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export async function setAdminSession(password: string): Promise<boolean> {
  const session = await getSession();
  if (!session || session.login.toLowerCase() !== "lonestill") {
    return false;
  }

  const expectedPassword = (process.env.ADMIN_PASSWORD || "").trim();
  if (!expectedPassword || password.trim() !== expectedPassword) {
    return false;
  }

  const adminPayload = Buffer.from(
    JSON.stringify({ admin: "lonestill", ts: Date.now() })
  ).toString("base64");
  const signedAdmin = signPayload(adminPayload);

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, signedAdmin, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return true;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}



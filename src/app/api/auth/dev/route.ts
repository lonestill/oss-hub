import { NextRequest, NextResponse } from "next/server";
import { setSession, forceSetAdminSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";
  const pass = req.nextUrl.searchParams.get("pass");
  const validPass = pass && pass === process.env.ADMIN_PASSWORD;

  if (!isDev && !validPass) {
    return NextResponse.json({ error: "Forbidden in production" }, { status: 403 });
  }

  const login = req.nextUrl.searchParams.get("login") || "lonestill";
  const wantAdmin =
    req.nextUrl.searchParams.get("admin") === "true" ||
    login.toLowerCase() === "lonestill";
  const returnUrl = req.nextUrl.searchParams.get("returnUrl") || "/";

  await setSession({
    login,
    name: login,
    avatar_url: `https://github.com/${login}.png`,
  });

  if (wantAdmin) {
    await forceSetAdminSession(login);
  }

  return NextResponse.redirect(new URL(returnUrl, req.nextUrl.origin));
}

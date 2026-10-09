import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/callback/github`;
  const state = randomBytes(16).toString("hex");

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=read:user,repo&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&state=${state}`;

  const res = NextResponse.redirect(githubAuthUrl);
  res.cookies.set("oss_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return res;
}


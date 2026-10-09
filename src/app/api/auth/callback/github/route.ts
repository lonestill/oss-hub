import { NextRequest, NextResponse } from "next/server";
import { setSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const storedState = req.cookies.get("oss_oauth_state")?.value;
  const origin = req.nextUrl.origin;

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", origin));
  }

  // Validate state against CSRF
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL("/login?error=csrf_detected", origin));
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?error=missing_credentials", origin));
  }

  try {
    // 1. Exchange code for token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.redirect(new URL("/login?error=token_failed", origin));
    }

    // 2. Fetch user profile
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "OSS-Hub-Platform",
      },
    });

    const userData = await userRes.json();

    if (!userData.login) {
      return NextResponse.redirect(new URL("/login?error=user_failed", origin));
    }

    // 3. Set Session Cookie
    await setSession({
      login: userData.login,
      name: userData.name || userData.login,
      avatar_url: userData.avatar_url,
      token: accessToken,
    });

    const response = NextResponse.redirect(new URL("/submit", origin));
    response.cookies.delete("oss_oauth_state");
    return response;
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(new URL("/login?error=server_error", origin));
  }
}

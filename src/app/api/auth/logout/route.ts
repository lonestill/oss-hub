import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await clearSession();
  const origin = req.nextUrl.origin;
  return NextResponse.redirect(new URL("/", origin));
}

export async function POST(req: NextRequest) {
  await clearSession();
  const origin = req.nextUrl.origin;
  return NextResponse.redirect(new URL("/", origin));
}

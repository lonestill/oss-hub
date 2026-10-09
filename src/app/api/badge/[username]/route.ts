import { NextRequest, NextResponse } from "next/server";
import { getProjectsByOwner } from "@/lib/projects";
import { getClaimsByUser, getTeamApplicationsByUser } from "@/lib/claims";
import {
  getUserAvailability,
  calculateUserBadges,
  calculateUserStack,
} from "@/lib/user-profile";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const cleanLogin = decodeURIComponent(username).trim().replace(/^@/, "");

  const [projects, claims, teamApps, availability] = await Promise.all([
    getProjectsByOwner(cleanLogin),
    getClaimsByUser(cleanLogin),
    getTeamApplicationsByUser(cleanLogin),
    getUserAvailability(cleanLogin),
  ]);

  const totalStars = projects.reduce((acc, p) => acc + p.stars, 0);
  const badges = calculateUserBadges({
    projects,
    claims,
    teamApps,
    comments: [],
    totalStars,
  });
  const unlockedBadges = badges.filter((b) => b.unlocked);
  const stack = calculateUserStack(projects, claims);
  const topStack = stack.length > 0 ? stack.map((s) => s.name).slice(0, 3).join(", ") : "Open Source";

  const statusLabel =
    availability?.status === "busy"
      ? "BUSY"
      : availability?.status === "mentor"
      ? "MENTOR"
      : "OPEN TO CONTRIBUTE";

  const width = 460;
  const height = 150;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f1117" />
      <stop offset="100%" stop-color="#090a0f" />
    </linearGradient>
    <linearGradient id="barGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#e5484d" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>
  </defs>

  <!-- Background Canvas -->
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="12" fill="url(#bgGrad)" stroke="#1d212b" stroke-width="1"/>

  <!-- Top Accent Bar -->
  <rect x="12" y="1" width="60" height="2" rx="1" fill="#e5484d" />

  <!-- Platform Brand & Title -->
  <g transform="translate(20, 28)">
    <text x="0" y="0" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10" font-weight="700" fill="#e5484d" letter-spacing="1">OSS HUB // VERIFIED DEV</text>
    <text x="0" y="22" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="800" fill="#ffffff" letter-spacing="-0.3">@${cleanLogin}</text>
  </g>

  <!-- Status Chip -->
  <g transform="translate(${width - 150}, 20)">
    <rect x="0" y="0" width="130" height="22" rx="6" fill="#161a23" stroke="#2e3444" stroke-width="1"/>
    <circle cx="12" cy="11" r="3" fill="${availability?.status === "busy" ? "#d29922" : "#3fb950"}"/>
    <text x="22" y="15" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="9" font-weight="700" fill="#c9d1d9">${statusLabel}</text>
  </g>

  <!-- Stats Grid -->
  <g transform="translate(20, 75)">
    <!-- Metric 1: Projects -->
    <g transform="translate(0, 0)">
      <rect x="0" y="0" width="95" height="42" rx="8" fill="#12151d" stroke="#1d212b" stroke-width="1"/>
      <text x="12" y="16" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="500" fill="#8a92a3">PROJECTS</text>
      <text x="12" y="33" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="15" font-weight="700" fill="#ffffff">${projects.length}</text>
    </g>

    <!-- Metric 2: Tasks -->
    <g transform="translate(105, 0)">
      <rect x="0" y="0" width="95" height="42" rx="8" fill="#12151d" stroke="#1d212b" stroke-width="1"/>
      <text x="12" y="16" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="500" fill="#8a92a3">TASKS</text>
      <text x="12" y="33" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="15" font-weight="700" fill="#e5484d">${claims.length}</text>
    </g>

    <!-- Metric 3: Stars -->
    <g transform="translate(210, 0)">
      <rect x="0" y="0" width="95" height="42" rx="8" fill="#12151d" stroke="#1d212b" stroke-width="1"/>
      <text x="12" y="16" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="500" fill="#8a92a3">STARS</text>
      <text x="12" y="33" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="15" font-weight="700" fill="#ffffff">${totalStars}</text>
    </g>

    <!-- Metric 4: Badges -->
    <g transform="translate(315, 0)">
      <rect x="0" y="0" width="105" height="42" rx="8" fill="#12151d" stroke="#1d212b" stroke-width="1"/>
      <text x="12" y="16" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="500" fill="#8a92a3">BADGES</text>
      <text x="12" y="33" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="15" font-weight="700" fill="#38bdf8">${unlockedBadges.length} / ${badges.length}</text>
    </g>
  </g>

  <!-- Bottom Stack Strip -->
  <g transform="translate(20, 134)">
    <text x="0" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="500" fill="#586071">STACK:</text>
    <text x="42" y="0" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="9" font-weight="600" fill="#8a92a3">${topStack}</text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}

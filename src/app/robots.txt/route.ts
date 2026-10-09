import { NextResponse } from "next/server";

export async function GET() {
  const robotsTxt = `# Привет фаззерам и сканерам. Ищете флаг? Напишите @lonestill в ЛС.

User-agent: *
Disallow: /admin
Disallow: /.env
Disallow: /flag.txt
Disallow: /secret-keys
Allow: /
`;

  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

import { NextResponse } from "next/server";

export async function GET() {
  const securityTxt = `Contact: https://t.me/lonestill
Expires: 2027-12-31T23:59:59.000Z
Preferred-Languages: ru, en
Policy: https://t.me/lonestill

# Привет багхантерам и исследователям безопасности.
# Нашли реальный 0day или баг в проде? Не ломайте сервис — отпишите в Telegram: @lonestill
# Респект и место среди контрибьюторов гарантированы.
`;

  return new NextResponse(securityTxt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

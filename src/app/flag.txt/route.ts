import { NextResponse } from "next/server";

export async function GET() {
  const flagContent = `FLAG{PENTEST_FAILED_TRY_HARDER_LONESTILL_TOP}
Красава, сканер настроил. А теперь попробуй найти настоящую дыру. Нашёл — пиши @lonestill.
`;

  return new NextResponse(flagContent, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Easter-Egg": "Try-Harder",
    },
  });
}

export const runtime = "nodejs";

export async function GET(request: Request) {
  const host = request.headers.get("host");
  const origin = request.headers.get("origin");

  return Response.json({
    ok: true,
    message: "API сайта доступен.",
    host,
    origin,
    hasOpenRouterKey: Boolean(process.env.OPENROUTER_API_KEY),
    model: process.env.OPENROUTER_MODEL || "qwen/qwen3-next-80b-a3b-instruct:free",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  });
}

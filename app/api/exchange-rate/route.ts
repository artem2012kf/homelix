export const dynamic = "force-dynamic";

const FALLBACK_RUB_PER_USD = Number(process.env.RUB_PER_USD_FALLBACK || 90);
const RATE_URL = process.env.EXCHANGE_RATE_URL || "https://open.er-api.com/v6/latest/RUB";

export async function GET() {
  try {
    const response = await fetch(RATE_URL, { next: { revalidate: 60 * 60 } });
    if (!response.ok) throw new Error("rate provider error");
    const data = await response.json();
    const usdPerRub = Number(data?.rates?.USD);
    if (!Number.isFinite(usdPerRub) || usdPerRub <= 0) throw new Error("invalid rate");
    const rubPerUsd = 1 / usdPerRub;
    return Response.json(
      { rubPerUsd, source: "live", updatedAt: data?.time_last_update_utc || new Date().toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch {
    return Response.json(
      { rubPerUsd: FALLBACK_RUB_PER_USD, source: "fallback", updatedAt: null },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } }
    );
  }
}
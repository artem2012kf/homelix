import { expiredSessionCookie, getSessionToken, revokeSession, withDatabaseWriteLock } from "@/lib/server-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const token = getSessionToken(request);

  await withDatabaseWriteLock(() => {
    revokeSession(token);
  });

  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": expiredSessionCookie(), "Cache-Control": "no-store" } }
  );
}

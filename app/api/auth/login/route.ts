import {
  createSession,
  getPublicUser,
  getUserFavorites,
  getUserReservations,
  hashPassword,
  needsPasswordRehash,
  normalizeEmail,
  readDatabase,
  sessionCookie,
  verifyPassword,
  withDatabaseWriteLock,
  writeDatabase
} from "@/lib/server-db";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const limit = checkRateLimit(request, "auth-login", { limit: 8, windowMs: 10 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit);

  const { email, password } = await request.json().catch(() => ({ email: "", password: "" }));
  const cleanEmail = normalizeEmail(String(email ?? ""));
  const cleanPassword = String(password ?? "");

  if (!cleanEmail || cleanEmail.length > 254 || !cleanPassword || cleanPassword.length > 128) {
    return Response.json(
      { error: "Почта или пароль указаны неверно.", code: "INVALID_CREDENTIALS" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  return withDatabaseWriteLock(() => {
    const database = readDatabase();
    const user = database.users.find((item) => item.email === cleanEmail);

    if (!user) {
      return Response.json(
        { error: "Такого аккаунта не существует.", code: "ACCOUNT_NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    if (!verifyPassword(cleanPassword, user.passwordHash)) {
      return Response.json(
        { error: "Неверный пароль.", code: "INVALID_PASSWORD" },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    if (needsPasswordRehash(user.passwordHash)) {
      user.passwordHash = hashPassword(cleanPassword);
    }

    const session = createSession(database, user.id);
    writeDatabase(database);

    return Response.json(
      {
        user: getPublicUser(user),
        favorites: getUserFavorites(database, user.id),
        reservations: getUserReservations(database, user.id)
      },
      { headers: { "Set-Cookie": sessionCookie(session.token), ...NO_STORE_HEADERS } }
    );
  });
}

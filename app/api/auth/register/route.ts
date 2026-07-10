import {
  createSession,
  getPublicUser,
  getUserFavorites,
  getUserReservations,
  hashPassword,
  makeId,
  normalizeEmail,
  readDatabase,
  sessionCookie,
  withDatabaseWriteLock,
  writeDatabase
} from "@/lib/server-db";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limit = checkRateLimit(request, "auth-register", { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit);

  try {
    const { email, password, website } = await request.json().catch(() => ({ email: "", password: "", website: "" }));
    const cleanEmail = normalizeEmail(String(email ?? ""));
    const cleanPassword = String(password ?? "");

    if (String(website ?? "").trim()) {
      return Response.json({ error: "Не удалось создать аккаунт." }, { status: 400 });
    }

    if (!/^\S+@\S+\.\S+$/.test(cleanEmail) || cleanEmail.length > 254) {
      return Response.json({ error: "Укажите корректную почту." }, { status: 400 });
    }

    if (cleanPassword.length < 10 || cleanPassword.length > 128) {
      return Response.json({ error: "Пароль должен содержать от 10 до 128 символов." }, { status: 400 });
    }

    return await withDatabaseWriteLock(() => {
      const database = readDatabase();

      if (database.users.some((user) => user.email === cleanEmail)) {
        return Response.json({ error: "Пользователь с такой почтой уже зарегистрирован." }, { status: 409 });
      }

      const now = new Date().toISOString();
      const user = {
        id: makeId("usr"),
        email: cleanEmail,
        passwordHash: hashPassword(cleanPassword),
        createdAt: now
      };

      database.users.push(user);
      const session = createSession(database, user.id);
      writeDatabase(database);

      return Response.json(
        {
          user: getPublicUser(user),
          favorites: getUserFavorites(database, user.id),
          reservations: getUserReservations(database, user.id)
        },
        { headers: { "Set-Cookie": sessionCookie(session.token), "Cache-Control": "no-store" } }
      );
    });
  } catch {
    return Response.json({ error: "Регистрация временно недоступна. Попробуйте еще раз." }, { status: 500 });
  }
}

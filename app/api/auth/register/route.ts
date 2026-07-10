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
import { verifyEmailChallenge } from "@/lib/email-verification";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limit = checkRateLimit(request, "auth-register", { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit);

  try {
    const body = await request.json().catch(() => ({}));
    const cleanEmail = normalizeEmail(String(body?.email ?? ""));
    const cleanPassword = String(body?.password ?? "");
    const verificationCode = String(body?.verificationCode ?? "").trim();
    const verificationToken = String(body?.verificationToken ?? "");

    if (String(body?.website ?? "").trim()) {
      return Response.json({ error: "Не удалось создать аккаунт." }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail) || cleanEmail.length > 254) {
      return Response.json({ error: "Укажите корректную почту." }, { status: 400 });
    }
    if (cleanPassword.length < 10 || cleanPassword.length > 128) {
      return Response.json({ error: "Пароль должен содержать от 10 до 128 символов." }, { status: 400 });
    }
    if (!/^\d{6}$/.test(verificationCode) || !verifyEmailChallenge(cleanEmail, verificationCode, verificationToken)) {
      return Response.json({ error: "Код подтверждения неверный или истёк. Запросите новый код." }, { status: 400 });
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
    return Response.json({ error: "Регистрация временно недоступна. Попробуйте ещё раз." }, { status: 500 });
  }
}
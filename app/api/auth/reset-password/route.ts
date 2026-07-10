import { createHash, timingSafeEqual } from "crypto";
import {
  hashPassword,
  readDatabase,
  withDatabaseWriteLock,
  writeDatabase,
  type DbUser
} from "@/lib/server-db";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ResettableUser = DbUser & {
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: string;
};

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest();
}

function matchesToken(token: string, storedHash: string) {
  const actual = tokenHash(token);
  const expected = Buffer.from(storedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function POST(request: Request) {
  const limit = checkRateLimit(request, "auth-password-reset-complete", { limit: 6, windowMs: 30 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit);

  const { token, password } = await request.json().catch(() => ({ token: "", password: "" }));
  const cleanToken = String(token ?? "").trim();
  const cleanPassword = String(password ?? "");

  if (cleanToken.length < 32 || cleanToken.length > 256) {
    return Response.json({ error: "Ссылка восстановления недействительна." }, { status: 400 });
  }

  if (cleanPassword.length < 10 || cleanPassword.length > 128) {
    return Response.json({ error: "Пароль должен содержать от 10 до 128 символов." }, { status: 400 });
  }

  return withDatabaseWriteLock(() => {
    const database = readDatabase();
    const now = Date.now();
    const user = database.users.find((item) => {
      const candidate = item as ResettableUser;
      return (
        Boolean(candidate.passwordResetTokenHash) &&
        Boolean(candidate.passwordResetExpiresAt) &&
        Date.parse(candidate.passwordResetExpiresAt ?? "") > now &&
        matchesToken(cleanToken, candidate.passwordResetTokenHash ?? "")
      );
    }) as ResettableUser | undefined;

    if (!user) {
      return Response.json({ error: "Ссылка восстановления недействительна или уже истекла." }, { status: 400 });
    }

    user.passwordHash = hashPassword(cleanPassword);
    delete user.passwordResetTokenHash;
    delete user.passwordResetExpiresAt;
    database.sessions = database.sessions.filter((session) => session.userId !== user.id);
    writeDatabase(database);

    return Response.json(
      { message: "Пароль обновлён. Теперь можно войти с новым паролем." },
      { headers: { "Cache-Control": "no-store" } }
    );
  });
}
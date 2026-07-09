import {
  getPublicUser,
  getUserFavorites,
  getUserReservations,
  hashPassword,
  makeId,
  makeToken,
  normalizeEmail,
  readDatabase,
  writeDatabase
} from "@/lib/server-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json().catch(() => ({ email: "", password: "" }));
    const cleanEmail = normalizeEmail(String(email ?? ""));
    const cleanPassword = String(password ?? "").trim();

    if (!cleanEmail.includes("@") || cleanEmail.length < 5) {
      return Response.json({ error: "Укажите корректную почту." }, { status: 400 });
    }

    if (cleanPassword.length < 6) {
      return Response.json({ error: "Пароль должен содержать минимум 6 символов." }, { status: 400 });
    }

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
    const token = makeToken();

    database.users.push(user);
    database.sessions.push({
      token,
      userId: user.id,
      createdAt: now
    });

    writeDatabase(database);

    return Response.json({
      token,
      user: getPublicUser(user),
      favorites: getUserFavorites(database, user.id),
      reservations: getUserReservations(database, user.id)
    });
  } catch {
    return Response.json(
      { error: "Регистрация временно недоступна. Попробуйте еще раз." },
      { status: 500 }
    );
  }
}

import {
  getPublicUser,
  getUserFavorites,
  getUserReservations,
  hashPassword,
  makeToken,
  normalizeEmail,
  readDatabase,
  writeDatabase
} from "@/lib/server-db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { email, password } = await request.json().catch(() => ({ email: "", password: "" }));
  const cleanEmail = normalizeEmail(String(email ?? ""));
  const cleanPassword = String(password ?? "").trim();
  const database = readDatabase();
  const user = database.users.find((item) => item.email === cleanEmail && item.passwordHash === hashPassword(cleanPassword));

  if (!user) {
    return Response.json({ error: "Почта или пароль указаны неверно." }, { status: 401 });
  }

  const token = makeToken();

  database.sessions.push({
    token,
    userId: user.id,
    createdAt: new Date().toISOString()
  });

  writeDatabase(database);

  return Response.json({
    token,
    user: getPublicUser(user),
    favorites: getUserFavorites(database, user.id),
    reservations: getUserReservations(database, user.id)
  });
}

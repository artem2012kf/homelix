import {
  getBearerToken,
  getUserByToken,
  getUserFavorites,
  writeDatabase
} from "@/lib/server-db";
import { getApartmentById } from "@/lib/apartments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = getUserByToken(getBearerToken(request));

  if (!auth) {
    return Response.json({ error: "Необходимо войти в аккаунт." }, { status: 401 });
  }

  const { apartmentId } = await request.json().catch(() => ({ apartmentId: "" }));
  const id = String(apartmentId ?? "");

  if (!getApartmentById(id)) {
    return Response.json({ error: "Квартира не найдена." }, { status: 404 });
  }

  const exists = auth.database.favorites.some((item) => item.userId === auth.user.id && item.apartmentId === id);

  if (exists) {
    auth.database.favorites = auth.database.favorites.filter((item) => !(item.userId === auth.user.id && item.apartmentId === id));
  } else {
    auth.database.favorites.push({
      userId: auth.user.id,
      apartmentId: id,
      createdAt: new Date().toISOString()
    });
  }

  writeDatabase(auth.database);

  return Response.json({
    favorites: getUserFavorites(auth.database, auth.user.id)
  });
}

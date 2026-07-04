import {
  getBearerToken,
  getPublicUser,
  getReservedApartmentIds,
  getUserByToken,
  getUserFavorites,
  getUserReservations
} from "@/lib/server-db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = getUserByToken(getBearerToken(request));

  if (!auth) {
    return Response.json({ user: null, favorites: [], reservations: [], reservedApartmentIds: getReservedApartmentIds() });
  }

  return Response.json({
    user: getPublicUser(auth.user),
    favorites: getUserFavorites(auth.database, auth.user.id),
    reservations: getUserReservations(auth.database, auth.user.id),
    reservedApartmentIds: getReservedApartmentIds(auth.database)
  });
}

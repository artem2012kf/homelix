import {
  getPublicUser,
  getReservedApartmentIds,
  getSessionToken,
  getUserByToken,
  getUserFavorites,
  getUserReservations
} from "@/lib/server-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = getUserByToken(getSessionToken(request));
  const headers = { "Cache-Control": "no-store" };

  if (!auth) {
    return Response.json(
      { user: null, favorites: [], reservations: [], reservedApartmentIds: getReservedApartmentIds() },
      { headers }
    );
  }

  return Response.json(
    {
      user: getPublicUser(auth.user),
      favorites: getUserFavorites(auth.database, auth.user.id),
      reservations: getUserReservations(auth.database, auth.user.id),
      reservedApartmentIds: getReservedApartmentIds(auth.database)
    },
    { headers }
  );
}

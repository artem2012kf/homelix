import {
  getActiveReservation,
  getReservedApartmentIds,
  getSessionToken,
  getUserByToken,
  getUserReservations,
  makeId,
  withDatabaseWriteLock,
  writeDatabase
} from "@/lib/server-db";
import { getApartmentById } from "@/lib/apartments";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limit = checkRateLimit(request, "reservations", { limit: 20, windowMs: 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit);

  const token = getSessionToken(request);
  const { apartmentId, action } = await request.json().catch(() => ({ apartmentId: "", action: "reserve" }));
  const id = String(apartmentId ?? "");
  const apartment = getApartmentById(id);

  if (!apartment) {
    return Response.json({ error: "Квартира не найдена." }, { status: 404 });
  }

  return withDatabaseWriteLock(() => {
    const auth = getUserByToken(token);
    if (!auth) {
      return Response.json({ error: "Необходимо войти в аккаунт." }, { status: 401 });
    }

    const now = new Date().toISOString();
    const activeReservation = getActiveReservation(auth.database, id);

    if (action === "cancel") {
      if (!activeReservation || activeReservation.userId !== auth.user.id) {
        return Response.json({ error: "У этого пользователя нет активной брони по этой квартире." }, { status: 400 });
      }

      activeReservation.status = "cancelled";
      activeReservation.updatedAt = now;
      writeDatabase(auth.database);

      return Response.json({
        reservations: getUserReservations(auth.database, auth.user.id),
        reservedApartmentIds: getReservedApartmentIds(auth.database)
      });
    }

    if (apartment.status === "sold") {
      return Response.json({ error: "Эта квартира уже продана." }, { status: 409 });
    }

    if (apartment.status === "reserved" && !activeReservation) {
      return Response.json({ error: "Эта квартира уже находится в брони." }, { status: 409 });
    }

    if (activeReservation && activeReservation.userId !== auth.user.id) {
      return Response.json({ error: "Эта квартира уже забронирована другим клиентом." }, { status: 409 });
    }

    if (!activeReservation) {
      auth.database.reservations.push({
        id: makeId("res"),
        userId: auth.user.id,
        apartmentId: id,
        status: "active",
        createdAt: now,
        updatedAt: now
      });
    }

    writeDatabase(auth.database);
    return Response.json({
      reservations: getUserReservations(auth.database, auth.user.id),
      reservedApartmentIds: getReservedApartmentIds(auth.database)
    });
  });
}

import { getReservedApartmentIds } from "@/lib/server-db";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    reservedApartmentIds: getReservedApartmentIds()
  });
}

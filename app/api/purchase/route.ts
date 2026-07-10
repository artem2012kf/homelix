import { apartments } from "@/lib/apartments";
import { furnitureItems } from "@/lib/furniture";
import { createPurchaseRequest } from "@/lib/purchase-store";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getSessionToken, getUserByToken } from "@/lib/server-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limit = checkRateLimit(request, "purchase", { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit);

  const session = getUserByToken(getSessionToken(request));
  if (!session) return Response.json({ error: "Сначала войдите в личный кабинет." }, { status: 401 });

  try {
    const body = await request.json();
    const type = body?.type === "furniture" ? "furniture" : body?.type === "apartment" ? "apartment" : null;
    const apartmentId = String(body?.apartmentId ?? "");
    const apartment = apartmentId ? apartments.find((item) => item.id === apartmentId) : undefined;
    const city = String(body?.city ?? apartment?.city ?? "").slice(0, 80);
    const project = String(body?.project ?? apartment?.project ?? "").slice(0, 160);

    if (!type || !city) return Response.json({ error: "Не хватает данных для заявки." }, { status: 400 });
    if (type === "apartment" && (!apartment || apartment.status === "sold")) {
      return Response.json({ error: "Квартира недоступна для покупки." }, { status: 409 });
    }

    const rawLines = Array.isArray(body?.furniture) ? body.furniture : [];
    const furniture = type === "furniture"
      ? rawLines.slice(0, 50).map((line: { itemId?: unknown; quantity?: unknown }) => {
          const item = furnitureItems.find((candidate) => candidate.id === String(line.itemId ?? ""));
          if (!item) return null;
          const quantity = Math.max(1, Math.min(20, Math.round(Number(line.quantity) || 1)));
          return { itemId: item.id, title: item.title, quantity, price: item.price };
        }).filter(Boolean) as Array<{ itemId: string; title: string; quantity: number; price: number }>
      : undefined;

    if (type === "furniture" && !furniture?.length) {
      return Response.json({ error: "Корзина пуста." }, { status: 400 });
    }

    const subtotal = furniture?.reduce((sum, line) => sum + line.price * line.quantity, 0);
    const deliveryPrice = type === "furniture" ? Math.max(0, Math.round(Number(body?.deliveryPrice) || 0)) : undefined;
    const purchase = createPurchaseRequest({
      userId: session.user.id,
      email: session.user.email,
      type,
      apartmentId: apartment?.id,
      city,
      project,
      furniture,
      subtotal,
      deliveryPrice,
      deliveryWindow: type === "furniture" ? String(body?.deliveryWindow ?? "").slice(0, 80) : undefined
    });

    return Response.json({ ok: true, requestId: purchase.id, message: "Заявка принята. Менеджер свяжется с вами." });
  } catch {
    return Response.json({ error: "Не удалось отправить заявку. Попробуйте ещё раз." }, { status: 500 });
  }
}
import { apartments } from "@/lib/apartments";
import { furnitureItems } from "@/lib/furniture";
import { getAccountCart, saveAccountCart, type StoredAccountCartLine } from "@/lib/server-account-cart";
import { getSessionToken, getUserByToken } from "@/lib/server-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function unauthorized() {
  return Response.json({ error: "Войдите в аккаунт, чтобы сохранить корзину." }, { status: 401, headers: NO_STORE_HEADERS });
}

function sanitizeLines(value: unknown): StoredAccountCartLine[] | null {
  if (!Array.isArray(value) || value.length > 100) return null;

  const validItemIds = new Set(furnitureItems.map((item) => item.id));
  const quantities = new Map<string, number>();

  for (const rawLine of value) {
    if (!rawLine || typeof rawLine !== "object") return null;
    const itemId = String((rawLine as { itemId?: unknown }).itemId ?? "");
    const quantity = Number((rawLine as { quantity?: unknown }).quantity);

    if (!validItemIds.has(itemId) || !Number.isFinite(quantity)) return null;
    const cleanQuantity = Math.min(20, Math.max(1, Math.round(quantity)));
    quantities.set(itemId, Math.min(20, (quantities.get(itemId) ?? 0) + cleanQuantity));
  }

  return Array.from(quantities, ([itemId, quantity]) => ({ itemId, quantity }));
}

function sanitizeApartmentId(value: unknown) {
  const apartmentId = typeof value === "string" ? value.trim() : "";
  if (!apartmentId) return "";
  return apartments.some((apartment) => apartment.id === apartmentId && apartment.status !== "sold") ? apartmentId : "";
}

export async function GET(request: Request) {
  const auth = getUserByToken(getSessionToken(request));
  if (!auth) return unauthorized();

  const cart = getAccountCart(auth.user.id);
  return Response.json(
    {
      lines: cart.lines,
      selectedApartmentId: cart.selectedApartmentId,
      updatedAt: cart.updatedAt
    },
    { headers: NO_STORE_HEADERS }
  );
}

export async function PUT(request: Request) {
  const auth = getUserByToken(getSessionToken(request));
  if (!auth) return unauthorized();

  try {
    const body = (await request.json()) as { lines?: unknown; selectedApartmentId?: unknown };
    const lines = sanitizeLines(body.lines);
    if (!lines) {
      return Response.json({ error: "Некорректное содержимое корзины." }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const cart = await saveAccountCart(auth.user.id, lines, sanitizeApartmentId(body.selectedApartmentId));
    return Response.json(
      {
        ok: true,
        lines: cart.lines,
        selectedApartmentId: cart.selectedApartmentId,
        updatedAt: cart.updatedAt
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch {
    return Response.json({ error: "Не удалось сохранить корзину аккаунта." }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

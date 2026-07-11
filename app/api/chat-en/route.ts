import { apartments } from "@/lib/apartments";
import { formatArea, formatPrice } from "@/lib/format";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  apartmentId?: string;
  roomId?: string;
  message?: string;
};

function includesAny(message: string, words: string[]) {
  return words.some((word) => message.includes(word));
}

function answer(body: RequestBody) {
  const apartment = apartments.find((item) => item.id === body.apartmentId);
  if (!apartment) return { error: "Apartment not found." };

  const room = apartment.rooms.find((item) => item.id === body.roomId) ?? apartment.rooms[0];
  const message = String(body.message ?? "").trim();
  const lower = message.toLowerCase();
  const roomIntro = room ? `For the **${room.name}** zone (${formatArea(room.area, "en")}):` : "For this apartment:";

  if (includesAny(lower, ["price", "cost", "mortgage", "payment", "budget"])) {
    return {
      answer: [
        `The apartment costs **${formatPrice(apartment.price, "en")}**.`,
        `The estimated mortgage payment is **${formatPrice(apartment.mortgagePayment, "en")} per month**.`,
        `Total area: ${formatArea(apartment.totalArea, "en")}; floor: ${apartment.floor}.`,
        "Furniture selected in the HALL store is calculated separately in the cart."
      ].join("\n\n")
    };
  }

  if (includesAny(lower, ["seasonal", "suitcase", "winter", "summer", "boxes"])) {
    return {
      answer: [
        `${roomIntro} keep seasonal items in the highest and least accessible tier.`,
        "- Store coats in breathable garment bags on a high rail.",
        "- Use labelled boxes for shoes and accessories.",
        "- Put suitcases and rarely used items close to the ceiling.",
        "- Keep daily clothes between waist and eye level."
      ].join("\n")
    };
  }

  if (includesAny(lower, ["shelves", "rail", "rails", "hangers", "wardrobe"])) {
    return {
      answer: [
        `${roomIntro} combine shelves and hanging rails rather than choosing only one system.`,
        "- Use about 55–60% of the wall length for rails.",
        "- Reserve 25–30% for folded clothes, bags and boxes.",
        "- Add drawers or baskets for small items.",
        "- Keep one full-height section for coats and dresses."
      ].join("\n")
    };
  }

  if (includesAny(lower, ["family", "child", "children", "kids"])) {
    const suitable = apartment.roomsCount >= 2 && apartment.totalArea >= 55;
    return {
      answer: [
        suitable
          ? "**This apartment is a strong family option.**"
          : "**This apartment may suit a small family, but space should be planned carefully.**",
        `It has ${apartment.roomsCount} rooms and ${formatArea(apartment.totalArea, "en")}.`,
        "Keep the main circulation route clear and use built-in storage to reduce visual clutter.",
        apartment.rooms.some((item) => item.type === "children")
          ? "The floor plan already includes a dedicated children's room."
          : "A bedroom or study can be adapted as a children's room."
      ].join("\n\n")
    };
  }

  if (includesAny(lower, ["light", "lighting", "lamp", "window"])) {
    return {
      answer: [
        `${roomIntro} use layered lighting instead of one central fixture.`,
        "- Add general ceiling light for everyday use.",
        "- Place task lighting near a desk, mirror or worktop.",
        "- Use warm indirect light for evening scenarios.",
        "- Keep tall furniture away from the main daylight path."
      ].join("\n")
    };
  }

  if (includesAny(lower, ["furniture", "sofa", "bed", "table", "cabinet", "storage", "layout"])) {
    return {
      answer: [
        `${roomIntro} place the largest item along a solid wall and keep the center open.`,
        "- Leave at least 80–90 cm for the main passage.",
        "- Do not block doors, windows or heating elements.",
        "- Put a desk closer to daylight and storage closer to the entrance.",
        "- Use the Furniture section to add items to the account cart and calculate delivery."
      ].join("\n")
    };
  }

  if (includesAny(lower, ["advantage", "benefit", "best", "why", "good"])) {
    return {
      answer: [
        `Key advantages of **${apartment.title}**:`,
        `- ${formatArea(apartment.totalArea, "en")} of total space on floor ${apartment.floor};`,
        `- ${apartment.roomsCount} functional rooms with an interactive floor plan;`,
        `- ceiling height ${apartment.ceilingHeight} m;`,
        `- window orientation: ${apartment.windowView};`,
        `- estimated mortgage payment from ${formatPrice(apartment.mortgagePayment, "en")} per month.`
      ].join("\n")
    };
  }

  if (includesAny(lower, ["compare", "alternative", "other apartment"])) {
    const alternatives = apartments
      .filter((item) => item.id !== apartment.id && item.city === apartment.city && item.status !== "sold")
      .sort((left, right) => Math.abs(left.price - apartment.price) - Math.abs(right.price - apartment.price))
      .slice(0, 3);

    return {
      answer: [
        `Closest alternatives in ${apartment.city}:`,
        ...alternatives.map(
          (item) => `- **${item.project}: ${item.title}** — ${formatArea(item.totalArea, "en")}, floor ${item.floor}, ${formatPrice(item.price, "en")}.`
        )
      ].join("\n")
    };
  }

  return {
    answer: [
      `${roomIntro} please specify what you would like to evaluate.`,
      "You can ask about price, family suitability, storage, shelves and rails, seasonal items, lighting, furniture placement or alternatives."
    ].join("\n\n")
  };
}

export async function POST(request: Request) {
  const limit = checkRateLimit(request, "chat-en", { limit: 40, windowMs: 10 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit);

  try {
    const body = (await request.json()) as RequestBody;
    const message = String(body.message ?? "").trim();
    if (!message || message.length > 2000) {
      return Response.json({ error: "Enter a question up to 2,000 characters." }, { status: 400 });
    }

    const result = answer({ ...body, message });
    return Response.json(result, {
      status: "error" in result ? 404 : 200,
      headers: { "Cache-Control": "no-store" }
    });
  } catch {
    return Response.json(
      { error: "The request could not be processed. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

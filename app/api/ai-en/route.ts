import { apartments } from "@/lib/apartments";
import { formatArea, formatPrice, statusLabel } from "@/lib/format";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };
type RequestBody = { message?: string; history?: ChatMessage[]; city?: string; project?: string };
type ApartmentItem = (typeof apartments)[number];

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function containsAny(value: string, words: string[]) {
  return words.some((word) => value.includes(word));
}

function parseBudget(message: string) {
  const match = message.match(/(?:under|up to|max(?:imum)?|budget(?: of)?|less than)\s*\$?\s*([\d,.]+)\s*(k|thousand|m|million)?/i);
  if (!match) return null;
  const number = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(number)) return null;
  const unit = (match[2] ?? "").toLowerCase();
  const dollars = unit === "m" || unit === "million" ? number * 1_000_000 : unit === "k" || unit === "thousand" ? number * 1_000 : number;
  return dollars * 90;
}

function parseRooms(message: string) {
  const lower = normalize(message);
  if (containsAny(lower, ["studio", "one-bedroom", "one bedroom", "1-bedroom", "1 bedroom"])) return 1;
  if (containsAny(lower, ["two-bedroom", "two bedroom", "2-bedroom", "2 bedroom"])) return 2;
  if (containsAny(lower, ["three-bedroom", "three bedroom", "3-bedroom", "3 bedroom"])) return 3;
  if (containsAny(lower, ["four-bedroom", "four bedroom", "4-bedroom", "4 bedroom"])) return 4;
  return null;
}

function parseFloor(message: string) {
  const match = message.match(/(?:on\s+)?(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+floor/i);
  return match ? Number(match[1]) : null;
}

function parseMinArea(message: string) {
  const match = message.match(/(?:at least|minimum|min\.?|from)\s*(\d{2,3})\s*(?:m2|m²|sq\.?\s*m)/i);
  return match ? Number(match[1]) : null;
}

function scoreApartment(apartment: ApartmentItem, message: string) {
  const lower = normalize(message);
  const rooms = parseRooms(message);
  const floor = parseFloor(message);
  const budget = parseBudget(message);
  const minArea = parseMinArea(message);
  let score = apartment.status === "available" ? 250 : apartment.status === "reserved" ? 40 : -250;

  if (rooms) score += apartment.roomsCount === rooms ? 320 : -240;
  if (floor) score += apartment.floor === floor ? 260 : -100;
  if (budget) score += apartment.price <= budget ? 220 : -260;
  if (minArea) score += apartment.totalArea >= minArea ? 170 : -180;
  if (containsAny(lower, ["family", "children", "child", "kid"])) {
    score += apartment.roomsCount >= 2 ? 190 : -90;
    score += apartment.totalArea >= 55 ? 100 : 0;
  }
  if (containsAny(lower, ["rent", "rental", "investment", "income", "invest"])) {
    score += apartment.roomsCount <= 2 ? 170 : 10;
    score += apartment.price <= 10_000_000 ? 80 : 0;
  }
  if (containsAny(lower, ["cheap", "cheapest", "budget", "affordable"])) score += Math.max(0, 180 - apartment.price / 100_000);
  if (containsAny(lower, ["large", "largest", "spacious", "area"])) score += apartment.totalArea * 2;
  if (containsAny(lower, ["high floor", "view", "panoramic"])) score += apartment.floor * 7;
  return score;
}

function apartmentLine(apartment: ApartmentItem) {
  return `- **${apartment.project}: ${apartment.title}** — ${apartment.roomsCount} room(s), ${formatArea(apartment.totalArea, "en")}, floor ${apartment.floor}, **${formatPrice(apartment.price, "en")}**, ${statusLabel(apartment.status, "en")}.`;
}

function projectSummary(source: ApartmentItem[]) {
  const projects = [...new Set(source.map((item) => item.project))];
  return projects.map((project) => {
    const items = source.filter((item) => item.project === project && item.status !== "sold");
    const available = items.filter((item) => item.status === "available").length;
    return {
      project,
      available,
      count: items.length,
      minPrice: items.length ? Math.min(...items.map((item) => item.price)) : 0,
      maxArea: items.length ? Math.max(...items.map((item) => item.totalArea)) : 0
    };
  });
}

function contextualMessage(message: string, history?: ChatMessage[]) {
  const lower = normalize(message);
  const followUp = /^(and |what about|cheaper|more expensive|larger|smaller|show more|then )/.test(lower);
  if (!followUp) return message;
  const previous = [...(history ?? [])].reverse().find((item) => item.role === "user")?.content;
  return previous ? `${previous}. ${message}` : message;
}

function answer(message: string, city?: string, project?: string, history?: ChatMessage[]) {
  const effective = contextualMessage(message, history);
  const lower = normalize(effective);
  const validCity = apartments.some((item) => item.city === city) ? city : undefined;
  const validProject = validCity && apartments.some((item) => item.city === validCity && item.project === project) ? project : undefined;
  const source = apartments.filter((item) => (!validCity || item.city === validCity) && (!validProject || item.project === validProject));
  const active = source.filter((item) => item.status !== "sold");
  const context = validProject ? `${validCity}, ${validProject}` : validCity ? `${validCity}, all projects` : "the HALL catalog";

  if (!active.length) return `No active listings were found for **${context}**. Try changing the city or project in the header.`;

  if (containsAny(lower, ["hello", "hi", "what can you do", "help me"])) {
    return [
      `Hello! I am using **${context}** as the recommendation context.`,
      "",
      "You can ask about availability, budget, room count, floor, area, family suitability, rental income or project comparison."
    ].join("\n");
  }

  if (containsAny(lower, ["compare project", "best project", "which project", "residential project"])) {
    const summaries = projectSummary(active);
    return [
      `**Project comparison for ${context}:**`,
      "",
      ...summaries.map((item) => `- **${item.project}** — ${item.available} available out of ${item.count}, from **${formatPrice(item.minPrice, "en")}**, up to ${formatArea(item.maxArea, "en")}.`),
      "",
      "Tell me what matters most — price, area, floor or investment potential — and I will narrow the choice."
    ].join("\n");
  }

  if (containsAny(lower, ["how many", "available", "availability", "free apartments"])) {
    const available = active.filter((item) => item.status === "available");
    return [
      `There are **${available.length} available apartments** in **${context}**.`,
      "",
      ...available.slice(0, 5).map(apartmentLine)
    ].join("\n");
  }

  const rooms = parseRooms(effective);
  const floor = parseFloor(effective);
  const budget = parseBudget(effective);
  const minArea = parseMinArea(effective);
  const explicitlyFiltered = active.filter((item) => {
    if (rooms && item.roomsCount !== rooms) return false;
    if (floor && item.floor !== floor) return false;
    if (budget && item.price > budget) return false;
    if (minArea && item.totalArea < minArea) return false;
    return true;
  });

  const ranked = [...(explicitlyFiltered.length ? explicitlyFiltered : active)]
    .sort((a, b) => scoreApartment(b, effective) - scoreApartment(a, effective) || a.price - b.price)
    .slice(0, 4);

  if (!ranked.length) return `I could not find a matching apartment in **${context}**. Try increasing the budget or changing the room count or floor.`;

  let heading = "Best matching apartments";
  if (containsAny(lower, ["cheap", "cheapest", "affordable", "budget"])) heading = "Most affordable options";
  if (containsAny(lower, ["large", "largest", "spacious", "area"])) heading = "Largest options";
  if (containsAny(lower, ["family", "children", "child", "kid"])) heading = "Best options for a family";
  if (containsAny(lower, ["rent", "rental", "investment", "income", "invest"])) heading = "Best options for rental or investment";
  if (floor) heading = `Options on floor ${floor}`;
  if (rooms) heading = `${rooms}-room options`;

  return [
    `**${heading} in ${context}:**`,
    "",
    ...ranked.map(apartmentLine),
    "",
    "Open an apartment to explore its floor plan, rooms and furniture options."
  ].join("\n");
}

export async function POST(request: Request) {
  const limit = checkRateLimit(request, "ai-en", { limit: 30, windowMs: 10 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit);

  try {
    const body = await request.json() as RequestBody;
    const message = String(body.message ?? "").trim().slice(0, 1200);
    if (!message) return Response.json({ error: "Enter a question." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    return Response.json(
      { answer: answer(message, body.city, body.project, body.history) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return Response.json({ error: "Could not process the request." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}

import { apartments } from "@/lib/apartments";
import { formatArea, formatPrice } from "@/lib/format";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type AiOnlyRequest = {
  message?: string;
  history?: ChatMessage[];
};

function statusLabel(status: string) {
  if (status === "available") return "Свободна";
  if (status === "reserved") return "Бронь";
  if (status === "sold") return "Продана";
  return status;
}

function normalizeMessage(message: string) {
  return message.toLowerCase().replace(/ё/g, "е");
}

function matchesBudget(message: string) {
  const lower = normalizeMessage(message);
  const match = lower.match(/(?:до|меньше|не дороже|бюджет)\s*(\d+(?:[.,]\d+)?)\s*(млн|миллион|миллиона|миллионов)?/i);
  if (!match) return null;
  const number = Number(match[1].replace(",", "."));
  if (!Number.isFinite(number)) return null;
  return number < 1000 ? number * 1_000_000 : number;
}

const cities = [...new Set(apartments.map((apartment) => apartment.city))];

function requestedCity(message: string) {
  const lower = normalizeMessage(message);
  return cities.find((city) => lower.includes(normalizeMessage(city)));
}

function scoreApartment(apartment: (typeof apartments)[number], message: string) {
  const lower = normalizeMessage(message);
  let score = 0;

  if (apartment.status === "available") score += 200;
  if (apartment.status === "reserved") score += 40;
  if (apartment.status === "sold") score -= 200;

  if (lower.includes("семь") || lower.includes("ребен") || lower.includes("3 человек")) {
    score += apartment.roomsCount >= 2 ? 180 : -80;
    score += apartment.totalArea >= 55 ? 90 : -30;
  }

  if (lower.includes("аренд") || lower.includes("инвест")) {
    score += apartment.roomsCount <= 2 ? 160 : 20;
    score += apartment.price <= 10_000_000 ? 80 : -20;
    score += apartment.totalArea <= 65 ? 60 : 0;
  }

  if (lower.includes("дешев") || lower.includes("бюджет")) {
    score += Math.max(0, 140 - apartment.price / 100_000);
  }

  if (lower.includes("площад") || lower.includes("простор")) score += apartment.totalArea;

  const maxBudget = matchesBudget(message);
  if (maxBudget) score += apartment.price <= maxBudget ? 160 : -220;

  return score;
}

function findBestApartments(message: string, limit = 3) {
  const city = requestedCity(message);
  const source = city ? apartments.filter((apartment) => apartment.city === city) : apartments;
  return [...source]
    .sort((a, b) => scoreApartment(b, message) - scoreApartment(a, message) || a.price - b.price)
    .slice(0, limit);
}

function apartmentLine(apartment: (typeof apartments)[number]) {
  return `- **${apartment.city}, ${apartment.project}: ${apartment.title}** — ${formatArea(apartment.totalArea)}, ${apartment.floor} этаж, **${formatPrice(apartment.price)}**, статус: ${statusLabel(apartment.status)}.`;
}

function deterministicAnswer(message: string) {
  const lower = normalizeMessage(message);
  const city = requestedCity(message);
  const best = findBestApartments(message, 3);
  const main = best[0];

  if (!main) {
    return city
      ? `В городе **${city}** подходящие квартиры не найдены. Попробуйте изменить бюджет или комнатность.`
      : "Подходящие квартиры не найдены. Уточните город, бюджет, комнатность или цель покупки.";
  }

  if (lower.includes("лучш") || lower.includes("лучше") || lower.includes("подбер") || lower.includes("какая квартира")) {
    return [
      `**Лучший вариант по вашему запросу — ${main.city}, ${main.project}, ${main.title}.**`,
      "",
      `Цена: **${formatPrice(main.price)}**.`,
      `Площадь: **${formatArea(main.totalArea)}**, этаж: **${main.floor}**, статус: **${statusLabel(main.status)}**.`,
      "",
      "**Почему подходит:**",
      lower.includes("аренд")
        ? "- компактная планировка и понятная цена входа удобны для аренды;"
        : lower.includes("сем")
          ? "- площадь и комнатность лучше подходят для семьи;"
          : "- вариант выше остальных по совпадению с вашим запросом;",
      "- город, ЖК и цена указаны сразу для быстрого сравнения.",
      "",
      "**Еще можно рассмотреть:**",
      ...best.slice(1).map(apartmentLine),
      "",
      "Цена и наличие в демонстрационном каталоге требуют подтверждения менеджером."
    ].join("\n");
  }

  if (lower.includes("доступ") || lower.includes("свобод") || lower.includes("в наличии")) {
    const available = (city ? apartments.filter((item) => item.city === city) : apartments)
      .filter((item) => item.status === "available")
      .sort((a, b) => a.price - b.price)
      .slice(0, 5);
    return [city ? `**Свободные квартиры в городе ${city}:**` : "**Сейчас доступны такие квартиры:**", "", ...available.map(apartmentLine)].join("\n");
  }

  if (lower.includes("сравн")) {
    return [
      city ? `**Сравнение вариантов в городе ${city}:**` : "**Сравнение подходящих вариантов:**",
      "",
      ...best.map(apartmentLine),
      "",
      `Если выбирать один вариант, я бы начал с **${main.city}, ${main.title}** — цена **${formatPrice(main.price)}**.`
    ].join("\n");
  }

  return [
    city ? `**Краткая подборка по городу ${city}:**` : "**Краткая подборка по вашему запросу:**",
    "",
    ...best.map(apartmentLine),
    "",
    `Самый сильный вариант сейчас: **${main.city}, ${main.title}** за **${formatPrice(main.price)}**.`
  ].join("\n");
}

export async function POST(request: Request) {
  const limit = checkRateLimit(request, "general-ai", { limit: 25, windowMs: 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit);

  try {
    const body = (await request.json()) as AiOnlyRequest;
    const message = body.message?.trim();
    if (!message || message.length > 1200) {
      return Response.json({ error: "Введите сообщение длиной до 1200 символов." }, { status: 400 });
    }
    return Response.json({ answer: deterministicAnswer(message) });
  } catch {
    return Response.json({ error: "Не удалось обработать запрос. Попробуйте отправить вопрос еще раз." }, { status: 500 });
  }
}

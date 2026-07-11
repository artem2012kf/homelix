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
  city?: string;
  project?: string;
};

type SelectionContext = {
  city?: string;
  project?: string;
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

function resolveSelection(city?: string, project?: string): SelectionContext {
  const cleanCity = typeof city === "string" ? city.trim() : "";
  const validCity = cities.includes(cleanCity) ? cleanCity : undefined;
  const cleanProject = typeof project === "string" ? project.trim() : "";
  const validProject =
    validCity && cleanProject && apartments.some((apartment) => apartment.city === validCity && apartment.project === cleanProject)
      ? cleanProject
      : undefined;

  return { city: validCity, project: validProject };
}

function scopeForMessage(message: string, selected: SelectionContext): SelectionContext {
  if (selected.city) return selected;
  return { city: requestedCity(message) };
}

function scopedApartments(scope: SelectionContext) {
  return apartments.filter((apartment) => {
    if (scope.city && apartment.city !== scope.city) return false;
    if (scope.project && apartment.project !== scope.project) return false;
    return true;
  });
}

function scopeLabel(scope: SelectionContext) {
  if (scope.city && scope.project) return `${scope.city}, ${scope.project}`;
  if (scope.city) return `${scope.city}, все ЖК`;
  return "каталогу ХОЛЛ";
}

function scopeReason(scope: SelectionContext) {
  return scope.project
    ? "- рекомендации ограничены выбранными городом и жилым комплексом."
    : "- рекомендации сравнивают квартиры во всех ЖК выбранного города.";
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

function findBestApartments(message: string, scope: SelectionContext, limit = 3) {
  const scoped = scopedApartments(scope);
  const active = scoped.filter((apartment) => apartment.status !== "sold");
  const source = active.length ? active : scoped;

  return [...source]
    .sort((a, b) => scoreApartment(b, message) - scoreApartment(a, message) || a.price - b.price)
    .slice(0, limit);
}

function apartmentLine(apartment: (typeof apartments)[number]) {
  return `- **${apartment.project}: ${apartment.title}** — ${formatArea(apartment.totalArea)}, ${apartment.floor} этаж, **${formatPrice(apartment.price)}**, статус: ${statusLabel(apartment.status)}.`;
}

function deterministicAnswer(message: string, selected: SelectionContext) {
  const lower = normalizeMessage(message);
  const scope = scopeForMessage(message, selected);
  const source = scopedApartments(scope);
  const best = findBestApartments(message, scope, 3);
  const main = best[0];
  const context = scopeLabel(scope);

  if (!main) {
    return `В выбранном контексте **${context}** подходящие квартиры не найдены. Попробуйте изменить город или ЖК в шапке либо ослабить требования.`;
  }

  if (lower.includes("лучш") || lower.includes("лучше") || lower.includes("подбер") || lower.includes("какая квартира")) {
    return [
      `**Подборка для ${context}.**`,
      "",
      `Лучший вариант по вашему запросу — **${main.project}, ${main.title}**.`,
      `Цена: **${formatPrice(main.price)}**.`,
      `Площадь: **${formatArea(main.totalArea)}**, этаж: **${main.floor}**, статус: **${statusLabel(main.status)}**.`,
      "",
      "**Почему подходит:**",
      lower.includes("аренд")
        ? "- компактная планировка и понятная цена входа удобны для аренды;"
        : lower.includes("сем")
          ? "- площадь и комнатность лучше подходят для семьи;"
          : "- вариант выше остальных по совпадению с вашим запросом;",
      scopeReason(scope),
      "",
      ...(best.length > 1 ? ["**Еще можно рассмотреть:**", ...best.slice(1).map(apartmentLine), ""] : []),
      "Цена и наличие необходимо подтвердить у менеджера."
    ].join("\n");
  }

  if (lower.includes("доступ") || lower.includes("свобод") || lower.includes("в наличии")) {
    const available = source
      .filter((item) => item.status === "available")
      .sort((a, b) => a.price - b.price)
      .slice(0, 5);

    if (!available.length) {
      return `В **${context}** сейчас нет квартир со статусом «Свободна». Можно посмотреть варианты в брони или выбрать другой ЖК в шапке.`;
    }

    return [`**Свободные квартиры: ${context}:**`, "", ...available.map(apartmentLine)].join("\n");
  }

  if (lower.includes("сравн")) {
    return [
      `**Сравнение вариантов: ${context}:**`,
      "",
      ...best.map(apartmentLine),
      "",
      `Если выбирать один вариант, я бы начал с **${main.title}** — цена **${formatPrice(main.price)}**.`
    ].join("\n");
  }

  return [
    `**Краткая подборка: ${context}:**`,
    "",
    ...best.map(apartmentLine),
    "",
    `Самый сильный вариант сейчас: **${main.title}** за **${formatPrice(main.price)}**.`
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

    const selection = resolveSelection(body.city, body.project);
    return Response.json({ answer: deterministicAnswer(message, selection) });
  } catch {
    return Response.json({ error: "Не удалось обработать запрос. Попробуйте отправить вопрос еще раз." }, { status: 500 });
  }
}

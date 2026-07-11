import { apartments } from "@/lib/apartments";
import { formatArea, formatPrice } from "@/lib/format";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { residentialComplexes } from "@/lib/residential-complexes";

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

type ApartmentItem = (typeof apartments)[number];

function statusLabel(status: string) {
  if (status === "available") return "Свободна";
  if (status === "reserved") return "Бронь";
  if (status === "sold") return "Продана";
  return status;
}

function normalizeMessage(message: string) {
  return message.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();
}

function containsAny(message: string, variants: string[]) {
  return variants.some((variant) => message.includes(variant));
}

function matchesBudget(message: string) {
  const lower = normalizeMessage(message);
  const match = lower.match(/(?:до|меньше|не дороже|бюджет(?:ом)?|максимум)\s*(\d+(?:[.,]\d+)?)\s*(млн|миллион|миллиона|миллионов)?/i);
  if (!match) return null;
  const number = Number(match[1].replace(",", "."));
  if (!Number.isFinite(number)) return null;
  return number < 1000 ? number * 1_000_000 : number;
}

function requestedRooms(message: string) {
  const lower = normalizeMessage(message);
  if (containsAny(lower, ["студи", "однокомнат", "однушк"])) return 1;
  if (containsAny(lower, ["двухкомнат", "двух комнат", "двушк"])) return 2;
  if (containsAny(lower, ["трехкомнат", "трёхкомнат", "три комнат", "трешк", "трёшк"])) return 3;
  if (containsAny(lower, ["четырехкомнат", "четырёхкомнат", "четыре комнат"])) return 4;
  const match = lower.match(/(?:^|\D)([1-4])\s*[- ]?(?:комнат|комн)/);
  return match ? Number(match[1]) : null;
}

function requestedFloor(message: string) {
  const lower = normalizeMessage(message);
  const direct = lower.match(/(?:на\s+)?(\d{1,2})\s*(?:-?м|-?й)?\s*этаж/);
  if (direct) return Number(direct[1]);
  const reversed = lower.match(/этаж\s*(\d{1,2})/);
  return reversed ? Number(reversed[1]) : null;
}

function requestedMinArea(message: string) {
  const lower = normalizeMessage(message);
  const match = lower.match(/(?:от|не меньше|минимум)\s*(\d{2,3})\s*(?:м2|м²|кв(?:адратных)?\s*м)/);
  return match ? Number(match[1]) : null;
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

function scoreApartment(apartment: ApartmentItem, message: string) {
  const lower = normalizeMessage(message);
  const rooms = requestedRooms(message);
  const floor = requestedFloor(message);
  const minArea = requestedMinArea(message);
  const maxBudget = matchesBudget(message);
  let score = 0;

  if (apartment.status === "available") score += 200;
  if (apartment.status === "reserved") score += 40;
  if (apartment.status === "sold") score -= 200;

  if (rooms) score += apartment.roomsCount === rooms ? 320 : -240;
  if (floor) score += apartment.floor === floor ? 260 : -120;
  if (minArea) score += apartment.totalArea >= minArea ? 160 : -180;
  if (maxBudget) score += apartment.price <= maxBudget ? 220 : -260;

  if (containsAny(lower, ["семь", "ребен", "дет", "3 человек", "4 человек"])) {
    score += apartment.roomsCount >= 2 ? 180 : -80;
    score += apartment.totalArea >= 55 ? 90 : -30;
  }

  if (containsAny(lower, ["аренд", "инвест", "вложен", "доход"])) {
    score += apartment.roomsCount <= 2 ? 160 : 20;
    score += apartment.price <= 10_000_000 ? 80 : -20;
    score += apartment.totalArea <= 65 ? 60 : 0;
  }

  if (containsAny(lower, ["дешев", "бюджет", "эконом"])) {
    score += Math.max(0, 180 - apartment.price / 100_000);
  }

  if (containsAny(lower, ["площад", "простор", "больш"])) score += apartment.totalArea;
  if (containsAny(lower, ["низк", "перв", "невысок"])) score += Math.max(0, 50 - apartment.floor * 4);
  if (containsAny(lower, ["высок", "видов", "панорам"])) score += apartment.floor * 5;

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

function roomLabel(count: number) {
  if (count === 1) return "студия / 1-комнатная";
  return `${count}-комнатная`;
}

function apartmentLine(apartment: ApartmentItem) {
  return `- **${apartment.project}: ${apartment.title}** — ${roomLabel(apartment.roomsCount)}, ${formatArea(apartment.totalArea)}, ${apartment.floor} этаж, **${formatPrice(apartment.price)}**, статус: ${statusLabel(apartment.status)}.`;
}

function apartmentDetails(apartment: ApartmentItem) {
  return [
    `**${apartment.project}: ${apartment.title}**`,
    `- ${roomLabel(apartment.roomsCount)}, ${formatArea(apartment.totalArea)}, ${apartment.floor} этаж;`,
    `- цена: **${formatPrice(apartment.price)}**; ипотечный платёж: **${formatPrice(apartment.mortgagePayment)}/мес.**;`,
    `- отделка: ${apartment.finishing}; высота потолков: ${apartment.ceilingHeight} м;`,
    `- вид из окон: ${apartment.windowView}; статус: ${statusLabel(apartment.status)}.`
  ].join("\n");
}

function applyExplicitCriteria(source: ApartmentItem[], message: string) {
  const rooms = requestedRooms(message);
  const floor = requestedFloor(message);
  const minArea = requestedMinArea(message);
  const maxBudget = matchesBudget(message);

  return source.filter((apartment) => {
    if (apartment.status === "sold") return false;
    if (rooms && apartment.roomsCount !== rooms) return false;
    if (floor && apartment.floor !== floor) return false;
    if (minArea && apartment.totalArea < minArea) return false;
    if (maxBudget && apartment.price > maxBudget) return false;
    return true;
  });
}

function projectSummaries(source: ApartmentItem[]) {
  const projects = [...new Set(source.map((apartment) => apartment.project))];
  return projects.map((project) => {
    const projectApartments = source.filter((apartment) => apartment.project === project);
    const active = projectApartments.filter((apartment) => apartment.status !== "sold");
    const available = projectApartments.filter((apartment) => apartment.status === "available");
    const prices = active.map((apartment) => apartment.price);
    const meta = residentialComplexes.find((complex) => complex.name === project);
    return {
      project,
      count: active.length,
      available: available.length,
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxArea: active.length ? Math.max(...active.map((apartment) => apartment.totalArea)) : 0,
      rating: meta?.rating,
      priceLevel: meta?.priceLevel,
      developer: meta?.developer,
      tags: meta?.tags ?? []
    };
  });
}

function projectLine(summary: ReturnType<typeof projectSummaries>[number]) {
  const details = [
    summary.priceLevel,
    summary.rating ? `рейтинг ${summary.rating}` : undefined,
    summary.developer ? `застройщик: ${summary.developer}` : undefined
  ].filter(Boolean).join(", ");
  return `- **${summary.project}** — ${summary.available} свободных из ${summary.count} активных, от **${formatPrice(summary.minPrice)}**, до ${formatArea(summary.maxArea)}${details ? `; ${details}` : ""}.`;
}

function contextualMessage(message: string, history: ChatMessage[] | undefined) {
  const lower = normalizeMessage(message);
  const isFollowUp = /^(а\s|тогда|еще|ещё|дешевле|дороже|больше|меньше|покажи еще|покажи ещё)/.test(lower);
  if (!isFollowUp) return message;
  const previousUser = [...(history ?? [])].reverse().find((item) => item.role === "user")?.content;
  return previousUser ? `${previousUser}. ${message}` : message;
}

function deterministicAnswer(message: string, selected: SelectionContext, history?: ChatMessage[]) {
  const effectiveMessage = contextualMessage(message, history);
  const lower = normalizeMessage(effectiveMessage);
  const scope = scopeForMessage(effectiveMessage, selected);
  const source = scopedApartments(scope);
  const active = source.filter((apartment) => apartment.status !== "sold");
  const best = findBestApartments(effectiveMessage, scope, 4);
  const main = best[0];
  const context = scopeLabel(scope);

  if (!main) {
    return `В выбранном контексте **${context}** подходящие квартиры не найдены. Попробуйте изменить город или ЖК в шапке либо ослабить требования.`;
  }

  if (containsAny(lower, ["привет", "здравств", "добрый день", "что умеешь", "помоги"])) {
    return [
      `Здравствуйте! Я учитываю выбор **${context}**.`,
      "",
      "Можно спросить меня:",
      "- какие квартиры свободны и сколько они стоят;",
      "- есть ли 2-комнатная на нужном этаже;",
      "- какой ЖК лучше для семьи или инвестиций;",
      "- где ниже ипотечный платёж;",
      "- у какой квартиры больше площадь, лучше вид или отделка."
    ].join("\n");
  }

  const asksAboutProject = lower.includes("жк") && containsAny(lower, ["какой", "лучший", "сравн", "расскажи", "что за", "про ", "выбрать"]);
  if (asksAboutProject) {
    const summaries = projectSummaries(source).sort((a, b) => b.available - a.available || a.minPrice - b.minPrice);
    if (scope.project) {
      const summary = summaries.find((item) => item.project === scope.project);
      const meta = residentialComplexes.find((complex) => complex.name === scope.project);
      return [
        `**${scope.project} — кратко:**`,
        "",
        summary ? projectLine(summary) : "Данные по предложениям временно недоступны.",
        meta?.tags.length ? `Особенности: ${meta.tags.slice(0, 4).join(", ")}.` : "",
        "",
        `Лучшее активное предложение:`,
        apartmentLine(main)
      ].filter(Boolean).join("\n");
    }
    return [
      `**Сравнение ЖК: ${context}:**`,
      "",
      ...summaries.map(projectLine),
      "",
      summaries[0] ? `По числу доступных вариантов сейчас лидирует **${summaries[0].project}**.` : ""
    ].filter(Boolean).join("\n");
  }

  if (containsAny(lower, ["сколько квартир", "сколько вариантов", "количество квартир", "сколько предложений"])) {
    const available = source.filter((item) => item.status === "available").length;
    const reserved = source.filter((item) => item.status === "reserved").length;
    const sold = source.filter((item) => item.status === "sold").length;
    return [
      `**Предложения в ${context}:**`,
      "",
      `- всего: **${source.length}**;`,
      `- свободно: **${available}**;`,
      `- в брони: **${reserved}**;`,
      `- продано: **${sold}**.`
    ].join("\n");
  }

  if (containsAny(lower, ["ипотек", "платеж", "платёж", "в месяц", "ежемесяч"])) {
    const mortgage = [...active].sort((a, b) => a.mortgagePayment - b.mortgagePayment).slice(0, 5);
    return [
      `**Минимальные ипотечные платежи: ${context}:**`,
      "",
      ...mortgage.map((apartment) => `- **${apartment.project}: ${apartment.title}** — от **${formatPrice(apartment.mortgagePayment)}/мес.**, цена ${formatPrice(apartment.price)}.`),
      "",
      "Расчёт ориентировочный: ставку и первоначальный взнос нужно подтвердить у банка и менеджера."
    ].join("\n");
  }

  if (containsAny(lower, ["доступ", "свобод", "в наличии", "можно купить"])) {
    const available = applyExplicitCriteria(source, effectiveMessage)
      .filter((item) => item.status === "available")
      .sort((a, b) => a.price - b.price)
      .slice(0, 6);

    if (!available.length) {
      return `В **${context}** по указанным условиям сейчас нет квартир со статусом «Свободна». Можно ослабить требования или выбрать другой ЖК.`;
    }

    return [`**Свободные квартиры: ${context}:**`, "", ...available.map(apartmentLine)].join("\n");
  }

  const rooms = requestedRooms(effectiveMessage);
  const floor = requestedFloor(effectiveMessage);
  const minArea = requestedMinArea(effectiveMessage);
  const maxBudget = matchesBudget(effectiveMessage);
  if (rooms || floor || minArea || maxBudget) {
    const matches = applyExplicitCriteria(source, effectiveMessage)
      .sort((a, b) => scoreApartment(b, effectiveMessage) - scoreApartment(a, effectiveMessage) || a.price - b.price)
      .slice(0, 6);
    const conditions = [
      rooms ? roomLabel(rooms) : undefined,
      floor ? `${floor} этаж` : undefined,
      minArea ? `от ${formatArea(minArea)}` : undefined,
      maxBudget ? `до ${formatPrice(maxBudget)}` : undefined
    ].filter(Boolean).join(", ");

    if (!matches.length) {
      return `В **${context}** не нашлось активных квартир по условиям: **${conditions}**. Попробуйте изменить этаж, комнатность, площадь или бюджет.`;
    }

    return [
      `**Нашёл ${matches.length} подходящих вариантов: ${conditions}.**`,
      "",
      ...matches.map(apartmentLine),
      "",
      `Лучшее совпадение — **${matches[0].project}, ${matches[0].title}**.`
    ].join("\n");
  }

  if (containsAny(lower, ["цена", "стоим", "сколько стоит", "дешев", "дорог", "бюджет"])) {
    const ordered = [...active].sort((a, b) => a.price - b.price);
    const cheapest = ordered[0];
    const expensive = ordered.at(-1);
    return [
      `**Цены в ${context}:**`,
      "",
      `Диапазон активных предложений: от **${formatPrice(cheapest.price)}** до **${formatPrice(expensive?.price ?? cheapest.price)}**.`,
      "",
      "Самые доступные варианты:",
      ...ordered.slice(0, 4).map(apartmentLine)
    ].join("\n");
  }

  if (containsAny(lower, ["площад", "простор", "самая большая", "больше всего метров"])) {
    const spacious = [...active].sort((a, b) => b.totalArea - a.totalArea).slice(0, 5);
    return [
      `**Самые просторные квартиры: ${context}:**`,
      "",
      ...spacious.map(apartmentLine),
      "",
      `Максимальная площадь сейчас — **${formatArea(spacious[0].totalArea)}**.`
    ].join("\n");
  }

  if (containsAny(lower, ["отделк", "ремонт", "потолк", "характеристик"])) {
    return [
      `**Характеристики подходящего варианта в ${context}:**`,
      "",
      apartmentDetails(main),
      "",
      "Могу также подобрать вариант с другой площадью, этажом или бюджетом."
    ].join("\n");
  }

  if (containsAny(lower, ["вид из окна", "видов", "панорам", "окна"])) {
    const viewOptions = [...active]
      .sort((a, b) => b.floor - a.floor)
      .slice(0, 5);
    return [
      `**Варианты с наиболее высоких этажей: ${context}:**`,
      "",
      ...viewOptions.map((apartment) => `- **${apartment.project}: ${apartment.title}** — ${apartment.floor} этаж, вид: ${apartment.windowView}, ${formatArea(apartment.totalArea)}, ${formatPrice(apartment.price)}.`)
    ].join("\n");
  }

  if (containsAny(lower, ["сравн", "разница", "чем отличается"])) {
    return [
      `**Сравнение вариантов: ${context}:**`,
      "",
      ...best.slice(0, 3).map((apartment, index) => `${index + 1}. ${apartmentDetails(apartment)}`),
      "",
      `По совокупности цены, статуса и параметров я бы начал с **${main.project}, ${main.title}**.`
    ].join("\n\n");
  }

  if (containsAny(lower, ["лучш", "лучше", "подбер", "какая квартира", "семь", "ребен", "аренд", "инвест", "вложен"])) {
    const reason = containsAny(lower, ["аренд", "инвест", "вложен"])
      ? "компактная площадь и более доступная цена входа удобнее для аренды или инвестиций"
      : containsAny(lower, ["семь", "ребен", "дет"])
        ? "комнатность и площадь лучше подходят для семьи"
        : "вариант выше остальных по совпадению с вашим запросом";
    return [
      `**Рекомендация для ${context}.**`,
      "",
      apartmentDetails(main),
      "",
      `**Почему подходит:** ${reason}.`,
      scopeReason(scope),
      "",
      ...(best.length > 1 ? ["**Альтернативы:**", ...best.slice(1, 4).map(apartmentLine)] : []),
      "",
      "Цена и наличие требуют подтверждения у менеджера."
    ].join("\n");
  }

  return [
    `Я понял вопрос про **${context}**, но для точного ответа нужно уточнить критерий.`,
    "",
    "Напишите, что важнее: **цена, комнатность, этаж, площадь, ипотека, вид из окна, семья или инвестиции**.",
    "",
    `Пока наиболее универсальный вариант:`,
    apartmentLine(main)
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
    return Response.json({ answer: deterministicAnswer(message, selection, body.history) });
  } catch {
    return Response.json({ error: "Не удалось обработать запрос. Попробуйте отправить вопрос еще раз." }, { status: 500 });
  }
}

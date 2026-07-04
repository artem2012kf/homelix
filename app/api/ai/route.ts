import { apartments as sourceApartments } from "@/lib/apartments";
import type { Apartment } from "@/types/apartment";

export const runtime = "nodejs";

const OPENROUTER_TIMEOUT_MS = 28_000;
const MAX_USER_MESSAGE_LENGTH = 900;
const SIMPLE_MAX_TOKENS = 220;
const NORMAL_MAX_TOKENS = 280;

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type AiOnlyRequest = {
  message?: string;
  history?: ChatMessage[];
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceApartmentIdsWithTitles(answer: string) {
  return sourceApartments.reduce((text, apartment) => {
    return text.replace(new RegExp(`\\b${escapeRegExp(apartment.id)}\\b`, "g"), apartment.title);
  }, answer);
}

function isComplexRequest(message: string) {
  const lower = message.toLowerCase();

  return (
    message.length > 450 ||
    lower.includes("подробно") ||
    lower.includes("детально") ||
    lower.includes("таблиц") ||
    lower.includes("сравни все") ||
    lower.includes("кажд") ||
    lower.includes("полный список") ||
    lower.includes("все квартиры") ||
    lower.includes("расскажи обо всех")
  );
}

function trimUserMessage(message: string) {
  if (message.length <= MAX_USER_MESSAGE_LENGTH) return message;

  return `${message.slice(0, MAX_USER_MESSAGE_LENGTH)}\n\n[Сообщение клиента было сокращено системой, потому что бесплатная модель OpenRouter имеет ограничение по объему запроса.]`;
}

function compactApartmentsForAi(apartments: Apartment[]) {
  return apartments.map((apartment) => ({
    name: apartment.title,
    project: apartment.project,
    building: apartment.building,
    section: apartment.section,
    floor: apartment.floor,
    roomsCount: apartment.roomsCount,
    totalArea: apartment.totalArea,
    price: apartment.price,
    mortgagePayment: apartment.mortgagePayment,
    status: apartment.status,
    windowView: apartment.windowView,
    finishing: apartment.finishing,
    advantages: apartment.advantages.slice(0, 2),
    rooms: apartment.rooms.slice(0, 6).map((room) => `${room.name}: ${room.area} м²`).join("; ")
  }));
}

function findRelevantApartments(message: string, apartments: Apartment[], limit = 6) {
  const lower = message.toLowerCase();

  let filtered = apartments;

  const budgetMatch = lower.match(/(?:до|меньше|не дороже|бюджет)\s*(\d+(?:[.,]\d+)?)\s*(?:млн|миллион|миллиона|миллионов)/i);
  if (budgetMatch) {
    const maxPrice = Number(budgetMatch[1].replace(",", ".")) * 1_000_000;
    filtered = filtered.filter((apartment) => apartment.price <= maxPrice);
  }

  if (lower.includes("студи")) {
    filtered = filtered.filter((apartment) => apartment.roomsCount === 0 || apartment.title.toLowerCase().includes("студи"));
  } else if (lower.includes("евро-2") || lower.includes("евродв")) {
    filtered = filtered.filter((apartment) => apartment.title.toLowerCase().includes("евро-2"));
  } else if (lower.includes("1-ком") || lower.includes("одноком")) {
    filtered = filtered.filter((apartment) => apartment.roomsCount === 1);
  } else if (lower.includes("2-ком") || lower.includes("двухком") || lower.includes("двуш")) {
    filtered = filtered.filter((apartment) => apartment.roomsCount === 2);
  } else if (lower.includes("3-ком") || lower.includes("трехком") || lower.includes("трёхком") || lower.includes("треш")) {
    filtered = filtered.filter((apartment) => apartment.roomsCount === 3);
  } else if (lower.includes("4-ком") || lower.includes("четырехком") || lower.includes("четырёхком")) {
    filtered = filtered.filter((apartment) => apartment.roomsCount === 4);
  }

  if (lower.includes("доступ") || lower.includes("свобод") || lower.includes("в наличии")) {
    filtered = filtered.filter((apartment) => apartment.status === "available");
  }

  if (lower.includes("семь") || lower.includes("ребен") || lower.includes("ребён")) {
    filtered = filtered.filter((apartment) => apartment.roomsCount >= 2 || apartment.totalArea >= 55);
  }

  if (lower.includes("аренд") || lower.includes("инвест")) {
    filtered = filtered.filter((apartment) => apartment.roomsCount <= 2 || apartment.totalArea <= 65);
  }

  const sorted = [...filtered].sort((a, b) => {
    if (a.status === "available" && b.status !== "available") return -1;
    if (a.status !== "available" && b.status === "available") return 1;
    return a.price - b.price;
  });

  return sorted.slice(0, limit);
}

function demoAnswer(message: string, apartments: Apartment[]) {
  const available = apartments.filter((item) => item.status === "available");
  const options = available
    .slice(0, 3)
    .map((item) => `- **${item.title}** — ${item.totalArea} м², ${item.floor} этаж, ${item.price.toLocaleString("ru-RU")} ₽.`)
    .join("\n");

  return [
    "Демо-ответ без OpenRouter API-ключа.",
    available.length ? `Сейчас доступны следующие варианты:\n${options}` : "В демо-данных нет доступных квартир.",
    `Ваш вопрос: «${message}».`,
    "Чтобы получить настоящий ИИ-ответ, добавьте OPENROUTER_API_KEY в .env.local."
  ].join("\n\n");
}

function limitAnswer(reason: "timeout" | "credits" | "unknown", relevantApartments: Apartment[]) {
  const options = relevantApartments
    .slice(0, 3)
    .map((item) => `- **${item.title}** — ${item.totalArea} м², ${item.floor} этаж, ${item.price.toLocaleString("ru-RU")} ₽.`)
    .join("\n");

  const reasonText =
    reason === "timeout"
      ? "модель слишком долго обрабатывала расширенный запрос"
      : reason === "credits"
        ? "бесплатная модель OpenRouter ограничила объем запроса или ответа"
        : "OpenRouter не смог обработать расширенный запрос";

  return [
    `**Запрос получился слишком объемным:** ${reasonText}.`,
    "Я могу продолжить консультацию, но лучше разделить вопрос на несколько коротких частей: например, отдельно спросить про бюджет, затем про планировку и затем про сравнение 2–3 вариантов.",
    options ? `По текущей подборке можно начать с этих вариантов:\n${options}` : "Подходящие варианты не найдены по текущему запросу. Попробуйте уточнить бюджет, комнатность или площадь."
  ].join("\n\n");
}

async function askOpenRouter(args: {
  apiKey: string;
  model: string;
  siteUrl: string;
  messages: ChatMessage[];
  maxTokens: number;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

  try {
    return await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": args.siteUrl,
        "X-Title": "Developer Real Estate AI"
      },
      body: JSON.stringify({
        model: args.model,
        messages: args.messages,
        temperature: 0.25,
        max_tokens: args.maxTokens
      })
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AiOnlyRequest;
    const rawMessage = body.message?.trim();

    if (!rawMessage) {
      return Response.json({ error: "Нет сообщения." }, { status: 400 });
    }

    const message = trimUserMessage(rawMessage);
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "qwen/qwen3-next-80b-a3b-instruct:free";
    const complex = isComplexRequest(rawMessage);
    const relevantApartments = findRelevantApartments(rawMessage, sourceApartments, complex ? 4 : 6);

    if (!apiKey) {
      return Response.json({ answer: demoAnswer(rawMessage, relevantApartments) });
    }

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `
Ты официальный ИИ-консультант сайта застройщика.
Это отдельная страница консультации без выбора комнат на планировке.
Помогай клиенту подобрать квартиру, сравнить варианты, оценить площадь, цену, этаж, отделку, преимущества и сценарии проживания.
Отвечай по-русски в деловом, вежливом и сдержанном тоне. Обращайся к клиенту на «вы».
Не начинай каждый ответ с приветствия. Приветствие допустимо только в первом сообщении диалога; дальше сразу отвечай по сути и учитывай историю.
Ответ должен быть кратким: максимум 2–3 абзаца или 3–5 пунктов.
Если вопрос сложный, не пытайся описывать все 30 квартир. Выбери 2–3 наиболее подходящих варианта и предложи уточнить критерии.
Форматируй ответ в Markdown: выделяй главное через **жирный текст**, уточнения через *курсив*, списки через "-". Не используй HTML.
Называй квартиры только по полю name/title, не используй технические идентификаторы вида apt-204.
Не выдумывай цену, сроки, скидки, юридические условия, ипотечные ставки и условия бронирования.
Если данных не хватает, корректно напиши: «Эту информацию лучше уточнить у менеджера отдела продаж».
        `.trim()
      },
      {
        role: "system",
        content: `Короткая подборка релевантных квартир. Используй только эти данные, называй варианты по name:\n${JSON.stringify(compactApartmentsForAi(relevantApartments), null, 0)}`
      },
      ...((body.history ?? [])
        .filter((item) => item.role === "user" || item.role === "assistant")
        .slice(-4)
        .map((item) => ({ role: item.role, content: item.content.slice(0, 700) })) as ChatMessage[]),
      { role: "user", content: message }
    ];

    let openRouterResponse: Response;

    try {
      openRouterResponse = await askOpenRouter({
        apiKey,
        model,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        messages,
        maxTokens: complex ? SIMPLE_MAX_TOKENS : NORMAL_MAX_TOKENS
      });
    } catch (error) {
      return Response.json({ answer: limitAnswer("timeout", relevantApartments) });
    }

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      const isLimitError =
        openRouterResponse.status === 402 ||
        errorText.toLowerCase().includes("credits") ||
        errorText.toLowerCase().includes("tokens") ||
        errorText.toLowerCase().includes("limit");

      if (isLimitError) {
        return Response.json({ answer: limitAnswer("credits", relevantApartments) });
      }

      return Response.json(
        { error: `OpenRouter вернул ошибку: ${openRouterResponse.status}. ${errorText.slice(0, 500)}` },
        { status: 502 }
      );
    }

    const data = await openRouterResponse.json();
    const answer = data?.choices?.[0]?.message?.content;

    return Response.json({ answer: answer ? replaceApartmentIdsWithTitles(answer) : "ИИ не вернул текстовый ответ." });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Неизвестная ошибка сервера."
      },
      { status: 500 }
    );
  }
}

import { apartments as sourceApartments } from "@/lib/apartments";
import type { Apartment } from "@/types/apartment";

export const runtime = "nodejs";

const OPENROUTER_TIMEOUT_MS = 28_000;
const MAX_USER_MESSAGE_LENGTH = 700;
const HISTORY_LIMIT = 2;
const HISTORY_MESSAGE_LENGTH = 300;
const SIMPLE_MAX_TOKENS = 340;
const NORMAL_MAX_TOKENS = 440;
const RETRY_MAX_TOKENS = 240;

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

function statusLabel(status: Apartment["status"]) {
  if (status === "available") return "Свободна";
  if (status === "reserved") return "Бронь";
  if (status === "sold") return "Продана";
  return status;
}

function isComplexRequest(message: string) {
  const lower = message.toLowerCase();

  return (
    message.length > 700 ||
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

function shortText(value: string | undefined, max = 160) {
  if (!value) return "";
  return value.length <= max ? value : `${value.slice(0, max)}...`;
}

function compactApartmentsForAi(apartments: Apartment[], ultraCompact = false) {
  return apartments.map((apartment) => {
    const base = {
      name: apartment.title,
      floor: apartment.floor,
      roomsCount: apartment.roomsCount,
      totalArea: apartment.totalArea,
      price: apartment.price,
      mortgagePayment: apartment.mortgagePayment,
      status: apartment.status
    };

    if (ultraCompact) {
      return base;
    }

    return {
      ...base,
      project: apartment.project,
      building: apartment.building,
      finishing: apartment.finishing,
      advantages: apartment.advantages.slice(0, 1).map((advantage) => shortText(advantage, 100)),
      rooms: apartment.rooms.slice(0, 4).map((room) => `${room.name}: ${room.area} м²`).join("; ")
    };
  });
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

function limitAnswer(reason: "timeout" | "credits" | "unknown", relevantApartments: Apartment[], message = "") {
  const options = relevantApartments
    .slice(0, 3)
    .map((item) => `- **${item.title}** — ${item.totalArea} м², ${item.floor} этаж, ${item.price.toLocaleString("ru-RU")} ₽, статус: ${statusLabel(item.status)}.`)
    .join("\n");

  const lower = message.toLowerCase();

  if (lower.includes("семь") || lower.includes("ребен") || lower.includes("ребён")) {
    return [
      "**Для семьи** лучше смотреть варианты от 2 комнат или евро-планировки с отдельной спальней.",
      options ? `Подходящие варианты:\n${options}` : "По текущим условиям подходящие варианты не найдены.",
      "Для точного подбора уточните бюджет и желаемую комнатность."
    ].join("\n\n");
  }

  if (lower.includes("аренд") || lower.includes("инвест")) {
    return [
      "**Для аренды** чаще удобнее компактные квартиры с понятной планировкой и умеренной ценой входа.",
      options ? `Можно рассмотреть:\n${options}` : "По текущим условиям подходящие варианты не найдены.",
      "Следующий шаг — сравнить цену, площадь и этаж 2–3 выбранных вариантов."
    ].join("\n\n");
  }

  return [
    "**Краткая подборка по вашему запросу:**",
    options || "Подходящие варианты не найдены. Попробуйте уточнить бюджет, комнатность или площадь.",
    "Для более точного ответа напишите коротко: например, **до 12 млн**, **для семьи**, **для аренды**, **2-комнатная**."
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
        temperature: 0.2,
        max_tokens: args.maxTokens
      })
    });
  } finally {
    clearTimeout(timeout);
  }
}

function isOpenRouterLimitError(status: number, errorText: string) {
  const lower = errorText.toLowerCase();

  return (
    status === 400 ||
    status === 402 ||
    status === 404 ||
    status === 413 ||
    lower.includes("credits") ||
    lower.includes("tokens") ||
    lower.includes("context") ||
    lower.includes("limit") ||
    lower.includes("too large")
  );
}


function stripOpenRouterReasoning(rawAnswer: string) {
  let answer = rawAnswer
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:thinking|analysis|reasoning)?[\s\S]*?```/gi, "")
    .trim();

  const paragraphs = answer
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (paragraphs.length > 1) {
    const firstUsefulIndex = paragraphs.findIndex((paragraph) => /[А-Яа-яЁё]/.test(paragraph));
    if (firstUsefulIndex > 0) {
      answer = paragraphs.slice(firstUsefulIndex).join("\n\n").trim();
    }
  }

  return answer;
}

function looksLikeInternalReasoning(answer: string) {
  const trimmed = answer.trim();
  const lower = trimmed.toLowerCase();
  const cyrillicCount = (trimmed.match(/[А-Яа-яЁё]/g) ?? []).length;
  const latinCount = (trimmed.match(/[A-Za-z]/g) ?? []).length;

  const startsAsReasoning =
    lower.startsWith("we need") ||
    lower.startsWith("we should") ||
    lower.startsWith("need to") ||
    lower.startsWith("let's") ||
    lower.startsWith("let me") ||
    lower.startsWith("the user") ||
    lower.startsWith("user asks") ||
    lower.startsWith("must ") ||
    lower.startsWith("so we") ||
    lower.startsWith("i need") ||
    lower.startsWith("analysis") ||
    lower.startsWith("reasoning");

  return startsAsReasoning || (cyrillicCount < 12 && latinCount > 40);
}

function sanitizeOpenRouterAnswer(rawAnswer: string) {
  const answer = stripOpenRouterReasoning(rawAnswer);

  if (!answer || looksLikeInternalReasoning(answer)) return "";

  return answer;
}

async function getOpenRouterAnswer(response: Response) {
  const data = await response.json();

  const directText = data?.output_text;
  if (typeof directText === "string" && directText.trim()) return directText.trim();

  const choice = data?.choices?.[0];
  const text = choice?.text;
  if (typeof text === "string" && text.trim()) return text.trim();

  const content = choice?.message?.content;
  if (typeof content === "string" && content.trim()) return content.trim();

  if (Array.isArray(content)) {
    const parts = content
      .map((part) => {
        if (typeof part === "string") return part;
        if (typeof part?.text === "string") return part.text;
        if (typeof part?.content === "string") return part.content;
        return "";
      })
      .join("\n")
      .trim();

    if (parts) return parts;
  }

  return "";
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
    const relevantApartments = findRelevantApartments(rawMessage, sourceApartments, complex ? 3 : 4);

    if (!apiKey) {
      return Response.json({ answer: demoAnswer(rawMessage, relevantApartments) });
    }

    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "Ты ИИ-консультант сайта застройщика. Подбери квартиру по данным ниже. Отвечай только по-русски, без английского текста, без рассуждений о задаче и без повторных приветствий, 3–5 коротких законченных пунктов. Не описывай все квартиры сразу, выбери 2–3 лучших варианта. Никогда не обрывай предложение на середине: если места мало, сократи ответ, но заверши мысль. Не выдумывай цены и условия."
      },
      {
        role: "system",
        content: `Короткая подборка квартир JSON:\n${JSON.stringify(compactApartmentsForAi(relevantApartments), null, 0)}`
      },
      ...((body.history ?? [])
        .filter((item) => item.role === "user" || item.role === "assistant")
        .slice(-HISTORY_LIMIT)
        .map((item) => ({ role: item.role, content: shortText(item.content, HISTORY_MESSAGE_LENGTH) })) as ChatMessage[]),
      { role: "user", content: message }
    ];

    const retryMessages: ChatMessage[] = [
      {
        role: "system",
        content: "Ты ИИ-консультант по квартирам. Ответь только по-русски 3 короткими законченными пунктами, без приветствия. Не обрывай предложение на середине."
      },
      {
        role: "system",
        content: `Мини-подборка JSON:\n${JSON.stringify(compactApartmentsForAi(relevantApartments.slice(0, 2), true), null, 0)}`
      },
      { role: "user", content: shortText(message, 320) }
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
      return Response.json({ answer: limitAnswer("timeout", relevantApartments, rawMessage) });
    }

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();

      if (isOpenRouterLimitError(openRouterResponse.status, errorText)) {
        try {
          const retryResponse = await askOpenRouter({
            apiKey,
            model,
            siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
            messages: retryMessages,
            maxTokens: RETRY_MAX_TOKENS
          });

          if (retryResponse.ok) {
            const retryAnswer = sanitizeOpenRouterAnswer(await getOpenRouterAnswer(retryResponse));
            return Response.json({
              answer: retryAnswer ? replaceApartmentIdsWithTitles(retryAnswer) : limitAnswer("credits", relevantApartments, rawMessage)
            });
          }
        } catch {
          // Если короткий повтор тоже не прошел, вернем понятный ответ ниже.
        }

        return Response.json({ answer: limitAnswer("credits", relevantApartments, rawMessage) });
      }

      return Response.json(
        { error: `OpenRouter вернул ошибку: ${openRouterResponse.status}. ${errorText.slice(0, 500)}` },
        { status: 502 }
      );
    }

    const answer = sanitizeOpenRouterAnswer(await getOpenRouterAnswer(openRouterResponse));

    return Response.json({ answer: answer ? replaceApartmentIdsWithTitles(answer) : limitAnswer("unknown", relevantApartments, rawMessage) });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Неизвестная ошибка сервера."
      },
      { status: 500 }
    );
  }
}

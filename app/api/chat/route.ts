import type { Apartment, Room } from "@/types/apartment";

export const runtime = "nodejs";

const OPENROUTER_TIMEOUT_MS = 28_000;
const MAX_USER_MESSAGE_LENGTH = 450;
const HISTORY_LIMIT = 2;
const HISTORY_MESSAGE_LENGTH = 300;
const NORMAL_MAX_TOKENS = 190;
const COMPLEX_MAX_TOKENS = 150;
const RETRY_MAX_TOKENS = 120;

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ChatRequest = {
  message?: string;
  apartment?: Apartment;
  room?: Room | null;
  history?: ChatMessage[];
  roomContext?: string;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceTechnicalApartmentId(answer: string, apartment: Apartment) {
  return answer.replace(new RegExp(`\\b${escapeRegExp(apartment.id)}\\b`, "g"), apartment.title);
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
    message.length > 450 ||
    lower.includes("подробно") ||
    lower.includes("детально") ||
    lower.includes("таблиц") ||
    lower.includes("полный анализ") ||
    lower.includes("сравни со всеми") ||
    lower.includes("расскажи все")
  );
}

function trimUserMessage(message: string) {
  if (message.length <= MAX_USER_MESSAGE_LENGTH) return message;

  return `${message.slice(0, MAX_USER_MESSAGE_LENGTH)}\n\n[Сообщение клиента было сокращено системой, потому что бесплатная модель OpenRouter имеет ограничение по объему запроса.]`;
}

function shortText(value: string | undefined, max = 180) {
  if (!value) return "";
  return value.length <= max ? value : `${value.slice(0, max)}...`;
}

function compactApartment(apartment: Apartment, room?: Room | null, ultraCompact = false) {
  const base = {
    name: apartment.title,
    project: apartment.project,
    floor: apartment.floor,
    roomsCount: apartment.roomsCount,
    totalArea: apartment.totalArea,
    price: apartment.price,
    mortgagePayment: apartment.mortgagePayment,
    status: apartment.status,
    finishing: apartment.finishing,
    selectedRoom: room
      ? {
          name: room.name,
          area: room.area,
          description: shortText(room.description, ultraCompact ? 90 : 160),
          furnitureTips: room.furnitureTips.slice(0, ultraCompact ? 1 : 2).map((tip) => shortText(tip, 80)),
          aiHints: room.aiHints.slice(0, ultraCompact ? 1 : 2).map((hint) => shortText(hint, 140))
        }
      : null
  };

  if (ultraCompact) {
    return base;
  }

  return {
    ...base,
    windowView: apartment.windowView,
    ceilingHeight: apartment.ceilingHeight,
    advantages: apartment.advantages.slice(0, 2).map((advantage) => shortText(advantage, 110)),
    rooms: apartment.rooms.map((item) => ({
      name: item.name,
      area: item.area,
      type: item.type
    }))
  };
}

function demoAnswer(message: string, apartment: Apartment, room?: Room | null) {
  const roomText = room ? `По выбранной комнате «${room.name}» (${room.area} м²): ${room.description}` : "Комната пока не выбрана.";

  return [
    "Демо-ответ без OpenRouter API-ключа.",
    roomText,
    `Квартира: ${apartment.title}, ${apartment.totalArea} м², ${apartment.floor} этаж, стоимость ${apartment.price.toLocaleString("ru-RU")} ₽.`,
    `Ваш вопрос: «${message}».`,
    "Чтобы получить настоящий ИИ-ответ, добавьте OPENROUTER_API_KEY в .env.local."
  ].join("\n\n");
}

function limitAnswer(reason: "timeout" | "credits", apartment: Apartment, room?: Room | null, message = "") {
  const lower = message.toLowerCase();
  const roomName = room?.name ?? "квартира";
  const roomArea = room ? `${room.area} м²` : `${apartment.totalArea} м²`;

  if (lower.includes("кроват")) {
    return [
      `**По кровати:** лучше ориентироваться на выбранную зону **${roomName}** (${roomArea}).`,
      "- Поставьте кровать у самой длинной свободной стены, чтобы оставить проходы по бокам.",
      "- Не перекрывайте дверь, окно и место под шкаф.",
      "- Если нужно именно поставить кровать на планировку, напишите: **поставь кровать** и укажите бюджет."
    ].join("\n");
  }

  if (lower.includes("шкаф") || lower.includes("хранен") || lower.includes("гардероб")) {
    return [
      `**По хранению:** для зоны **${roomName}** лучше использовать стену рядом со входом или глухую стену без окна.`,
      "- Шкаф лучше ставить вдоль стены, а не в центре комнаты.",
      "- Глубина 55–60 см обычно удобна для одежды.",
      "- Бюджет понадобится только если нужно подобрать конкретный шкаф из магазина и поставить его на план."
    ].join("\n");
  }

  if (lower.includes("диван")) {
    return [
      `**По дивану:** в зоне **${roomName}** его лучше ставить так, чтобы он не перекрывал проход к окну и двери.`,
      "- Для кухни-гостиной диван можно использовать как мягкое зонирование.",
      "- Оставьте проход к окну и двери, а ТВ-зону лучше держать напротив посадочного места.",
      "- Если нужно именно поставить диван на планировку, напишите: **поставь диван** и укажите бюджет."
    ].join("\n");
  }

  return [
    `**Краткая консультация по объекту:** **${apartment.title}**, ${apartment.totalArea} м², ${apartment.floor} этаж.`,
    room ? `Сейчас выбранная зона: **${room.name}**, ${room.area} м². ${shortText(room.description, 160)}` : "Можно выбрать комнату на планировке и задать вопрос именно по ней.",
    `Стоимость: **${apartment.price.toLocaleString("ru-RU")} ₽**. Статус: **${statusLabel(apartment.status)}**.`,
    "Для более точного ответа задайте короткий вопрос: например, **где поставить кровать**, **куда шкаф**, **подбери диван до 80 тыс.**"
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
    const body = (await request.json()) as ChatRequest;
    const rawMessage = body.message?.trim();
    const apartment = body.apartment;
    const room = body.room ?? null;
    const roomContext = body.roomContext || (room ? `Текущая выбранная комната: ${room.name}, площадь ${room.area} м².` : "Комната не выбрана. Вопрос относится к квартире в целом.");

    if (!rawMessage || !apartment) {
      return Response.json({ error: "Нет сообщения или данных квартиры." }, { status: 400 });
    }

    const message = trimUserMessage(rawMessage);
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "qwen/qwen3-next-80b-a3b-instruct:free";
    const complex = isComplexRequest(rawMessage);

    if (!apiKey) {
      return Response.json({ answer: demoAnswer(rawMessage, apartment, room) });
    }

    const safeRoomContext = shortText(roomContext, 420);

    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "Ты краткий ИИ-консультант сайта застройщика. Отвечай по-русски, деловым тоном, без повторных приветствий. Ответ: до 4 пунктов. Не выдумывай цены, скидки, сроки и юридические условия. Если клиент просит рекомендации по расстановке мебели, отвечай сразу без уточнения бюджета. Бюджет уточняй только когда клиент просит именно подобрать товар или поставить мебель на планировку."
      },
      {
        role: "system",
        content: `Данные квартиры JSON:\n${JSON.stringify(compactApartment(apartment, room), null, 0)}`
      },
      ...((body.history ?? [])
        .filter((item) => item.role === "user" || item.role === "assistant")
        .slice(-HISTORY_LIMIT)
        .map((item) => ({ role: item.role, content: shortText(item.content, HISTORY_MESSAGE_LENGTH) })) as ChatMessage[]),
      {
        role: "system",
        content: `Текущий контекст комнаты: ${safeRoomContext}`
      },
      { role: "user", content: message }
    ];

    const retryMessages: ChatMessage[] = [
      {
        role: "system",
        content:
          "Ты краткий ИИ-консультант по квартире. Ответь по-русски максимум 3 короткими пунктами. Не используй приветствие."
      },
      {
        role: "system",
        content: `Мини-данные JSON:\n${JSON.stringify(compactApartment(apartment, room, true), null, 0)}`
      },
      { role: "user", content: `Контекст: ${safeRoomContext}\nВопрос: ${shortText(message, 320)}` }
    ];

    let openRouterResponse: Response;

    try {
      openRouterResponse = await askOpenRouter({
        apiKey,
        model,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        messages,
        maxTokens: complex ? COMPLEX_MAX_TOKENS : NORMAL_MAX_TOKENS
      });
    } catch (error) {
      return Response.json({ answer: limitAnswer("timeout", apartment, room, rawMessage) });
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
            const retryAnswer = await getOpenRouterAnswer(retryResponse);
            return Response.json({
              answer: retryAnswer
                ? replaceTechnicalApartmentId(retryAnswer, apartment)
                : limitAnswer("credits", apartment, room, rawMessage)
            });
          }
        } catch {
          // Если короткий повтор тоже не прошел, вернем понятный ответ ниже.
        }

        return Response.json({ answer: limitAnswer("credits", apartment, room, rawMessage) });
      }

      return Response.json(
        { error: `OpenRouter вернул ошибку: ${openRouterResponse.status}. ${errorText.slice(0, 500)}` },
        { status: 502 }
      );
    }

    const answer = await getOpenRouterAnswer(openRouterResponse);

    return Response.json({ answer: answer ? replaceTechnicalApartmentId(answer, apartment) : limitAnswer("credits", apartment, room, rawMessage) });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Неизвестная ошибка сервера."
      },
      { status: 500 }
    );
  }
}

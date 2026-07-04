import type { Apartment, Room } from "@/types/apartment";

export const runtime = "nodejs";

const OPENROUTER_TIMEOUT_MS = 28_000;
const MAX_USER_MESSAGE_LENGTH = 900;

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

function compactApartment(apartment: Apartment, room?: Room | null) {
  return {
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
    ceilingHeight: apartment.ceilingHeight,
    finishing: apartment.finishing,
    advantages: apartment.advantages.slice(0, 3),
    selectedRoom: room
      ? {
          name: room.name,
          area: room.area,
          description: room.description,
          furnitureTips: room.furnitureTips.slice(0, 3),
          aiHints: room.aiHints.slice(0, 3),
          chatPrompts: room.chatPrompts?.slice(0, 3) ?? []
        }
      : null,
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

function limitAnswer(reason: "timeout" | "credits", apartment: Apartment, room?: Room | null) {
  const roomText = room ? `по помещению **${room.name}**` : "по квартире в целом";
  const reasonText =
    reason === "timeout"
      ? "модель слишком долго обрабатывала расширенный запрос"
      : "бесплатная модель OpenRouter ограничила объем запроса или ответа";

  return [
    `**Запрос получился слишком объемным:** ${reasonText}.`,
    `Чтобы не потерять консультацию, предлагаю уточнить вопрос ${roomText}. Например: «поместится ли кровать», «где поставить шкаф», «какие преимущества у этой комнаты».`,
    `Текущий объект: **${apartment.title}**, ${apartment.totalArea} м², ${apartment.floor} этаж.`
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

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `
Ты официальный ИИ-консультант сайта застройщика.
Твоя задача — помогать клиенту оценить квартиру, планировку, комнаты, варианты меблировки и ключевые преимущества объекта.
Отвечай по-русски в деловом, вежливом и сдержанном тоне. Обращайся к клиенту на «вы».
Не начинай каждый ответ с приветствия. Приветствие допустимо только в первом сообщении диалога; дальше сразу отвечай по сути и учитывай историю.
Ответ должен быть кратким: 2–3 коротких абзаца или список до 5 пунктов.
Если вопрос сложный, сначала дай краткий вывод и предложи разобрать детали отдельными вопросами.
Форматируй ответ в Markdown: выделяй главное через **жирный текст**, уточнения через *курсив*, списки через "-". Не используй HTML.
Используй поле aiHints у выбранной комнаты как внутренние консультационные подсказки. Не пересказывай их дословно клиенту, а применяй их при формировании ответа.
Называй квартиру только по полю name/title, не используй технические идентификаторы.
Не выдумывай цену, сроки, скидки, юридические условия, ипотечные ставки и условия бронирования.
Если клиент спрашивает, как поставить кровать, диван, шкаф, стол или другую мебель, сначала уточни бюджет мебели. После бюджета подбирай средний по цене вариант и объясняй, куда его поставить. Если клиент просит передвинуть конкретную мебель, меняй рекомендацию только для этого предмета, а остальные предметы не трогай.
Если данных не хватает, корректно напиши: «Эту информацию лучше уточнить у менеджера отдела продаж».
При ответе на текущий вопрос всегда используй актуальный контекст выбранной комнаты, который указан отдельным системным сообщением ниже. Если история диалога противоречит текущему контексту, текущий контекст важнее истории.
        `.trim()
      },
      {
        role: "system",
        content: `Краткие данные квартиры в JSON:\n${JSON.stringify(compactApartment(apartment, room), null, 0)}`
      },
      ...((body.history ?? [])
        .filter((item) => item.role === "user" || item.role === "assistant")
        .slice(-4)
        .map((item) => ({ role: item.role, content: item.content.slice(0, 700) })) as ChatMessage[]),
      {
        role: "system",
        content: `Актуальный контекст для следующего ответа: ${roomContext}. Отвечай именно с учетом этого помещения. Если выбрана новая комната, не используй старую выбранную комнату из истории.`
      },
      { role: "user", content: `Актуальный контекст: ${roomContext}\n\nВопрос клиента: ${message}` }
    ];

    let openRouterResponse: Response;

    try {
      openRouterResponse = await askOpenRouter({
        apiKey,
        model,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        messages,
        maxTokens: complex ? 220 : 320
      });
    } catch (error) {
      return Response.json({ answer: limitAnswer("timeout", apartment, room) });
    }

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      const isLimitError =
        openRouterResponse.status === 402 ||
        errorText.toLowerCase().includes("credits") ||
        errorText.toLowerCase().includes("tokens") ||
        errorText.toLowerCase().includes("limit");

      if (isLimitError) {
        return Response.json({ answer: limitAnswer("credits", apartment, room) });
      }

      return Response.json(
        { error: `OpenRouter вернул ошибку: ${openRouterResponse.status}. ${errorText.slice(0, 500)}` },
        { status: 502 }
      );
    }

    const data = await openRouterResponse.json();
    const answer = data?.choices?.[0]?.message?.content;

    return Response.json({ answer: answer ? replaceTechnicalApartmentId(answer, apartment) : "ИИ не вернул текстовый ответ." });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Неизвестная ошибка сервера."
      },
      { status: 500 }
    );
  }
}

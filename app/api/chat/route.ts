import type { Apartment, Room } from "@/types/apartment";

export const runtime = "nodejs";

const OPENROUTER_TIMEOUT_MS = 28_000;
const MAX_USER_MESSAGE_LENGTH = 700;
const HISTORY_LIMIT = 2;
const HISTORY_MESSAGE_LENGTH = 300;
const NORMAL_MAX_TOKENS = 460;
const COMPLEX_MAX_TOKENS = 340;
const RETRY_MAX_TOKENS = 240;

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
    message.length > 700 ||
    lower.includes("подробно") ||
    lower.includes("детально") ||
    lower.includes("таблиц") ||
    lower.includes("полный анализ") ||
    lower.includes("сравни со всеми") ||
    lower.includes("расскажи все")
  );
}

function isPlacementRequest(message: string) {
  const lower = message.toLowerCase();

  return (
    lower.includes("поставь") ||
    lower.includes("поставить") ||
    lower.includes("поставим") ||
    lower.includes("размести") ||
    lower.includes("разместить") ||
    lower.includes("расположи") ||
    lower.includes("расположить") ||
    lower.includes("помести") ||
    lower.includes("поместить") ||
    lower.includes("установи") ||
    lower.includes("установить")
  );
}

function isProductBudgetRequest(message: string) {
  const lower = message.toLowerCase();

  return (
    lower.includes("подбери") ||
    lower.includes("подобрать") ||
    lower.includes("товар") ||
    lower.includes("магазин") ||
    lower.includes("купить") ||
    lower.includes("до ") ||
    lower.includes("бюджет") ||
    lower.includes("тыс") ||
    lower.includes("руб")
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
  const lower = message.toLowerCase();
  const placement = isPlacementRequest(message);
  const productBudget = isProductBudgetRequest(message);
  const roomName = room?.name ?? "выбранная зона";
  const roomDescription = room?.description ? shortText(room.description, 170) : "Можно выбрать комнату на планировке и задать вопрос по ней.";

  if (lower.includes("вход") || lower.includes("прихож")) {
    return [
      `**Для прихожей** лучше сделать хранение максимально компактным и понятным.`,
      "- Используйте неглубокий шкаф или закрытую секцию для верхней одежды.",
      "- Добавьте обувницу, крючки для ежедневной одежды и зеркало у выхода.",
      "- Оставьте свободный проход от двери, чтобы входная зона не казалась тесной."
    ].join("\n");
  }

  if (placement || productBudget) {
    return [
      `**По зоне «${roomName}»:** ${roomDescription}`,
      "- Для точной расстановки напишите предмет одной фразой: например, **поставь шкаф** или **поставь кровать**.",
      "- Если нужен подбор из магазина, укажите бюджет — тогда можно сравнить варианты по цене."
    ].join("\n");
  }

  return [
    `**По зоне «${roomName}»:** ${roomDescription}`,
    "- Я могу подсказать удобную организацию пространства без привязки к стоимости квартиры.",
    "- Для точной расстановки предмета напишите отдельно: **поставь шкаф**, **поставь кровать** или **поставь диван**."
  ].join("\n");
}

function limitAnswer(reason: "timeout" | "credits", apartment: Apartment, room?: Room | null, message = "") {
  const lower = message.toLowerCase();
  const placement = isPlacementRequest(message);
  const productBudget = isProductBudgetRequest(message);
  const roomName = room?.name ?? "квартира";
  const roomArea = room ? `${room.area} м²` : `${apartment.totalArea} м²`;
  const roomDescription = room?.description ? shortText(room.description, 160) : "ориентируйтесь на свободные стены и проходы.";

  if (lower.includes("вход") || lower.includes("прихож")) {
    return [
      `**Входную зону** лучше сделать простой и не перегруженной.`,
      "- Поставьте закрытый шкаф или узкую гардеробную секцию вдоль стены, чтобы спрятать верхнюю одежду.",
      "- Добавьте обувницу с сиденьем: так будет удобнее обуваться и меньше вещей останется на полу.",
      "- Повесьте зеркало и 2–3 крючка для ежедневной одежды, но не занимайте ими основной проход.",
      "- Для визуального порядка используйте закрытые фасады и один светлый цвет хранения."
    ].join("\n");
  }

  if (lower.includes("кроват")) {
    if (placement) {
      return [
        `**Кровать лучше поставить** в зоне **${roomName}** (${roomArea}) у самой длинной свободной стены.`,
        "- Оставьте проходы по бокам и не перекрывайте дверь или окно.",
        "- Если кровать не помещается комфортно, лучше заменить ее на компактный диван-кровать или кровать с хранением.",
        productBudget ? "- По бюджету можно подобрать модель из магазина и сравнить варианты." : ""
      ].filter(Boolean).join("\n");
    }

    return [
      `**По кровати:** сначала проверьте свободную стену и проходы в зоне **${roomName}**.`,
      "- Не ставьте кровать так, чтобы она перекрывала дверь, окно или шкаф.",
      "- Для маленькой зоны лучше выбирать кровать с ящиками или подъемным механизмом."
    ].join("\n");
  }

  if (lower.includes("шкаф") || lower.includes("хранен") || lower.includes("гардероб")) {
    if (placement) {
      return [
        `**Шкаф лучше поставить** вдоль свободной стены в зоне **${roomName}** (${roomArea}).`,
        "- Для прихожей выбирайте глубину 45–60 см, чтобы не съесть проход.",
        "- Закрытые фасады сделают входную зону аккуратнее.",
        productBudget ? "- Если нужен подбор по цене, укажите бюджет и ширину стены." : ""
      ].filter(Boolean).join("\n");
    }

    return [
      `**По хранению в зоне «${roomName}»:** ${roomDescription}`,
      "- Используйте закрытый шкаф или узкую систему хранения до потолка.",
      "- Самые частые вещи храните на уровне рук, сезонные — выше.",
      "- Открытые крючки оставьте только для повседневной одежды, иначе зона будет выглядеть перегруженной."
    ].join("\n");
  }

  if (lower.includes("диван")) {
    if (placement) {
      return [
        `**Диван лучше поставить** так, чтобы он не перекрывал проход к окну и двери.`,
        "- В кухне-гостиной диван может отделять зону отдыха от кухни.",
        "- Оставьте перед диваном место для прохода и небольшого столика.",
        productBudget ? "- Если нужен подбор по цене, укажите бюджет и желаемую ширину дивана." : ""
      ].filter(Boolean).join("\n");
    }

    return [
      `**По дивану:** сначала определите, будет ли он спальным местом или только зоной отдыха.`,
      "- Для студии лучше выбирать компактный диван с ящиком для хранения.",
      "- Не ставьте его на основной проход между входом, кухней и окном."
    ].join("\n");
  }

  return [
    `**По зоне «${roomName}»:** ${roomDescription}`,
    "- Оставьте основной проход свободным и не перегружайте зону открытым хранением.",
    "- Используйте мебель по одной стене, чтобы пространство выглядело спокойнее.",
    "- Для точной расстановки предмета напишите: **поставь шкаф**, **поставь кровать** или **поставь диван**."
  ].join("\n");
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
    .replace(/^(analysis|reasoning|thinking|мысли|рассуждение|ход рассуждений)\s*[:：][\s\S]*?(?=(ответ|итог|рекомендация)\s*[:：]|$)/gim, "")
    .trim();

  const answerMarker = answer.match(/(?:ответ|итог|рекомендация)\s*[:：]\s*([\s\S]+)/i);
  if (answerMarker?.[1]) {
    answer = answerMarker[1].trim();
  }

  const lines = answer
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      const lower = line.toLowerCase();

      return (
        line &&
        !lower.startsWith("analysis") &&
        !lower.startsWith("reasoning") &&
        !lower.startsWith("thinking") &&
        !lower.startsWith("мысли") &&
        !lower.startsWith("рассуждение") &&
        !lower.startsWith("я думаю шаг за шагом")
      );
    });

  return lines.join("\n").trim();
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
    const placement = isPlacementRequest(rawMessage);
    const productBudget = isProductBudgetRequest(rawMessage);

    const behaviorRule = placement || productBudget
      ? "Пользователь просит поставить, разместить или подобрать предмет. Можно говорить, куда поставить предмет. Цену или бюджет упоминай только если пользователь сам спросил про подбор товара, цену или бюджет."
      : "Пользователь НЕ просит поставить предмет и НЕ просит подбор товара. Не упоминай стоимость квартиры, статус квартиры, ипотеку, бюджет, цену, магазин и фразы вроде «куда поставить». Дай только полезные советы по удобству выбранной зоны.";

    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "Ты ИИ-консультант сайта застройщика. Отвечай по-русски, деловым тоном, без повторных приветствий. Давай готовый ответ: 3–5 коротких пунктов или 2–3 абзаца. Не показывай ход рассуждений, thinking, reasoning или внутренний анализ. Не выдумывай цены, скидки, сроки и юридические условия. На обычные вопросы про удобство зоны отвечай практично, без стоимости квартиры и статуса. Про цену, бюджет и конкретное место установки говори только когда пользователь просит: «поставь ...», «размести ...», «расположи ...» или просит подобрать товар по бюджету."
      },
      {
        role: "system",
        content: behaviorRule
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
          "Ты ИИ-консультант по квартире. Ответь по-русски 3 короткими законченными пунктами. Не используй приветствие. Не показывай рассуждения. Не упоминай цену, бюджет и статус, если пользователь не просит поставить/разместить предмет или подобрать товар."
      },
      {
        role: "system",
        content: behaviorRule
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
            const retryAnswer = sanitizeOpenRouterAnswer(await getOpenRouterAnswer(retryResponse));
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

    const answer = sanitizeOpenRouterAnswer(await getOpenRouterAnswer(openRouterResponse));

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

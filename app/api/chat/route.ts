import type { Apartment, Room } from "@/types/apartment";
import { formatArea, formatPrice } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function shortText(value: string | undefined, max = 180) {
  if (!value) return "";
  return value.length <= max ? value : `${value.slice(0, max)}...`;
}

function normalizeMessage(message: string) {
  return message.toLowerCase().replace(/ё/g, "е");
}

function isPlacementRequest(message: string) {
  const lower = normalizeMessage(message);
  return (
    lower.includes("поставь") ||
    lower.includes("поставить") ||
    lower.includes("размести") ||
    lower.includes("разместить") ||
    lower.includes("расположи") ||
    lower.includes("расположить") ||
    lower.includes("передвинь") ||
    lower.includes("перемести")
  );
}

function isPriceQuestion(message: string) {
  const lower = normalizeMessage(message);
  return (
    lower.includes("цена") ||
    lower.includes("стоимость") ||
    lower.includes("сколько стоит") ||
    lower.includes("ипотек") ||
    lower.includes("платеж") ||
    lower.includes("бюджет")
  );
}

function selectedRoomIntro(room?: Room | null) {
  if (!room) return "По квартире в целом:";
  return `По зоне **${room.name}** (${room.area} м²):`;
}

function answerForHall(message: string, room?: Room | null) {
  const placement = isPlacementRequest(message);

  if (placement) {
    return [
      `${selectedRoomIntro(room)} шкаф или систему хранения лучше ставить вдоль свободной стены, не в зоне открывания двери.`,
      "",
      "- Оставьте прямой проход от входа в квартиру.",
      "- Закрытые фасады сделают входную зону аккуратнее.",
      "- Обувницу лучше ставить ближе к двери, а зеркало — на свободную стену.",
      "",
      "Если нужно поставить предмет на планировку, напишите запрос с бюджетом: **поставь шкаф до 70 000 ₽**."
    ].join("\n");
  }

  return [
    "**Как сделать входную зону удобнее:**",
    "",
    "- Используйте закрытый шкаф или узкую систему хранения для верхней одежды.",
    "- Добавьте обувницу с сиденьем, чтобы обувь не занимала проход.",
    "- Повесьте зеркало и несколько крючков для ежедневной одежды.",
    "- Не перегружайте вход открытыми полками: так зона будет выглядеть чище.",
    "- Оставьте свободный проход от двери к остальной квартире."
  ].join("\n");
}

function answerForFurniture(message: string, room?: Room | null) {
  const lower = normalizeMessage(message);
  const placement = isPlacementRequest(message);

  if (lower.includes("кроват")) {
    return placement
      ? [
          `${selectedRoomIntro(room)} кровать лучше ставить у длинной свободной стены.`,
          "",
          "- Не перекрывайте дверь и подход к шкафу.",
          "- С двух сторон желательно оставить проходы.",
          "- Если комната небольшая, выбирайте кровать с хранением."
        ].join("\n")
      : [
          `${selectedRoomIntro(room)} сначала проверьте свободную стену и проходы.`,
          "",
          "- Кровать не должна блокировать дверь, окно и шкаф.",
          "- Для маленькой комнаты удобна кровать с ящиками или подъемным механизмом."
        ].join("\n");
  }

  if (lower.includes("шкаф") || lower.includes("хранен") || lower.includes("гардероб")) {
    return placement
      ? [
          `${selectedRoomIntro(room)} шкаф лучше ставить вдоль стены, а не в центре комнаты.`,
          "",
          "- В прихожей выбирайте глубину 45–60 см, чтобы не съесть проход.",
          "- Двери шкафа не должны конфликтовать с входной дверью.",
          "- Закрытые фасады визуально разгружают пространство."
        ].join("\n")
      : [
          `${selectedRoomIntro(room)} хранение лучше делать закрытым и вертикальным.`,
          "",
          "- Частые вещи храните на уровне рук.",
          "- Сезонные вещи убирайте выше.",
          "- Открытые крючки оставьте только для ежедневной одежды."
        ].join("\n");
  }

  if (lower.includes("диван")) {
    return [
      `${selectedRoomIntro(room)} диван лучше располагать так, чтобы он не перекрывал проход к окну и двери.`,
      "",
      "- В студии он может отделять зону отдыха от кухни.",
      "- Перед диваном оставьте место для прохода и небольшого столика.",
      "- Если диван будет спальным местом, проверьте место в разложенном виде."
    ].join("\n");
  }

  return [
    `${selectedRoomIntro(room)} мебель лучше ставить по стенам, чтобы центр оставался свободным.`,
    "",
    "- Не перекрывайте дверь, окно и основные маршруты движения.",
    "- Крупные предметы ставьте первыми: шкаф, кровать, диван.",
    "- Мелкие предметы добавляйте только после проверки проходов."
  ].join("\n");
}

function answerApartment(apartment: Apartment, message: string, room?: Room | null) {
  const lower = normalizeMessage(message);

  if (room?.type === "hall" || lower.includes("вход") || lower.includes("прихож")) {
    return answerForHall(message, room);
  }

  if (
    lower.includes("мебел") ||
    lower.includes("кроват") ||
    lower.includes("диван") ||
    lower.includes("шкаф") ||
    lower.includes("стол") ||
    lower.includes("хранен")
  ) {
    return answerForFurniture(message, room);
  }

  if (isPriceQuestion(message)) {
    return [
      `**${apartment.title}** стоит **${formatPrice(apartment.price)}**.`,
      "",
      `Площадь: **${formatArea(apartment.totalArea)}**, этаж: **${apartment.floor}**.`,
      `Ориентировочный платеж: **${formatPrice(apartment.mortgagePayment)} / мес.**`
    ].join("\n");
  }

  if (lower.includes("преимуществ") || lower.includes("плюс")) {
    return [
      `**Преимущества ${apartment.title}:**`,
      "",
      ...apartment.advantages.slice(0, 4).map((advantage) => `- ${advantage}.`),
      "",
      room ? `По выбранной зоне **${room.name}**: ${shortText(room.description, 160)}` : ""
    ].filter(Boolean).join("\n");
  }

  return [
    `${selectedRoomIntro(room)}`,
    "",
    room
      ? shortText(room.description, 180)
      : `Квартира **${apartment.title}**: ${formatArea(apartment.totalArea)}, ${apartment.floor} этаж.`,
    "",
    "- Задавайте вопрос по конкретной зоне, мебели или цене — отвечу коротко и по делу.",
    "- Если нужно разместить мебель на плане, пишите: **поставь шкаф до 70 000 ₽**."
  ].join("\n");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;
    const rawMessage = body.message?.trim();
    const apartment = body.apartment;
    const room = body.room ?? null;

    if (!rawMessage || !apartment) {
      return Response.json({ error: "Нет сообщения или данных квартиры." }, { status: 400 });
    }

    return Response.json({ answer: answerApartment(apartment, rawMessage, room) });
  } catch {
    return Response.json(
      { error: "Не удалось обработать запрос. Попробуйте отправить вопрос еще раз." },
      { status: 500 }
    );
  }
}

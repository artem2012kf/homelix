import type { Apartment, Room } from "@/types/apartment";
import { formatArea, formatPrice } from "@/lib/format";
import { getApartmentById } from "@/lib/apartments";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatRequest = {
  message?: string;
  apartmentId?: string;
  roomId?: string | null;
  apartment?: { id?: string };
  room?: { id?: string } | null;
};

function shortText(value: string | undefined, max = 180) {
  if (!value) return "";
  return value.length <= max ? value : `${value.slice(0, max)}...`;
}

function normalizeMessage(message: string) {
  return message.toLowerCase().replace(/ё/g, "е");
}

function includesAny(message: string, words: string[]) {
  const lower = normalizeMessage(message);
  return words.some((word) => lower.includes(word));
}

function isPlacementRequest(message: string) {
  return includesAny(message, ["поставь", "поставить", "размести", "разместить", "расположи", "расположить", "передвинь", "перемести"]);
}

function isPriceQuestion(message: string) {
  return includesAny(message, ["цена", "стоимость", "сколько стоит", "ипотек", "платеж", "бюджет"]);
}

function selectedRoomIntro(room?: Room | null) {
  if (!room) return "По квартире в целом:";
  return `По зоне **${room.name}** (${room.area} м²):`;
}

function answerForWardrobe(message: string, room?: Room | null) {
  const lower = normalizeMessage(message);
  const intro = selectedRoomIntro(room);

  if (includesAny(lower, ["сезон", "чемодан", "короб", "антресол", "зимн", "летн"])) {
    return [
      `${intro} сезонные вещи лучше убрать в верхний и самый дальний ярус.`,
      "",
      "- Куртки и пальто храните в чехлах на отдельной высокой штанге.",
      "- Обувь складывайте в подписанные коробки или прозрачные контейнеры.",
      "- Чемоданы и редко используемые вещи поднимите под потолок.",
      "- Ежедневные вещи оставьте на уровне рук, чтобы не разбирать всю гардеробную.",
      "",
      "Для защиты от запаха и влаги оставьте вентиляционные зазоры и не заполняйте полки вплотную."
    ].join("\n");
  }

  const asksAboutShelves = includesAny(lower, ["полк", "стеллаж"]);
  const asksAboutRails = includesAny(lower, ["штанг", "вешал", "плечик"]);
  if (asksAboutShelves || asksAboutRails) {
    return [
      `${intro} лучше сочетать полки и штанги, а не выбирать только один вариант.`,
      "",
      "- Примерно 55–60% длины системы отдайте под штанги для одежды.",
      "- 25–30% — под полки для трикотажа, сумок и коробок.",
      "- Остальное — под выдвижные ящики и корзины для мелких вещей.",
      "- Сделайте одну высокую секцию для платьев и пальто, остальные — в два уровня.",
      "",
      `Для площади ${room?.area ?? "этой зоны"} м² удобнее неглубокая система вдоль двух стен с проходом по центру.`
    ].join("\n");
  }

  if (includesAny(lower, ["обув", "ботин", "кроссов", "сапог"])) {
    return [
      `${intro} обувь лучше хранить в нижней части системы, отдельно от одежды.`,
      "",
      "- Ежедневную обувь поставьте на открытые наклонные полки ближе ко входу.",
      "- Сезонную обувь уберите в подписанные коробки выше или дальше.",
      "- Для сапог предусмотрите высокую секцию или специальные держатели.",
      "- Оставьте вентиляцию и легко моющееся основание."
    ].join("\n");
  }

  if (includesAny(lower, ["свет", "освещ", "подсвет"])) {
    return [
      `${intro} одного потолочного светильника обычно недостаточно.`,
      "",
      "- Добавьте нейтральную LED-подсветку внутри секций.",
      "- Используйте датчик открытия двери или движения.",
      "- Не ставьте горячие лампы близко к одежде.",
      "- Зеркало лучше подсветить отдельно, без резких теней."
    ].join("\n");
  }

  if (includesAny(lower, ["зеркал"])) {
    return [
      `${intro} зеркало удобнее разместить на двери или на свободной торцевой стене.`,
      "",
      "- Перед ним оставьте не меньше 80–90 см свободного пространства.",
      "- Не перекрывайте зеркалом доступ к часто используемым полкам.",
      "- Добавьте боковую или верхнюю подсветку нейтрального оттенка."
    ].join("\n");
  }

  if (isPriceQuestion(message)) {
    return [
      `${intro} точная стоимость зависит от длины стен, материала фасадов и наполнения.`,
      "",
      "- Самый доступный вариант — открытые металлические стойки и сетчатые корзины.",
      "- Средний вариант — ЛДСП с комбинированными полками, штангами и ящиками.",
      "- Самый дорогой — система до потолка с фасадами, подсветкой и выдвижными механизмами.",
      "",
      "Укажите бюджет и желаемую длину системы — помощник предложит более конкретную комплектацию."
    ].join("\n");
  }

  if (isPlacementRequest(message)) {
    return [
      `${intro} систему хранения лучше ставить вдоль двух соседних стен, сохранив свободный проход по центру.`,
      "",
      "- Глубокие секции со штангами разместите по длинной стене.",
      "- Неглубокие полки и зеркало — по короткой стене.",
      "- Не перекрывайте дверь и вентиляцию.",
      "- Верхний ярус используйте для сезонных вещей."
    ].join("\n");
  }

  if (includesAny(lower, ["как использовать", "организ", "обустро", "планиров", "гардероб", "хранен", "одежд"])) {
    return [
      `${intro} разделите хранение на три уровня по частоте использования.`,
      "",
      "- Нижний уровень: обувь, корзины и тяжелые вещи.",
      "- Средний уровень: ежедневная одежда, штанги и выдвижные ящики.",
      "- Верхний уровень: сезонные вещи, чемоданы и запасные комплекты.",
      "- Одну узкую секцию оставьте для длинной одежды, гладильной доски или пылесоса.",
      "- Центр помещения не занимайте мебелью — сохраните удобный проход."
    ].join("\n");
  }

  return [
    `${intro} сначала определите, какие вещи здесь будут храниться и как часто вы ими пользуетесь.`,
    "",
    "- Ежедневные вещи размещайте на уровне рук.",
    "- Сезонные и редко используемые — выше.",
    "- Комбинируйте штанги, полки, ящики и корзины.",
    "- Сохраните свободный проход и вентиляцию между вещами."
  ].join("\n");
}

function answerForHall(message: string, room?: Room | null) {
  if (isPlacementRequest(message)) {
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
    "- Не перегружайте вход открытыми полками.",
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
          "- В прихожей выбирайте глубину 45–60 см, чтобы не уменьшить проход.",
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
      "- Для раскладного дивана проверьте место в разложенном виде."
    ].join("\n");
  }

  if (includesAny(lower, ["стол", "рабоч", "письмен", "компьютер"])) {
    return [
      `${selectedRoomIntro(room)} рабочий стол лучше поставить ближе к окну, но не перекрывать радиатор и проход.`,
      "",
      "- Свет для правши должен падать слева, для левши — справа.",
      "- Оставьте место для кресла и его свободного отодвигания.",
      "- Розетки и кабели лучше предусмотреть до установки стола."
    ].join("\n");
  }

  return [
    `${selectedRoomIntro(room)} мебель лучше ставить по стенам, чтобы центр оставался свободным.`,
    "",
    "- Не перекрывайте дверь, окно и основные маршруты движения.",
    "- Крупные предметы ставьте первыми: шкаф, кровать, диван.",
    "- Мелкие предметы добавляйте после проверки проходов."
  ].join("\n");
}

function answerApartment(apartment: Apartment, message: string, room?: Room | null) {
  const lower = normalizeMessage(message);
  const wardrobeQuestion =
    room?.type === "wardrobe" ||
    includesAny(lower, ["гардероб", "сезон", "полк", "штанг", "вешал", "плечик", "одежд", "обув", "чемодан", "антресол"]);

  if (wardrobeQuestion) {
    return answerForWardrobe(message, room);
  }

  if (room?.type === "hall" || lower.includes("вход") || lower.includes("прихож")) {
    return answerForHall(message, room);
  }

  if (["мебел", "кроват", "диван", "шкаф", "стол", "хранен", "рабоч"].some((word) => lower.includes(word))) {
    return answerForFurniture(message, room);
  }

  if (isPriceQuestion(message)) {
    return [
      `**${apartment.title}** стоит **${formatPrice(apartment.price)}**.`,
      "",
      `Площадь: **${formatArea(apartment.totalArea)}**, этаж: **${apartment.floor}**.`,
      `Ориентировочный платеж: **${formatPrice(apartment.mortgagePayment)} / мес.**`,
      "",
      "Фактическую цену, наличие и условия сделки необходимо подтвердить у менеджера."
    ].join("\n");
  }

  if (lower.includes("преимуществ") || lower.includes("плюс")) {
    return [
      `**Преимущества ${apartment.title}:**`,
      "",
      ...apartment.advantages.slice(0, 4).map((advantage) => `- ${advantage}.`),
      "",
      room ? `По выбранной зоне **${room.name}**: ${shortText(room.description, 160)}` : ""
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    selectedRoomIntro(room),
    "",
    room ? shortText(room.description, 180) : `Квартира **${apartment.title}**: ${formatArea(apartment.totalArea)}, ${apartment.floor} этаж.`,
    "",
    "Уточните, что именно нужно: хранение, освещение, мебель, бюджет или размещение на плане."
  ].join("\n");
}

export async function POST(request: Request) {
  const limit = checkRateLimit(request, "apartment-chat", { limit: 30, windowMs: 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit);

  try {
    const body = (await request.json()) as ChatRequest;
    const message = body.message?.trim();
    const apartmentId = String(body.apartmentId ?? body.apartment?.id ?? "");
    const roomId = body.roomId ?? body.room?.id ?? null;
    const apartment = getApartmentById(apartmentId);

    if (!message || message.length > 1200) {
      return Response.json({ error: "Введите сообщение длиной до 1200 символов." }, { status: 400 });
    }

    if (!apartment) {
      return Response.json({ error: "Квартира не найдена в каталоге." }, { status: 404 });
    }

    const room = roomId ? apartment.rooms.find((item) => item.id === roomId) ?? null : null;
    if (roomId && !room) {
      return Response.json({ error: "Комната не найдена в планировке квартиры." }, { status: 400 });
    }

    return Response.json(
      { answer: answerApartment(apartment, message, room) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return Response.json({ error: "Не удалось обработать запрос. Попробуйте отправить вопрос еще раз." }, { status: 500 });
  }
}

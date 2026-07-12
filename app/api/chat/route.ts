import type { Apartment, Room } from "@/types/apartment";
import { apartments, getApartmentById } from "@/lib/apartments";
import { formatArea, formatPrice } from "@/lib/format";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ChatRequest = {
  message?: string;
  apartmentId?: string;
  roomId?: string | null;
  apartment?: { id?: string };
  room?: { id?: string } | null;
  history?: ChatMessage[];
};

type Intent =
  | "compare"
  | "drawbacks"
  | "advantages"
  | "storage"
  | "lighting"
  | "work"
  | "sleep"
  | "family"
  | "guests"
  | "bathroom"
  | "balcony"
  | "layout"
  | "furniture"
  | "price"
  | "characteristics"
  | "general";

function normalize(value: string) {
  return value.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();
}

function hasAny(value: string, words: string[]) {
  const lower = normalize(value);
  return words.some((word) => lower.includes(word));
}

function hashText(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function pick(variants: string[], seed: string, history: ChatMessage[] = []) {
  if (!variants.length) return "";
  const recent = history
    .filter((item) => item.role === "assistant")
    .slice(-4)
    .map((item) => item.content)
    .join("\n");
  const start = hashText(seed) % variants.length;

  for (let offset = 0; offset < variants.length; offset += 1) {
    const candidate = variants[(start + offset) % variants.length];
    const signature = candidate.replace(/\s+/g, " ").slice(0, 70);
    if (!recent.includes(signature)) return candidate;
  }

  return variants[start];
}

function shortText(value: string | undefined, max = 170) {
  if (!value) return "";
  return value.length <= max ? value : `${value.slice(0, max)}...`;
}

function roomIntro(room?: Room | null) {
  return room ? `По зоне **${room.name}** (${room.area} м²)` : "По квартире в целом";
}

function isPlacementRequest(message: string) {
  return hasAny(message, [
    "поставь",
    "поставить",
    "размести",
    "разместить",
    "расположи",
    "расставь",
    "передвинь",
    "перемести",
    "добавь мебель"
  ]);
}

function detectIntent(message: string, room?: Room | null): Intent {
  const lower = normalize(message);

  if (hasAny(lower, ["сравн", "другими квартир", "альтернатив", "какая лучше", "чем отличается"])) return "compare";
  if (hasAny(lower, ["минус", "недостат", "слабое место", "что плохо", "проблем"])) return "drawbacks";
  if (hasAny(lower, ["преимуществ", "плюс", "сильные стороны", "что хорош"])) return "advantages";
  if (isPlacementRequest(lower)) return "furniture";
  if (hasAny(lower, ["хранен", "гардероб", "полк", "стеллаж", "штанг", "одежд", "обув", "чемодан", "антресол"])) return "storage";
  if (hasAny(lower, ["свет", "освещ", "подсвет", "люстр", "ламп"])) return "lighting";
  if (hasAny(lower, ["кабинет", "рабоч", "учеб", "урок", "компьютер", "письменный"])) return "work";
  if (hasAny(lower, ["спаль", "сон", "кровать", "спать", "изголов"])) return "sleep";
  if (hasAny(lower, ["семь", "ребен", "детск", "малыш", "коляск"])) return "family";
  if (hasAny(lower, ["гост", "принимать", "ночев", "раскладн"])) return "guests";
  if (room?.type === "bathroom" || hasAny(lower, ["ванн", "душ", "сануз", "стирал", "раковин", "сушильн"])) return "bathroom";
  if (room?.type === "balcony" || hasAny(lower, ["лоджи", "балкон", "зона отдыха", "растен"])) return "balcony";
  if (hasAny(lower, ["планиров", "зонир", "как использовать", "обустро", "расстанов", "проход", "эргоном"])) return "layout";
  if (hasAny(lower, ["мебел", "кроват", "диван", "шкаф", "стол", "гарнитур", "тумб"])) return "furniture";
  if (hasAny(lower, ["цена", "стоим", "сколько стоит", "ипотек", "платеж", "платёж", "бюджет"])) return "price";
  if (hasAny(lower, ["характерист", "площад", "этаж", "потол", "отделк", "вид из окна"])) return "characteristics";
  return "general";
}

function layoutTips(room?: Room | null) {
  if (!room) {
    return [
      "Разделите квартиру на приватную, общую и хозяйственную зоны.",
      "Проверьте прямые маршруты от входа к кухне, санузлу и спальням.",
      "Сначала ставьте крупную мебель, затем добавляйте хранение и декор."
    ];
  }

  const byType: Partial<Record<Room["type"], string[]>> = {
    kitchen: [
      "Разведите готовку, обед и отдых, чтобы маршруты не пересекались.",
      "Стол или диван можно использовать как мягкую границу между зонами.",
      "Не перекрывайте рабочий треугольник кухни и проход к окну."
    ],
    living: [
      "Соберите одну главную зону отдыха и не дробите комнату мелкой мебелью.",
      "Диван ориентируйте на главный сценарий: общение, экран или вид из окна.",
      "Оставьте прямой проход между дверями и окнами."
    ],
    bedroom: [
      "Задайте главную ось кроватью, затем добавьте хранение.",
      "Оставьте подход к кровати и свободное открывание шкафа.",
      "Рабочее место отделите светом или компактным стеллажом."
    ],
    children: [
      "Разведите сон, учёбу, игру и хранение по разным стенам.",
      "Стол поставьте ближе к естественному свету.",
      "Центр оставьте свободным, чтобы комната могла меняться с возрастом."
    ],
    bathroom: [
      "Соберите сантехнику и технику ближе к существующей мокрой зоне.",
      "Перед ванной, душем и раковиной оставьте свободную площадку.",
      "Хранение набирайте вертикально: тумба, зеркало-шкаф и пенал."
    ],
    hall: [
      "Оставьте прямой маршрут от входной двери в квартиру.",
      "Глубокое хранение поставьте вдоль свободной стены.",
      "Обувницу разместите ближе ко входу, зеркало — вне зоны открывания двери."
    ],
    wardrobe: [
      "Глубокие секции со штангами поставьте по длинной стене.",
      "Неглубокие полки и ящики разместите напротив.",
      "Центр оставьте свободным, верхний ярус отдайте сезонным вещам."
    ],
    balcony: [
      "Выберите одну функцию: отдых, работа, растения или хранение.",
      "Высокое хранение ставьте на глухом торце.",
      "Используйте складную или узкую мебель, чтобы сохранить проход."
    ]
  };

  return byType[room.type] ?? [
    "Крупные предметы ставьте вдоль стен, а центр оставляйте свободным.",
    "Не перекрывайте двери, окна и основные маршруты.",
    "Проверяйте габариты мебели до покупки."
  ];
}

function furnitureSubject(message: string) {
  if (hasAny(message, ["кроват", "изголов"])) return "кровать";
  if (hasAny(message, ["диван", "софа", "кресл"])) return "диван";
  if (hasAny(message, ["стол", "парта", "рабоч"])) return "стол";
  if (hasAny(message, ["шкаф", "гардероб", "хранен", "стеллаж", "комод"])) return "шкаф";
  if (hasAny(message, ["кухон", "гарнитур", "остров"])) return "кухня";
  if (hasAny(message, ["тумб", "сануз", "ванн", "раковин"])) return "мебель для санузла";
  return "мебель";
}

function furnitureTips(subject: string, room?: Room | null) {
  const tips: Record<string, string[]> = {
    кровать: [
      "Поставьте изголовьем к глухой стене и не направляйте проход через зону сна.",
      "Проверьте открывание двери и шкафа, оставьте удобный подход.",
      "В компактной комнате используйте основание с хранением."
    ],
    диван: [
      "Не перекрывайте диваном маршрут к окну и двери.",
      "В кухне-гостиной диван может отделять отдых от обеденной зоны.",
      "Для раскладной модели проверьте полный размер в разложенном виде."
    ],
    стол: [
      "Поставьте стол ближе к боковому естественному свету.",
      "Оставьте за креслом место для отодвигания и прохода.",
      "Розетки и локальный свет предусмотрите до финальной расстановки."
    ],
    шкаф: [
      "Ставьте шкаф вдоль глухой стены, а не в центре комнаты.",
      "Не заводите фасады в траекторию двери.",
      "В узком помещении выбирайте меньшую глубину или раздвижные фасады."
    ],
    кухня: [
      "Соберите высокие модули в одном блоке.",
      "Оставьте рабочую поверхность непрерывной.",
      "Проверьте, чтобы открытые дверцы не блокировали проход."
    ],
    "мебель для санузла": [
      "Тумбу ставьте рядом с коммуникациями.",
      "Не зажимайте стиральную машину без сервисного доступа.",
      "Добавьте зеркало-шкаф или узкий пенал."
    ],
    мебель: layoutTips(room)
  };

  return tips[subject] ?? tips.мебель;
}

function needProfile(message: string) {
  if (hasAny(message, ["семь", "ребен", "дет"])) return "family";
  if (hasAny(message, ["аренд", "инвест", "доход", "вложен"])) return "investment";
  if (hasAny(message, ["дешев", "бюджет", "эконом"])) return "budget";
  if (hasAny(message, ["простор", "больш", "площад"])) return "space";
  if (hasAny(message, ["вид", "высок", "панорам"])) return "view";
  return "balanced";
}

function scoreAlternative(candidate: Apartment, current: Apartment, profile: ReturnType<typeof needProfile>) {
  let score = candidate.status === "available" ? 260 : candidate.status === "reserved" ? 40 : -400;
  if (candidate.city === current.city) score += 220;
  if (candidate.project === current.project) score += 80;

  if (profile === "family") score += candidate.roomsCount * 80 + candidate.totalArea * 2;
  if (profile === "investment") score += (candidate.roomsCount <= 2 ? 180 : 0) - candidate.price / 100_000;
  if (profile === "budget") score -= candidate.price / 60_000;
  if (profile === "space") score += candidate.totalArea * 4;
  if (profile === "view") score += candidate.floor * 12;
  if (profile === "balanced") score += candidate.totalArea * 1.5 - candidate.price / 250_000;

  return score;
}

function diff(value: number, format: (absolute: number) => string) {
  if (Math.abs(value) < 0.001) return "без разницы";
  return value > 0 ? `на ${format(value)} больше` : `на ${format(Math.abs(value))} меньше`;
}

function compareAnswer(apartment: Apartment, message: string, history: ChatMessage[]) {
  const profile = needProfile(message);
  const alternatives = apartments
    .filter((item) => item.id !== apartment.id && item.status !== "sold" && item.city === apartment.city)
    .sort((a, b) => scoreAlternative(b, apartment, profile) - scoreAlternative(a, apartment, profile))
    .slice(0, 3);

  if (!alternatives.length) {
    return `В городе **${apartment.city}** сейчас нет других активных вариантов для сравнения с **${apartment.title}**.`;
  }

  const profileText = {
    family: "для семьи",
    investment: "для аренды или инвестиций",
    budget: "по минимальной цене входа",
    space: "по площади",
    view: "по этажу и виду",
    balanced: "по балансу цены и параметров"
  }[profile];

  const lead = pick(
    [
      `Сравниваю **${apartment.title}** с активными вариантами ${profileText}.`,
      `Беру ближайшие альтернативы ${profileText}, а не случайные квартиры.`,
      `Вот как **${apartment.title}** выглядит на фоне других предложений ${profileText}:`
    ],
    `${message}-${apartment.id}-compare`,
    history
  );

  const lines = alternatives.map((candidate) => {
    const area = diff(candidate.totalArea - apartment.totalArea, formatArea);
    const price = diff(candidate.price - apartment.price, formatPrice);
    const status = candidate.status === "available" ? "свободна" : "бронь";
    return `- **${candidate.project}: ${candidate.title}** — площадь ${area}, цена ${price}, ${candidate.floor} этаж, ${status}.`;
  });

  return [
    lead,
    "",
    `Текущий вариант: **${formatArea(apartment.totalArea)}**, **${formatPrice(apartment.price)}**, ${apartment.floor} этаж.`,
    "",
    ...lines,
    "",
    `Первой альтернативой под ваш запрос я бы проверил **${alternatives[0].title}**.`,
    "Откройте её, чтобы маскот сравнил комнаты и предложил расстановку мебели уже на её плане."
  ].join("\n");
}

function answer(apartment: Apartment, room: Room | null, message: string, history: ChatMessage[]) {
  const intent = detectIntent(message, room);
  const intro = roomIntro(room);
  const seed = `${message}-${apartment.id}-${room?.id ?? "apartment"}-${intent}`;

  if (intent === "compare") return compareAnswer(apartment, message, history);

  if (intent === "price") {
    return [
      pick(
        [
          `Текущая цена **${apartment.title}** — **${formatPrice(apartment.price)}**.`,
          `Квартира выставлена за **${formatPrice(apartment.price)}**.`,
          `Базовая цена в каталоге — **${formatPrice(apartment.price)}**.`
        ],
        seed,
        history
      ),
      "",
      `- площадь: **${formatArea(apartment.totalArea)}**;`,
      `- этаж: **${apartment.floor}**;`,
      `- ориентировочный платёж: **${formatPrice(apartment.mortgagePayment)}/мес.**;`,
      `- отделка: ${apartment.finishing}.`,
      "",
      "Фактическую цену, скидки и условия ипотеки подтверждает менеджер."
    ].join("\n");
  }

  if (intent === "characteristics") {
    return [
      pick(
        [
          `Ключевые параметры **${apartment.title}** без рекламных формулировок:`,
          `По фактам квартира выглядит так:`,
          `Собрал основные характеристики в одном месте:`
        ],
        seed,
        history
      ),
      "",
      `- ${apartment.roomsCount} комнат(ы), ${formatArea(apartment.totalArea)}, ${apartment.floor} этаж;`,
      `- потолки ${apartment.ceilingHeight} м, отделка: ${apartment.finishing};`,
      `- вид из окон: ${apartment.windowView};`,
      `- цена: **${formatPrice(apartment.price)}**.`,
      room ? `- выбранная зона: **${room.name}**, ${room.area} м² — ${shortText(room.description)}` : ""
    ].filter(Boolean).join("\n");
  }

  if (intent === "advantages") {
    return [
      pick(
        [
          `Сильные стороны **${apartment.title}**:`,
          "Что здесь действительно полезно для покупателя:",
          "Плюсы квартиры, влияющие на ежедневный сценарий:"
        ],
        seed,
        history
      ),
      "",
      ...apartment.advantages.slice(0, 5).map((item) => `- ${item}.`),
      room ? `- По зоне **${room.name}**: ${shortText(room.description, 145)}` : "",
      "",
      "Для семьи важнее комнаты и хранение, для аренды — цена входа и универсальность планировки."
    ].filter(Boolean).join("\n");
  }

  if (intent === "drawbacks") {
    const concerns = [
      apartment.roomsCount <= 1 ? "Мало изолированных зон: сон, работу и гостей придётся зонировать." : "",
      apartment.totalArea < 50 ? "Компактная площадь требует мебели точного размера и встроенного хранения." : "",
      apartment.floor <= 2 ? "Невысокий этаж стоит проверить по приватности, шуму и виду." : "",
      apartment.floor >= 20 ? "Высокий этаж стоит проверить по ожиданию лифтов и ветровой нагрузке." : "",
      room && room.area < 6 ? `Зона **${room.name}** компактная — крупная мебель быстро сузит проход.` : "",
      "Финальную эргономику нужно проверить по точным размерам стен и дверей."
    ].filter(Boolean);

    return [
      pick(
        [
          `Возможные слабые места **${apartment.title}**:`,
          "Не только плюсы — вот вероятные компромиссы:",
          "Что стоит проверить при просмотре квартиры:"
        ],
        seed,
        history
      ),
      "",
      ...concerns.map((item) => `- ${item}`),
      "",
      "Это не делает квартиру плохой: важно сопоставить компромиссы с вашим сценарием."
    ].join("\n");
  }

  if (intent === "furniture") {
    const subject = furnitureSubject(message);
    return [
      pick(
        [
          `${intro}: для предмета **${subject}** сначала проверяю стены, двери и проходы.`,
          `${intro}: позицию для **${subject}** лучше выбирать по маршрутам движения.`,
          `${intro}: расстановку **${subject}** строим от габаритов и сценария использования.`
        ],
        seed,
        history
      ),
      "",
      ...furnitureTips(subject, room).map((item) => `- ${item}`),
      "",
      isPlacementRequest(message)
        ? "Маскот подберёт товар по бюджету и поставит его на планировку; затем предмет можно перетащить или повернуть."
        : "Для автоматической установки напишите: **поставь шкаф до 70 000 ₽** или **добавь диван среднего бюджета**."
    ].join("\n");
  }

  const intentContent: Partial<Record<Intent, { leads: string[]; tips: string[]; ending?: string }>> = {
    storage: {
      leads: [
        `${intro}: хранение лучше проектировать по частоте использования вещей.`,
        `${intro}: вместо одного большого шкафа полезнее собрать понятные уровни хранения.`,
        `${intro}: задача хранения — убрать визуальный шум и не сузить проходы.`
      ],
      tips: room?.type === "wardrobe"
        ? ["55–60% длины отдайте под штанги, 25–30% — под полки.", "Сделайте высокую секцию для длинной одежды.", "Чемоданы и сезонные вещи поднимите наверх."]
        : ["Ежедневные вещи держите на уровне рук.", "Сезонные вещи уберите выше.", "Закрытое вертикальное хранение экономит полезную площадь."],
      ending: "Оставьте небольшой резерв и вентиляцию — система не должна быть заполнена вплотную."
    },
    lighting: {
      leads: [
        `${intro}: одного потолочного света будет мало.`,
        `${intro}: свет должен поддерживать сценарии комнаты.`,
        `${intro}: хорошая схема сочетает общий, рабочий и вечерний свет.`
      ],
      tips: ["Общий свет используйте для уборки и повседневных задач.", "Рабочий свет добавьте у стола, кухни или зеркала.", "Акцентный свет включайте отдельно для вечернего сценария."],
      ending: room?.type === "bathroom" ? "У зеркала нужен отдельный свет без резких теней и светильники для влажных зон." : "Не включайте все источники одной кнопкой."
    },
    work: {
      leads: [
        `${intro}: мини-кабинет можно сделать без блокировки прохода.`,
        `${intro}: рабочее место лучше привязать к боковому свету и розеткам.`,
        `${intro}: для кабинета важнее место за креслом, чем большая площадь.`
      ],
      tips: ["Стол поставьте рядом с окном без прямых бликов на экране.", "Оставьте 80–90 см за креслом.", "Добавьте закрытое хранение и отдельный рабочий свет."],
      ending: room?.type === "balcony" ? "На лоджии проверьте утепление, перегрев летом и безопасное электричество." : "Зону можно отделить стеллажом, ковром или отдельным светом."
    },
    sleep: {
      leads: [
        `${intro}: зону сна лучше увести от двери и активного прохода.`,
        `${intro}: кровать должна задавать спокойную ось комнаты.`,
        `${intro}: комфорт сна начинается с позиции кровати.`
      ],
      tips: ["Изголовье поставьте к глухой стене.", "Сохраните удобный подход к кровати.", "Не направляйте яркий рабочий свет на подушки.", "Проверьте открывание шкафа и двери."]
    },
    family: {
      leads: [
        `${intro}: для семьи я оцениваю безопасность, хранение и гибкость.`,
        `${intro}: семейная планировка должна выдерживать разные режимы дня.`,
        `${intro}: важна не только площадь, но и отсутствие конфликтующих маршрутов.`
      ],
      tips: ["Закрепите высокую мебель.", "Оставьте закрытое хранение и запас для сезонных вещей.", "Рабочую или детскую зону ставьте ближе к свету.", "Используйте трансформируемую мебель."],
      ending: room?.type === "children" ? "В детской центр лучше оставить свободным." : "В общей зоне предусмотрите параллельные сценарии для взрослых и детей."
    },
    guests: {
      leads: [
        `${intro}: гостевая функция не должна мешать повседневной жизни.`,
        `${intro}: для гостей лучше использовать трансформируемую мебель.`,
        `${intro}: проверяйте мебель не только сложенной, но и разложенной.`
      ],
      tips: ["Используйте раскладной диван или кресло-кровать.", "Оставьте место перед мебелью в разложенном виде.", "Добавьте розетку, локальный свет и хранение для белья."]
    },
    bathroom: {
      leads: [
        `${intro}: технику лучше держать ближе к мокрой зоне.`,
        `${intro}: сначала проверяют коммуникации и сервисный доступ.`,
        `${intro}: компактный санузел выигрывает от вертикального хранения.`
      ],
      tips: ["Стиральную машину ставьте рядом с водой и сливом.", "Оставьте доступ к фильтру и соединениям.", "Перед ванной, душем и раковиной сохраните свободную площадку.", "Добавьте зеркало-шкаф или пенал."],
      ending: "Ванна удобнее семье с маленькими детьми, душ освобождает место для хранения."
    },
    balcony: {
      leads: [
        `${intro}: лоджию лучше не перегружать несколькими функциями.`,
        `${intro}: выберите один сценарий — отдых, работа, растения или хранение.`,
        `${intro}: полезная лоджия начинается со свободного прохода.`
      ],
      tips: ["Для отдыха достаточно узкой скамьи и столика.", "Высокое хранение ставьте на глухом торце.", "Выбирайте складную или неглубокую мебель."],
      ending: "Тяжёлые системы и отопление требуют проверки конструкций и правил дома."
    },
    layout: {
      leads: [
        `${intro}: строим планировку от маршрутов, а не от количества мебели.`,
        `${intro}: сначала фиксируем главную функцию, затем крупные предметы.`,
        `${intro}: лучший вариант не конфликтует с дверями, окнами и ежедневными действиями.`
      ],
      tips: layoutTips(room),
      ending: "После выбора предмета и бюджета маскот может поставить мебель на план."
    }
  };

  const content = intentContent[intent];
  if (content) {
    return [
      pick(content.leads, seed, history),
      "",
      ...content.tips.map((item, index) => `${index + 1}. ${item}`),
      content.ending ? "" : "",
      content.ending ?? ""
    ].filter(Boolean).join("\n");
  }

  const examples = room?.type === "bathroom"
    ? ["где поставить стиральную машину", "ванна или душ", "как добавить хранение"]
    : room?.type === "balcony"
      ? ["сделать мини-кабинет", "оформить зону отдыха", "добавить хранение"]
      : ["лучшая расстановка мебели", "освещение", "хранение", "сценарий для семьи"];

  return [
    pick(
      [
        `${intro}: в вопросе пока не вижу главной задачи.`,
        `${intro}: уточните сценарий, и ответ будет привязан к планировке.`,
        `${intro}: выберите, что именно нужно улучшить, чтобы не получать общий совет.`
      ],
      seed,
      history
    ),
    "",
    room ? shortText(room.description) : `Квартира **${apartment.title}**: ${formatArea(apartment.totalArea)}, ${apartment.floor} этаж.`,
    "",
    `Можно спросить: ${examples.map((item) => `**${item}**`).join(", ")}.`,
    "Для сравнения квартир укажите цель: семья, аренда, минимальный бюджет, площадь или высокий этаж."
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

    const history = Array.isArray(body.history)
      ? body.history
          .filter((item) => item && ["user", "assistant", "system"].includes(item.role) && typeof item.content === "string")
          .slice(-10)
      : [];

    return Response.json(
      { answer: answer(apartment, room, message, history) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return Response.json({ error: "Не удалось обработать запрос. Попробуйте отправить вопрос еще раз." }, { status: 500 });
  }
}

"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { Apartment, Room } from "@/types/apartment";
import type { FurnitureCategory, FurnitureItem } from "@/types/furniture";
import type { FurniturePlacement } from "@/types/furniture-placement";
import { AiMascot } from "@/components/AiMascot";
import { MarkdownText } from "@/components/MarkdownText";
import { postJson } from "@/lib/client-api";
import { furnitureItems } from "@/lib/furniture";
import { formatPrice } from "@/lib/format";
import {
  apartmentChatHistoryKey,
  clearChatHistory,
  loadChatHistory,
  saveChatHistory,
  type StoredChatMessage
} from "@/lib/chat-history";

type Message = StoredChatMessage;

type FurniturePlacementRequest = {
  categories: FurnitureCategory[];
  label: string;
  roomId: string;
  roomName: string;
  addMore?: boolean;
  replaceExisting?: boolean;
};

type BudgetRequest = {
  min: number;
  max: number;
  target: number;
  label: string;
};

type PlacementOptions = {
  replacePlacementId?: string;
  replaceSameCategoryInRoom?: boolean;
};

type AiChatProps = {
  apartment: Apartment;
  selectedRoom?: Room;
  furniturePlacements?: FurniturePlacement[];
  onFurniturePlacement?: (placement: FurniturePlacement, options?: PlacementOptions) => void;
  onFurnitureMove?: (placementId: string) => void;
  onFurnitureRemove?: (placementId: string) => void;
  onFurnitureClear?: () => void;
};

const apartmentStarterPrompts = [
  "Подойдет ли квартира для семьи?",
  "Какие ключевые преимущества у квартиры?",
  "Как рационально расставить несколько предметов мебели?",
  "Сравните эту квартиру с другими вариантами"
];

function getInitialMessages(apartment: Apartment): Message[] {
  return [
    {
      role: "assistant",
      content: `Здравствуйте. Я ИИ-консультант по квартире **${apartment.title}**. История диалога сохраняется, поэтому можно продолжать разговор с прошлого места.`
    }
  ];
}

function getRoomContextText(room?: Room) {
  if (!room) return "Комната не выбрана. Ответ должен относиться к квартире в целом.";

  return [
    `Текущая выбранная комната: ${room.name}, площадь ${room.area} м².`,
    `Описание: ${room.description}.`,
    `Советы по мебели: ${room.furnitureTips.join("; ")}.`,
    `Внутренние подсказки для ИИ: ${room.aiHints.join(" ")}`
  ].join(" ");
}

function getRoomStarterPrompts(room?: Room) {
  if (!room) return apartmentStarterPrompts;

  const roomName = room.name.toLowerCase();

  if (room.chatPrompts?.length) return room.chatPrompts;

  const common = [`Как лучше использовать ${roomName} ${room.area} м²?`];

  switch (room.type) {
    case "kitchen":
    case "living":
      return [
        ...common,
        "Подбери диван и стол по бюджету",
        "Как разделить зону кухни и отдыха?",
        "Передвинь диван, если он стоит неудобно"
      ];
    case "bedroom":
      return [
        ...common,
        "Подбери кровать и шкаф по бюджету",
        "Поставь еще рабочий стол",
        "Передвинь кровать, если расположение не понравилось"
      ];
    case "children":
      return [
        ...common,
        "Подбери мебель для детской по бюджету",
        "Поставь кровать, шкаф и стол",
        "Передвинь стол к другой стене"
      ];
    case "bathroom":
      return [
        ...common,
        "Подбери тумбу под раковину по бюджету",
        "Где разместить стиральную машину?",
        "Как добавить больше хранения?"
      ];
    case "hall":
      return [
        ...common,
        "Какой шкаф поставить и в какой бюджет?",
        "Передвинь шкаф в другое место",
        "Как сделать входную зону удобной?"
      ];
    case "balcony":
      return [
        ...common,
        "Поставь столик на лоджию",
        "Можно ли сделать мини-кабинет?",
        "Как организовать лаунж-зону?"
      ];
    case "wardrobe":
      return [
        ...common,
        "Поставь гардеробную систему",
        "Подойдет ли гардеробная для сезонных вещей?",
        "Передвинь систему хранения"
      ];
    default:
      return [
        ...common,
        "Какая мебель сюда подойдет?",
        "Как не перегрузить пространство?",
        "Какие преимущества у этого помещения?"
      ];
  }
}

function hasAny(value: string, words: string[]) {
  return words.some((word) => value.includes(word));
}

function uniqueCategories(categories: FurnitureCategory[]) {
  return [...new Set(categories)];
}

function categoryLabel(category: FurnitureCategory) {
  switch (category) {
    case "bed":
      return "кровать";
    case "sofa":
      return "диван";
    case "table":
      return "стол";
    case "storage":
      return "систему хранения";
    case "kitchen":
      return "кухонную мебель";
    case "bathroom":
      return "мебель для санузла";
    case "lighting":
      return "освещение";
    case "decor":
      return "текстиль и декор";
    default:
      return "мебель";
  }
}

function categoriesLabel(categories: FurnitureCategory[]) {
  return categories.map(categoryLabel).join(", ");
}

function defaultCategoriesForRoom(room?: Room): FurnitureCategory[] {
  if (!room) return ["sofa", "table", "storage"];

  switch (room.type) {
    case "bedroom":
      return ["bed", "storage", "table"];
    case "children":
      return ["bed", "storage", "table"];
    case "kitchen":
    case "living":
      return ["kitchen", "sofa", "table"];
    case "bathroom":
      return ["bathroom", "storage"];
    case "hall":
    case "wardrobe":
      return ["storage"];
    case "balcony":
      return ["table", "decor"];
    default:
      return ["sofa", "table"];
  }
}

function inferFurnitureCategories(message: string, room?: Room): FurnitureCategory[] {
  const lower = message.toLowerCase();
  const categories: FurnitureCategory[] = [];

  if (hasAny(lower, ["кроват", "изголов", "спальн"])) categories.push("bed");
  if (hasAny(lower, ["диван", "софа", "кресл"])) categories.push("sofa");
  if (hasAny(lower, ["обеденн", "рабочий стол", "письмен", "стол", "столик", "парта"])) categories.push("table");
  if (hasAny(lower, ["шкаф", "гардероб", "хранен", "стеллаж", "комод", "полк"])) categories.push("storage");
  if (hasAny(lower, ["кухон", "гарнитур", "остров"])) categories.push("kitchen");
  if (hasAny(lower, ["сануз", "раковин", "ванн", "душ", "тумб"])) categories.push("bathroom");
  if (hasAny(lower, ["свет", "освещ", "трек", "люстр", "светильник"])) categories.push("lighting");
  if (hasAny(lower, ["штор", "текстил", "подуш", "покрывал", "декор", "ковер", "ковёр"])) categories.push("decor");

  if (hasAny(lower, ["всю мебель", "вся мебель", "несколько мебели", "несколько предмет", "полностью обстав", "обставь комнат", "расставь мебель", "мебель для комнаты"])) {
    categories.push(...defaultCategoriesForRoom(room));
  }

  if (categories.length === 0) {
    categories.push(...defaultCategoriesForRoom(room).slice(0, 1));
  }

  return uniqueCategories(categories);
}

function detectFurniturePlacementRequest(message: string, room?: Room): FurniturePlacementRequest | null {
  const lower = message.toLowerCase();

  const furnitureWords = [
    "мебел",
    "кроват",
    "диван",
    "стол",
    "шкаф",
    "гардероб",
    "кухон",
    "гарнитур",
    "остров",
    "тумб",
    "раковин",
    "свет",
    "освещ",
    "текстил",
    "штор",
    "декор",
    "обстав"
  ];

  const actionWords = [
    "постав",
    "расстав",
    "размест",
    "подбери",
    "подобрать",
    "выбери",
    "выбрать",
    "помест",
    "куда",
    "как лучше",
    "как рационально",
    "вариант мебели",
    "добавь",
    "еще",
    "ещё",
    "замени",
    "поменяй"
  ];

  if (!hasAny(lower, furnitureWords) || !hasAny(lower, actionWords)) {
    return null;
  }

  const categories = inferFurnitureCategories(lower, room);
  const targetRoom = room ?? { id: "apartment", name: "квартира" };
  const addMore = hasAny(lower, ["добавь", "еще", "ещё", "дополнительно", "плюс"]);
  const replaceExisting = hasAny(lower, ["замени", "поменяй", "вместо", "другой вариант", "другую"]);

  return {
    categories,
    label: categoriesLabel(categories),
    roomId: targetRoom.id,
    roomName: targetRoom.name,
    addMore,
    replaceExisting
  };
}

function normalizeBudgetNumber(rawValue: string, rawUnit?: string) {
  const cleaned = rawValue.replace(/\s|\u00A0/g, "").replace(",", ".");
  const numeric = Number(cleaned);
  const unit = (rawUnit ?? "").toLowerCase();

  if (!Number.isFinite(numeric) || numeric <= 0) return null;

  if (unit.includes("млн") || unit.includes("милли")) return Math.round(numeric * 1_000_000);
  if (unit.includes("тыс") || unit.includes("тысяч") || unit === "т" || unit === "к" || unit === "k") {
    return Math.round(numeric * 1_000);
  }

  if (numeric < 1000) return Math.round(numeric * 1_000);

  return Math.round(numeric);
}

function parseBudget(message: string): BudgetRequest | null {
  const lower = message.toLowerCase();

  if (lower.includes("дешев") || lower.includes("бюджетн") || lower.includes("эконом")) {
    return { min: 0, max: 50_000, target: 35_000, label: "до 50 000 ₽" };
  }

  if (lower.includes("средн") || lower.includes("оптимальн")) {
    return { min: 35_000, max: 100_000, target: 67_500, label: "35 000–100 000 ₽" };
  }

  if (lower.includes("дорог") || lower.includes("премиум")) {
    return { min: 80_000, max: 250_000, target: 150_000, label: "80 000–250 000 ₽" };
  }

  const matches = [...message.matchAll(/(\d+(?:[\s\u00A0]\d{3})*(?:[.,]\d+)?|\d+)(?:\s*(млн|миллион[а-я]*|тыс\.?|тысяч[а-я]*|т|к|k))?/gi)];
  const values = matches
    .map((match) => normalizeBudgetNumber(match[1], match[2]))
    .filter((value): value is number => Boolean(value && value >= 1000 && value <= 5_000_000));

  if (values.length === 0) return null;

  if (values.length === 1) {
    const max = values[0];
    return {
      min: 0,
      max,
      target: Math.round(max * 0.72),
      label: `до ${formatPrice(max)}`
    };
  }

  const min = Math.min(values[0], values[1]);
  const max = Math.max(values[0], values[1]);

  return {
    min,
    max,
    target: Math.round((min + max) / 2),
    label: `${formatPrice(min)} — ${formatPrice(max)}`
  };
}

function candidateScore(item: FurnitureItem, budget: BudgetRequest) {
  const inRangePenalty = item.price >= budget.min && item.price <= budget.max ? 0 : 1_000_000;
  const overBudgetPenalty = item.price > budget.max ? (item.price - budget.max) * 4 : 0;
  return Math.abs(item.price - budget.target) + inRangePenalty + overBudgetPenalty;
}

function selectFurnitureItem(category: FurnitureCategory, budget: BudgetRequest, room?: Room) {
  let candidates = furnitureItems.filter((item) => item.category === category);

  if (room?.type === "children") {
    const childrenSet = furnitureItems.find((item) => item.title.toLowerCase().includes("junior"));
    if (childrenSet && !candidates.some((item) => item.id === childrenSet.id) && category === "storage") {
      candidates = [childrenSet, ...candidates];
    }
  }

  if (room?.type === "bathroom") {
    candidates = furnitureItems.filter((item) => item.category === "bathroom");
  }

  if (candidates.length === 0) {
    candidates = furnitureItems;
  }

  const sorted = [...candidates].sort((a, b) => candidateScore(a, budget) - candidateScore(b, budget));
  const item = sorted[0];
  const fitsBudget = item.price >= budget.min && item.price <= budget.max;

  return { item, fitsBudget };
}

function furniturePlacementAdvice(category: FurnitureCategory, room?: Room) {
  const roomName = room ? `в комнате **${room.name}**` : "на плане";

  switch (category) {
    case "bed":
      return `кровать поставлена ${roomName} у стены, чтобы остались проходы и не перекрывалась дверь`;
    case "sofa":
      return `диван поставлен ${roomName} как мягкая зона отдыха с сохранением свободного прохода`;
    case "table":
      return `стол поставлен ${roomName} в свободной рабочей зоне, чтобы его было удобно обходить`;
    case "storage":
      return `система хранения поставлена ${roomName} вдоль стены, чтобы не съедать центр комнаты`;
    case "kitchen":
      return `кухонная мебель поставлена ${roomName} вдоль рабочей стены`;
    case "bathroom":
      return `мебель для санузла поставлена ${roomName} ближе к мокрой зоне`;
    case "lighting":
      return `освещение размещено ${roomName} по центральной оси зоны`;
    case "decor":
      return `текстиль и декор добавлены ${roomName} как мягкий акцент`;
    default:
      return `мебель поставлена ${roomName} с учетом проходов`;
  }
}

function buildBudgetQuestion(request: FurniturePlacementRequest) {
  return [
    `Понял, нужно подобрать **${request.label}** и красиво поставить на планировку в зоне **${request.roomName}**.`,
    "",
    "Под какой бюджет подбирать мебель? Напишите, например:",
    "- **до 70 000 ₽**",
    "- **40–80 тыс. ₽**",
    "- **средний вариант**",
    "",
    "Можно просить несколько предметов сразу: *кровать, шкаф и стол*."
  ].join("\n");
}

function buildPlacementAnswer(
  request: FurniturePlacementRequest,
  budget: BudgetRequest,
  placedItems: Array<{ item: FurnitureItem; fitsBudget: boolean }>,
  room?: Room
) {
  const allFit = placedItems.every((entry) => entry.fitsBudget);
  const budgetLine = allFit
    ? `Подобрал средние варианты в бюджете **${budget.label}**.`
    : `Часть товаров не попала точно в бюджет, поэтому взял ближайшие варианты из каталога.`;

  return [
    budgetLine,
    "",
    ...placedItems.map(
      ({ item }) => `- **${item.title}** — **${formatPrice(item.price)}**: ${furniturePlacementAdvice(item.category, room)}.`
    ),
    "",
    "Я поставил мебель на планировку. Если не понравится один предмет, напишите, например: **передвинь кровать** или **передвинь шкаф** — изменю только его."
  ].join("\n");
}

function getMoveWords(message: string) {
  const lower = message.toLowerCase();
  return hasAny(lower, [
    "передвин",
    "перемест",
    "сдвин",
    "другое место",
    "по-другому",
    "поменяй расположение",
    "не нравится расположение",
    "не понравилось расположение",
    "не понравил",
    "не нравится где",
    "не нравится как",
    "неудобно стоит",
    "поставь иначе"
  ]);
}

function matchingPlacementsByMessage(message: string, placements: FurniturePlacement[], room?: Room) {
  const lower = message.toLowerCase();
  const categories = inferFurnitureCategories(lower, room);
  const hasSpecificCategory = categories.some((category) => lower.includes(categoryLabel(category).split(" ")[0])) ||
    hasAny(lower, ["кроват", "диван", "стол", "шкаф", "кухон", "тумб", "свет", "текстил"]);

  const byTitle = placements.filter((placement) => lower.includes(placement.title.toLowerCase().split(" ")[0]));
  if (byTitle.length > 0) return byTitle;

  let candidates = placements;

  if (room) {
    const roomCandidates = candidates.filter((placement) => placement.roomId === room.id);
    if (roomCandidates.length > 0) candidates = roomCandidates;
  }

  if (hasSpecificCategory) {
    const categoryCandidates = candidates.filter((placement) => categories.includes(placement.category));

    if (categoryCandidates.length > 0) {
      return categoryCandidates;
    }

    return placements.filter((placement) => categories.includes(placement.category));
  }

  return candidates;
}

function buildMoveAnswer(placement: FurniturePlacement) {
  return [
    `Передвинул именно **${placement.title}**. Остальная мебель осталась на месте.`,
    "",
    "Если новое расположение тоже не подойдет, напишите еще раз: **передвинь этот предмет**."
  ].join("\n");
}

function getRemoveWords(message: string) {
  const lower = message.toLowerCase();
  return hasAny(lower, [
    "убери",
    "убрать",
    "удали",
    "удалить",
    "сними",
    "убирай",
    "не нужна",
    "не нужен",
    "не подходит",
    "не хочу"
  ]);
}

function getClearFurnitureWords(message: string) {
  const lower = message.toLowerCase();
  const wantsClear = hasAny(lower, ["очисти", "очистить", "сбрось", "сбросить", "удали все", "убери все", "убери всё"]);

  return (
    (getRemoveWords(lower) || wantsClear) &&
    hasAny(lower, [
      "всю мебель",
      "вся мебель",
      "все мебель",
      "всё мебель",
      "все предмет",
      "всё",
      "все",
      "полностью",
      "планировку",
      "план"
    ])
  );
}

function buildRemoveAnswer(placement: FurniturePlacement) {
  return [
    `Убрал именно **${placement.title}** с планировки.`,
    "",
    "Остальная мебель осталась на месте. Если нужно убрать другой предмет, напишите его название."
  ].join("\n");
}

export function AiChat({
  apartment,
  selectedRoom,
  furniturePlacements = [],
  onFurniturePlacement,
  onFurnitureMove,
  onFurnitureRemove,
  onFurnitureClear
}: AiChatProps) {
  const selectedRoomRef = useRef<Room | undefined>(selectedRoom);
  const chatHistoryKey = useMemo(() => apartmentChatHistoryKey(apartment.id), [apartment.id]);
  const initialMessages = useMemo(() => getInitialMessages(apartment), [apartment]);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [pendingFurnitureRequest, setPendingFurnitureRequest] = useState<FurniturePlacementRequest | null>(null);
  const [lastFurnitureRequest, setLastFurnitureRequest] = useState<FurniturePlacementRequest | null>(null);

  useEffect(() => {
    setMessages(loadChatHistory(chatHistoryKey, initialMessages));
    setHistoryLoaded(true);
  }, [chatHistoryKey, initialMessages]);

  useEffect(() => {
    if (!historyLoaded) return;
    saveChatHistory(chatHistoryKey, messages);
  }, [chatHistoryKey, historyLoaded, messages]);

  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  const selectedRoomLabel = selectedRoom ? `${selectedRoom.name}, ${selectedRoom.area} м²` : "квартира в целом";
  const roomPrompts = useMemo(() => getRoomStarterPrompts(selectedRoom), [selectedRoom]);

  const placeholder = useMemo(() => {
    if (pendingFurnitureRequest) return "Напишите бюджет: например, до 70 000 ₽ или 40–80 тыс. ₽...";
    if (lastFurnitureRequest) return "Можно написать новый бюджет или попросить передвинуть конкретную мебель...";
    if (selectedRoom) return `Вопрос по помещению: ${selectedRoom.name.toLowerCase()}...`;
    return "Задайте вопрос о квартире, цене, планировке или меблировке...";
  }, [lastFurnitureRequest, pendingFurnitureRequest, selectedRoom]);

  async function sendMessage(text: string) {
    const cleaned = text.trim();
    if (!cleaned || isLoading) return;

    const currentRoom = selectedRoomRef.current;
    const userMessage: Message = { role: "user", content: cleaned };
    const budget = parseBudget(cleaned);
    const directFurnitureRequest = detectFurniturePlacementRequest(cleaned, currentRoom);
    const activeFurnitureRequest = directFurnitureRequest ?? pendingFurnitureRequest ?? (budget ? lastFurnitureRequest : null);

    if ((getRemoveWords(cleaned) || getMoveWords(cleaned) || getClearFurnitureWords(cleaned)) && furniturePlacements.length === 0) {
      setMessages((current) => [
        ...current,
        userMessage,
        {
          role: "assistant",
          content: "На планировке пока нет мебели. Сначала попросите поставить предмет, например: **поставь кровать до 70 000 ₽**."
        }
      ]);
      setInput("");
      return;
    }

    if (getClearFurnitureWords(cleaned) && furniturePlacements.length > 0) {
      onFurnitureClear?.();
      setMessages((current) => [
        ...current,
        userMessage,
        {
          role: "assistant",
          content: "Очистил всю мебель с планировки. Теперь можно заново попросить поставить нужные предметы."
        }
      ]);
      setInput("");
      return;
    }

    if (getRemoveWords(cleaned) && furniturePlacements.length > 0) {
      const candidates = matchingPlacementsByMessage(cleaned, furniturePlacements, currentRoom);

      if (candidates.length === 1) {
        onFurnitureRemove?.(candidates[0].id);
        setMessages((current) => [
          ...current,
          userMessage,
          { role: "assistant", content: buildRemoveAnswer(candidates[0]) }
        ]);
        setInput("");
        return;
      }

      if (candidates.length > 1) {
        setMessages((current) => [
          ...current,
          userMessage,
          {
            role: "assistant",
            content: [
              "Уточните, какую именно мебель убрать:",
              "",
              ...candidates.map((placement) => `- **${placement.title}**`)
            ].join("\n")
          }
        ]);
        setInput("");
        return;
      }

      setMessages((current) => [
        ...current,
        userMessage,
        {
          role: "assistant",
          content: "Я не нашел на планировке такую мебель. Напишите точнее, например: **убери кровать** или **убери шкаф**."
        }
      ]);
      setInput("");
      return;
    }

    if (getMoveWords(cleaned) && furniturePlacements.length > 0) {
      const candidates = matchingPlacementsByMessage(cleaned, furniturePlacements, currentRoom);

      if (candidates.length === 1) {
        onFurnitureMove?.(candidates[0].id);
        setMessages((current) => [
          ...current,
          userMessage,
          { role: "assistant", content: buildMoveAnswer(candidates[0]) }
        ]);
        setInput("");
        return;
      }

      if (candidates.length > 1) {
        setMessages((current) => [
          ...current,
          userMessage,
          {
            role: "assistant",
            content: [
              "Уточните, какую именно мебель передвинуть:",
              "",
              ...candidates.map((placement) => `- **${placement.title}**`)
            ].join("\n")
          }
        ]);
        setInput("");
        return;
      }

      setMessages((current) => [
        ...current,
        userMessage,
        {
          role: "assistant",
          content: "Я не нашел на планировке такую мебель. Сначала поставьте ее через ИИ, например: **поставь кровать до 70 000 ₽**."
        }
      ]);
      setInput("");
      return;
    }

    const targetRoom = activeFurnitureRequest
      ? apartment.rooms.find((room) => room.id === activeFurnitureRequest.roomId) ?? currentRoom
      : currentRoom;

    if (activeFurnitureRequest && budget && targetRoom) {
      const placedItems = activeFurnitureRequest.categories.map((category, index) => {
        const { item, fitsBudget } = selectFurnitureItem(category, budget, targetRoom);
        const existing = furniturePlacements.find(
          (placement) => placement.roomId === activeFurnitureRequest.roomId && placement.category === category
        );
        const shouldReplace = Boolean(existing && !activeFurnitureRequest.addMore);
        const placement: FurniturePlacement = {
          id: `${activeFurnitureRequest.roomId}-${category}-${item.id}-${Date.now()}-${index}`,
          roomId: activeFurnitureRequest.roomId,
          itemId: item.id,
          title: item.title,
          category: item.category,
          price: item.price,
          layoutVariant: existing?.layoutVariant,
          createdAt: Date.now()
        };

        onFurniturePlacement?.(placement, {
          replacePlacementId: shouldReplace ? existing?.id : undefined
        });

        return { item, fitsBudget };
      });

      setPendingFurnitureRequest(null);
      setLastFurnitureRequest({ ...activeFurnitureRequest, addMore: false });
      setMessages((current) => [
        ...current,
        userMessage,
        {
          role: "assistant",
          content: buildPlacementAnswer(activeFurnitureRequest, budget, placedItems, targetRoom)
        }
      ]);
      setInput("");
      return;
    }

    if (directFurnitureRequest && !budget) {
      setPendingFurnitureRequest(directFurnitureRequest);
      setLastFurnitureRequest(directFurnitureRequest);
      setMessages((current) => [
        ...current,
        userMessage,
        {
          role: "assistant",
          content: buildBudgetQuestion(directFurnitureRequest)
        }
      ]);
      setInput("");
      return;
    }

    if ((pendingFurnitureRequest || lastFurnitureRequest) && !budget && hasAny(cleaned.toLowerCase(), ["да", "ок", "хорошо", "подбери", "поставь"])) {
      setMessages((current) => [
        ...current,
        userMessage,
        {
          role: "assistant",
          content:
            "Чтобы поставить мебель на планировку, мне нужен бюджет. Напишите, например: **до 70 000 ₽**, **40–80 тыс. ₽** или **средний вариант**."
        }
      ]);
      setInput("");
      return;
    }

    const roomContext = getRoomContextText(currentRoom);
    const historySnapshot = messages.slice(-8);

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await postJson("/api/chat", {
        message: cleaned,
        apartment,
        room: currentRoom ?? null,
        roomContext,
        history: historySnapshot
      });

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.answer ?? data.error ?? "Не удалось получить ответ. Проверьте настройки API."
        }
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? `**Сообщение не отправлено.**\n\n${error.message}`
              : "**Сообщение не отправлено.** Произошла неизвестная сетевая ошибка."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function clearCurrentChat() {
    clearChatHistory(chatHistoryKey);
    setMessages(initialMessages);
    setInput("");
    setPendingFurnitureRequest(null);
    setLastFurnitureRequest(null);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <section className="chat-card" id="ai">
      <AiMascot room={selectedRoom} isThinking={isLoading} />

      <div className="chat-context" aria-live="polite">
        <span>Контекст вопроса:</span>
        <strong>{selectedRoomLabel}</strong>
      </div>

      {selectedRoom && (
        <div className="selected-room-note" aria-live="polite">
          Сейчас ИИ отвечает именно по помещению: <strong>{selectedRoom.name}</strong>.
        </div>
      )}

      {pendingFurnitureRequest && (
        <div className="selected-room-note furniture-budget-note" aria-live="polite">
          Жду бюджет для подбора: <strong>{pendingFurnitureRequest.label}</strong>.
        </div>
      )}

      {furniturePlacements.length > 0 && (
        <div className="selected-room-note furniture-budget-note" aria-live="polite">
          На плане уже стоит мебели: <strong>{furniturePlacements.length}</strong>. Можно написать: <strong>передвинь кровать</strong> или <strong>убери шкаф</strong>.
        </div>
      )}

      <div className="chat-history-actions">
        <span>История сохраняется в этом браузере.</span>
        <button type="button" onClick={clearCurrentChat}>
          Очистить историю
        </button>
      </div>

      <div className="chat-messages" aria-live="polite">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`chat-message chat-${message.role}`}>
            <MarkdownText content={message.content} />
          </div>
        ))}
        {isLoading && (
          <div className="chat-message chat-assistant">
            <MarkdownText content="*Подготавливаю ответ...*" />
          </div>
        )}
      </div>

      <div className="prompt-row" key={selectedRoom?.id ?? "apartment"}>
        {roomPrompts.map((prompt) => (
          <button key={prompt} type="button" className="prompt-chip" onClick={() => void sendMessage(prompt)}>
            {prompt}
          </button>
        ))}
      </div>

      <form className="chat-form" onSubmit={onSubmit}>
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder={placeholder} />
        <button className="button button-primary" type="submit" disabled={isLoading}>
          Отправить
        </button>
      </form>
    </section>
  );
}

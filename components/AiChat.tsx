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
  hasOldLimitErrorText,
  loadChatHistory,
  sanitizeAssistantContent,
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
  needsItemClarification?: boolean;
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
  "Как рационально расставить мебель?",
  "Сравните эту квартиру с другими вариантами"
];

function getInitialMessages(apartment: Apartment): Message[] {
  return [
    {
      role: "assistant",
      content: `Здравствуйте. Я ИИ-консультант по квартире **${apartment.title}**. Можно задавать вопросы по планировке, комнатам и мебели.`
    }
  ];
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
      return "шкаф";
    case "kitchen":
      return "кухню";
    case "bathroom":
      return "тумбу";
    case "lighting":
      return "свет";
    case "decor":
      return "декор";
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
      return ["storage"];
  }
}

function inferSpecificFurnitureCategories(message: string): FurnitureCategory[] {
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

  return uniqueCategories(categories);
}

function inferFurnitureCategories(message: string, room?: Room): FurnitureCategory[] {
  const lower = message.toLowerCase();
  const categories = inferSpecificFurnitureCategories(lower);

  if (
    hasAny(lower, [
      "всю мебель",
      "вся мебель",
      "несколько предмет",
      "полностью обстав",
      "обставь комнат",
      "расставь мебель",
      "мебель для комнаты"
    ])
  ) {
    categories.push(...defaultCategoriesForRoom(room));
  }

  if (categories.length === 0) {
    categories.push(...defaultCategoriesForRoom(room).slice(0, 1));
  }

  return uniqueCategories(categories);
}

function detectFurniturePlacementRequest(message: string, room?: Room): FurniturePlacementRequest | null {
  const lower = message.toLowerCase();

  const explicitPlacementWords = [
    "поставь",
    "поставить",
    "размести",
    "разместить",
    "расположи",
    "расположить",
    "расставь",
    "добавь",
    "добавить",
    "обставь",
    "обставить",
    "подбери",
    "подобрать",
    "выбери",
    "выбрать"
  ];

  const furnitureWords = [
    "мебел",
    "кроват",
    "диван",
    "стол",
    "шкаф",
    "гардероб",
    "кухон",
    "гарнитур",
    "тумб",
    "свет",
    "декор",
    "обстав"
  ];

  const hasImperative = hasAny(lower, explicitPlacementWords);
  const hasFurniture = hasAny(lower, furnitureWords);

  if (!hasImperative || !hasFurniture) return null;

  const specificCategories = inferSpecificFurnitureCategories(lower);
  const needsItemClarification = specificCategories.length === 0;
  const categories = needsItemClarification ? defaultCategoriesForRoom(room) : specificCategories;
  const targetRoom = room ?? { id: "apartment", name: "квартира" };
  const addMore = hasAny(lower, ["добавь", "еще", "ещё", "дополнительно", "плюс"]);

  return {
    categories,
    label: needsItemClarification ? "мебель" : categoriesLabel(categories),
    roomId: targetRoom.id,
    roomName: targetRoom.name,
    addMore,
    needsItemClarification
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
    return { min: 0, max, target: Math.round(max * 0.72), label: `до ${formatPrice(max)}` };
  }

  const min = Math.min(values[0], values[1]);
  const max = Math.max(values[0], values[1]);
  return { min, max, target: Math.round((min + max) / 2), label: `${formatPrice(min)} — ${formatPrice(max)}` };
}

function candidateScore(item: FurnitureItem, budget: BudgetRequest) {
  const inRangePenalty = item.price >= budget.min && item.price <= budget.max ? 0 : 1_000_000;
  const overBudgetPenalty = item.price > budget.max ? (item.price - budget.max) * 4 : 0;
  return Math.abs(item.price - budget.target) + inRangePenalty + overBudgetPenalty;
}

function selectFurnitureItem(category: FurnitureCategory, budget: BudgetRequest, room?: Room, excludedItemIds: string[] = []) {
  let candidates = furnitureItems.filter((item) => item.category === category);

  if (room?.type === "bathroom") {
    candidates = furnitureItems.filter((item) => item.category === "bathroom");
  }

  if (candidates.length === 0) candidates = furnitureItems;

  const excluded = new Set(excludedItemIds);
  const pool = candidates.filter((item) => !excluded.has(item.id));
  const sorted = [...(pool.length ? pool : candidates)].sort((a, b) => candidateScore(a, budget) - candidateScore(b, budget));
  const item = sorted[0];
  const fitsBudget = item.price >= budget.min && item.price <= budget.max;

  return { item, fitsBudget };
}

function furniturePlacementAdvice(category: FurnitureCategory, room?: Room) {
  const roomName = room ? `в зоне **${room.name}**` : "на плане";

  switch (category) {
    case "bed":
      return `кровать поставлена ${roomName} у стены, чтобы остались проходы и не перекрывалась дверь`;
    case "sofa":
      return `диван поставлен ${roomName} как зона отдыха с сохранением свободного прохода`;
    case "table":
      return `стол поставлен ${roomName} ближе к свету и не на основной проход`;
    case "storage":
      return `шкаф поставлен ${roomName} вдоль стены, чтобы не перекрывать дверь и центр помещения`;
    case "kitchen":
      return `кухонная мебель поставлена ${roomName} вдоль рабочей стены`;
    case "bathroom":
      return `мебель для санузла поставлена ${roomName} ближе к мокрой зоне`;
    case "lighting":
      return `освещение размещено ${roomName} по центральной оси`;
    case "decor":
      return `декор добавлен ${roomName} без перегруза проходов`;
    default:
      return `мебель поставлена ${roomName} с учетом проходов`;
  }
}

function isFurnitureAdviceRequest(message: string) {
  const lower = message.toLowerCase();
  const furnitureWords = ["мебел", "кроват", "диван", "стол", "шкаф", "гардероб", "хранен", "кухон", "тумб", "расстанов", "входн", "прихож"];
  const adviceWords = ["как", "куда", "где", "можно ли", "посовет", "рекоменд", "лучше", "удобн", "рациональн", "подойдет", "подойдёт"];

  return hasAny(lower, furnitureWords) && hasAny(lower, adviceWords);
}

function buildFurnitureAdviceAnswer(message: string, room?: Room) {
  const lower = message.toLowerCase();
  const roomName = room ? `**${room.name}** (${room.area} м²)` : "**квартире в целом**";

  if (lower.includes("вход") || lower.includes("прихож")) {
    return [
      `**Как сделать входную зону удобнее:**`,
      "",
      "- Поставьте закрытый шкаф или узкую систему хранения вдоль свободной стены.",
      "- Добавьте обувницу с сиденьем, чтобы вещи не скапливались на полу.",
      "- Повесьте зеркало и 2–3 крючка для ежедневной одежды.",
      "- Оставьте проход от двери свободным: мебель не должна попадать в зону открывания.",
      "",
      "Если нужно именно поставить предмет на планировку, напишите: **поставь шкаф до 70 000 ₽**."
    ].join("\n");
  }

  const categories = inferSpecificFurnitureCategories(lower);
  const baseTips =
    categories.length > 0
      ? categories.map((category) => `- ${furniturePlacementAdvice(category, room).replace("поставлена", "лучше поставить").replace("поставлен", "лучше поставить").replace("размещено", "лучше разместить")}.`)
      : [
          "- Сначала оставьте свободный проход от двери к окну и основным зонам.",
          "- Крупную мебель лучше ставить вдоль стен, а центр комнаты не перегружать.",
          "- Рабочее место удобнее располагать ближе к естественному свету."
        ];

  return [`**Рекомендации для ${roomName}:**`, "", ...baseTips, "", "Цену и товар подберу только если вы попросите именно поставить или подобрать мебель."].join("\n");
}

function buildBudgetQuestion(request: FurniturePlacementRequest) {
  if (request.needsItemClarification) {
    return [
      `Понял, нужно поставить мебель на планировку в зоне **${request.roomName}**.`,
      "",
      "Уточните, какую именно мебель ставим и в каком бюджете. Например:",
      "- **шкаф до 70 000 ₽**",
      "- **кровать и шкаф до 120 000 ₽**",
      "- **диван до 80 000 ₽**"
    ].join("\n");
  }

  return [
    `Понял, нужно поставить **${request.label}** на планировку в зоне **${request.roomName}**.`,
    "",
    "Под какой бюджет подбирать мебель? Напишите, например:",
    "- **до 70 000 ₽**",
    "- **40–80 тыс. ₽**",
    "- **средний вариант**"
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
    ? `Подобрал варианты в бюджете **${budget.label}**.`
    : "Часть товаров не попала точно в бюджет, поэтому взял ближайшие варианты из каталога.";

  return [
    budgetLine,
    "",
    ...placedItems.map(({ item }) => `- **${item.title}** — **${formatPrice(item.price)}**: ${furniturePlacementAdvice(item.category, room)}.`),
    "",
    "Я поставил мебель на планировку безопасно: не на дверь и не в основной проход. При необходимости предмет можно перетащить вручную прямо на плане."
  ].join("\n");
}

function getMoveWords(message: string) {
  const lower = message.toLowerCase();
  return hasAny(lower, ["передвин", "перемест", "сдвин", "другое место", "по-другому", "поставь иначе", "неудобно стоит"]);
}

function getRemoveWords(message: string) {
  const lower = message.toLowerCase();
  return hasAny(lower, ["убери", "убрать", "удали", "удалить", "сними", "не нужна", "не нужен", "не подходит"]);
}

function getClearFurnitureWords(message: string) {
  const lower = message.toLowerCase();
  return hasAny(lower, ["очисти всю", "очистить всю", "сбрось мебель", "удали все", "убери все", "убери всё", "очисти план"]);
}

function matchingPlacementsByMessage(message: string, placements: FurniturePlacement[], room?: Room) {
  const lower = message.toLowerCase();
  const categories = inferFurnitureCategories(lower, room);
  const hasSpecificCategory = hasAny(lower, ["кроват", "диван", "стол", "шкаф", "кухон", "тумб", "свет", "декор"]);
  const byTitle = placements.filter((placement) => lower.includes(placement.title.toLowerCase().split(" ")[0]));

  if (byTitle.length > 0) return byTitle;

  let candidates = room ? placements.filter((placement) => placement.roomId === room.id) : placements;
  if (candidates.length === 0) candidates = placements;

  if (hasSpecificCategory) {
    const categoryCandidates = candidates.filter((placement) => categories.includes(placement.category));
    if (categoryCandidates.length > 0) return categoryCandidates;
  }

  return candidates;
}

function getRoomContextText(room?: Room) {
  if (!room) return "Комната не выбрана. Ответ относится к квартире в целом.";

  return [
    `Текущая выбранная комната: ${room.name}, площадь ${room.area} м².`,
    `Описание: ${room.description}.`,
    `Советы по мебели: ${room.furnitureTips.join("; ")}.`
  ].join(" ");
}

function getRoomStarterPrompts(room?: Room) {
  if (!room) return apartmentStarterPrompts;
  if (room.chatPrompts?.length) return room.chatPrompts;

  if (room.type === "hall") {
    return ["Как сделать входную зону удобнее?", "Поставь шкаф до 70 000 ₽", "Передвинь шкаф", "Очисти всю мебель"];
  }

  return [`Как лучше использовать ${room.name.toLowerCase()} ${room.area} м²?`, "Поставь шкаф до 70 000 ₽", "Передвинь мебель", "Очисти всю мебель"];
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
  const messagesRef = useRef<Message[]>([]);
  const chatHistoryKey = useMemo(() => apartmentChatHistoryKey(apartment.id), [apartment.id]);
  const initialMessages = useMemo(() => getInitialMessages(apartment), [apartment]);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [pendingFurnitureRequest, setPendingFurnitureRequest] = useState<FurniturePlacementRequest | null>(null);
  const [lastFurnitureRequest, setLastFurnitureRequest] = useState<FurniturePlacementRequest | null>(null);

  useEffect(() => {
    const next = loadChatHistory(chatHistoryKey, initialMessages);
    setMessages(next);
    messagesRef.current = next;
    setHistoryLoaded(true);
  }, [chatHistoryKey, initialMessages]);

  useEffect(() => {
    messagesRef.current = messages;
    if (historyLoaded) saveChatHistory(chatHistoryKey, messages);
  }, [chatHistoryKey, historyLoaded, messages]);

  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  const isLoading = pendingCount > 0;
  const selectedRoomLabel = selectedRoom ? `${selectedRoom.name}, ${selectedRoom.area} м²` : "квартира в целом";
  const roomPrompts = useMemo(() => getRoomStarterPrompts(selectedRoom), [selectedRoom]);

  function addMessages(nextMessages: Message[]) {
    setMessages((current) => [...current, ...nextMessages]);
  }

  async function sendMessage(text: string) {
    const cleaned = text.trim();
    if (!cleaned) return;

    const currentRoom = selectedRoomRef.current;
    const userMessage: Message = { role: "user", content: cleaned };
    const budget = parseBudget(cleaned);
    const directFurnitureRequest = detectFurniturePlacementRequest(cleaned, currentRoom);
    const activeFurnitureRequest = directFurnitureRequest ?? pendingFurnitureRequest ?? (budget ? lastFurnitureRequest : null);

    if ((getRemoveWords(cleaned) || getMoveWords(cleaned) || getClearFurnitureWords(cleaned)) && furniturePlacements.length === 0) {
      addMessages([
        userMessage,
        {
          role: "assistant",
          content: "На планировке пока нет мебели. Сначала попросите поставить предмет, например: **поставь шкаф до 70 000 ₽**."
        }
      ]);
      setInput("");
      return;
    }

    if (getClearFurnitureWords(cleaned) && furniturePlacements.length > 0) {
      onFurnitureClear?.();
      addMessages([userMessage, { role: "assistant", content: "Очистил всю мебель с планировки этого устройства." }]);
      setInput("");
      return;
    }

    if (getRemoveWords(cleaned) && furniturePlacements.length > 0) {
      const candidates = matchingPlacementsByMessage(cleaned, furniturePlacements, currentRoom);
      if (candidates.length === 1) {
        onFurnitureRemove?.(candidates[0].id);
        addMessages([userMessage, { role: "assistant", content: `Убрал **${candidates[0].title}** с планировки.` }]);
      } else {
        addMessages([
          userMessage,
          {
            role: "assistant",
            content: ["Уточните, какую мебель убрать:", "", ...candidates.map((placement) => `- **${placement.title}**`)].join("\n")
          }
        ]);
      }
      setInput("");
      return;
    }

    if (getMoveWords(cleaned) && furniturePlacements.length > 0) {
      const candidates = matchingPlacementsByMessage(cleaned, furniturePlacements, currentRoom);
      if (candidates.length === 1) {
        onFurnitureMove?.(candidates[0].id);
        addMessages([
          userMessage,
          {
            role: "assistant",
            content: `Передвинул **${candidates[0].title}**. Остальную мебель не трогал. Можно также перетащить предмет вручную на плане.`
          }
        ]);
      } else {
        addMessages([
          userMessage,
          {
            role: "assistant",
            content: ["Уточните, какую мебель передвинуть:", "", ...candidates.map((placement) => `- **${placement.title}**`)].join("\n")
          }
        ]);
      }
      setInput("");
      return;
    }

    if (isFurnitureAdviceRequest(cleaned) && !directFurnitureRequest && !budget && !pendingFurnitureRequest) {
      addMessages([userMessage, { role: "assistant", content: buildFurnitureAdviceAnswer(cleaned, currentRoom) }]);
      setInput("");
      return;
    }

    const targetRoom = activeFurnitureRequest
      ? apartment.rooms.find((room) => room.id === activeFurnitureRequest.roomId) ?? currentRoom
      : currentRoom;

    if (activeFurnitureRequest?.needsItemClarification) {
      setPendingFurnitureRequest(activeFurnitureRequest);
      setLastFurnitureRequest(activeFurnitureRequest);
      addMessages([userMessage, { role: "assistant", content: buildBudgetQuestion(activeFurnitureRequest) }]);
      setInput("");
      return;
    }

    if (activeFurnitureRequest && budget && targetRoom) {
      const usedItemIds = new Set(furniturePlacements.map((placement) => placement.itemId));
      const placedItems = activeFurnitureRequest.categories.map((category, index) => {
        const existing = furniturePlacements.find(
          (placement) => placement.roomId === activeFurnitureRequest.roomId && placement.category === category
        );
        const shouldReplace = Boolean(existing && !activeFurnitureRequest.addMore);
        const { item, fitsBudget } = selectFurnitureItem(category, budget, targetRoom, [...usedItemIds]);
        usedItemIds.add(item.id);

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
      addMessages([userMessage, { role: "assistant", content: buildPlacementAnswer(activeFurnitureRequest, budget, placedItems, targetRoom) }]);
      setInput("");
      return;
    }

    if (directFurnitureRequest && !budget) {
      setPendingFurnitureRequest(directFurnitureRequest);
      setLastFurnitureRequest(directFurnitureRequest);
      addMessages([userMessage, { role: "assistant", content: buildBudgetQuestion(directFurnitureRequest) }]);
      setInput("");
      return;
    }

    const roomContext = getRoomContextText(currentRoom);
    const historySnapshot = messagesRef.current.slice(-8);

    addMessages([userMessage]);
    setInput("");
    setPendingCount((count) => count + 1);

    try {
      const data = await postJson("/api/chat", {
        message: cleaned,
        apartment,
        room: currentRoom ?? null,
        roomContext,
        history: historySnapshot
      });

      addMessages([
        {
          role: "assistant",
          content: sanitizeAssistantContent(
            data.answer ?? data.error,
            "**Краткая консультация:** напишите вопрос коротко: например, **как сделать входную зону удобнее**, **где лучше хранение** или **какие преимущества у комнаты**."
          )
        }
      ]);
    } catch (error) {
      addMessages([
        {
          role: "assistant",
          content:
            error instanceof Error
              ? `**Сообщение не отправлено.**\n\n${error.message}`
              : "**Сообщение не отправлено.** Произошла неизвестная сетевая ошибка."
        }
      ]);
    } finally {
      setPendingCount((count) => Math.max(0, count - 1));
    }
  }

  function clearCurrentChat() {
    clearChatHistory(chatHistoryKey);
    const next = initialMessages;
    setMessages(next);
    messagesRef.current = next;
    setInput("");
    setPendingFurnitureRequest(null);
    setLastFurnitureRequest(null);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  const visibleMessages = messages.filter((message) => !hasOldLimitErrorText(message.content));

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
          Мебель хранится только на этом устройстве. Можно перетаскивать предметы прямо на плане.
        </div>
      )}

      <div className="chat-history-actions">
        <span>{pendingCount > 0 ? `Обрабатывается запросов: ${pendingCount}` : "История сохраняется в этом браузере."}</span>
        <button type="button" onClick={clearCurrentChat}>
          Очистить историю
        </button>
      </div>

      <div className="chat-messages" aria-live="polite">
        {visibleMessages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`chat-message chat-${message.role}`}>
            <MarkdownText content={message.content} />
          </div>
        ))}
        {pendingCount > 0 && (
          <div className="chat-message chat-assistant">
            <MarkdownText content={`*Подготавливаю ответ... (${pendingCount})*`} />
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
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={
            pendingFurnitureRequest
              ? "Напишите бюджет: например, до 70 000 ₽..."
              : selectedRoom
                ? `Вопрос по помещению: ${selectedRoom.name.toLowerCase()}...`
                : "Задайте вопрос о квартире..."
          }
          rows={2}
        />
        <button className="button button-primary" type="submit">
          Отправить
        </button>
      </form>
    </section>
  );
}

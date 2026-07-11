import apartmentData from "@/data/apartments.json";
import layoutData from "@/data/apartment-layouts.json";
import type {
  Apartment,
  ApartmentStatus,
  PlanPoint,
  PolygonRoomPlan,
  RectRoomPlan,
  Room,
  RoomPlan,
  RoomType
} from "@/types/apartment";

type RawApartment = Omit<Apartment, "status" | "rooms"> & {
  status: string;
  layoutId: string;
};

type RawLayoutCommon = {
  roomId: string;
  type: RoomType;
  name: string;
  areaShare: number;
};

type RawRectLayoutRoom = RawLayoutCommon & RectRoomPlan;
type RawPolygonLayoutRoom = RawLayoutCommon & {
  kind: "polygon";
  points: PlanPoint[];
  labelX?: number;
  labelY?: number;
};
type RawLayoutRoom = RawRectLayoutRoom | RawPolygonLayoutRoom;

type RoomCopy = {
  description: string;
  furnitureTips: string[];
  prompts: string[];
};

const EXPECTED_APARTMENT_COUNT = 75;

const ROOM_COPY: Record<RoomType, RoomCopy> = {
  hall: {
    description: "Входная зона для верхней одежды, обуви и повседневного хранения.",
    furnitureTips: ["Закрытый шкаф", "Обувница или банкетка", "Зеркало в полный рост"],
    prompts: ["Как организовать хранение?", "Где поставить шкаф?", "Как сохранить свободный проход?"]
  },
  bathroom: {
    description: "Мокрая зона для сантехники, бытовой техники и компактного хранения.",
    furnitureTips: ["Тумба с раковиной", "Ванна или душевая", "Стиральная машина"],
    prompts: ["Что выбрать: ванну или душ?", "Где поставить стиральную машину?", "Как добавить хранение?"]
  },
  wardrobe: {
    description: "Отдельная зона хранения, которая освобождает жилые комнаты от лишних шкафов.",
    furnitureTips: ["Полки до потолка", "Штанги для одежды", "Секции для сезонных вещей"],
    prompts: ["Как организовать гардеробную?", "Что лучше: полки или штанги?", "Как хранить сезонные вещи?"]
  },
  kitchen: {
    description: "Общая зона для готовки, приема пищи, отдыха и семейного общения.",
    furnitureTips: ["Кухонный гарнитур", "Обеденный стол", "Диван или кресла"],
    prompts: ["Как расставить кухню?", "Где поставить обеденный стол?", "Как отделить зону отдыха?"]
  },
  living: {
    description: "Жилая общая зона для отдыха, общения и приема гостей.",
    furnitureTips: ["Диван", "ТВ-зона", "Журнальный стол"],
    prompts: ["Где поставить диван?", "Как организовать ТВ-зону?", "Как сохранить проходы?"]
  },
  bedroom: {
    description: "Приватная комната для сна, хранения и спокойной работы.",
    furnitureTips: ["Кровать 160–180 см", "Шкаф", "Прикроватные тумбы"],
    prompts: ["Поместится ли двуспальная кровать?", "Где поставить шкаф?", "Можно ли добавить рабочее место?"]
  },
  children: {
    description: "Комната для сна, учебы, хранения и свободной зоны ребенка.",
    furnitureTips: ["Кровать", "Рабочий стол", "Шкаф для одежды"],
    prompts: ["Как разделить сон и учебу?", "Где поставить стол?", "Хватит ли места для хранения?"]
  },
  balcony: {
    description: "Дополнительное пространство для отдыха, хранения или компактного рабочего места.",
    furnitureTips: ["Кресло и столик", "Узкий шкаф", "Компактное рабочее место"],
    prompts: ["Можно ли сделать мини-кабинет?", "Как оформить зону отдыха?", "Как добавить хранение?"]
  }
};

function isApartmentStatus(value: string): value is ApartmentStatus {
  return value === "available" || value === "reserved" || value === "sold";
}

function isPolygonPlan(plan: RawLayoutRoom | RoomPlan): plan is RawPolygonLayoutRoom | PolygonRoomPlan {
  return "points" in plan && Array.isArray(plan.points);
}

function normalizePoints(points: PlanPoint[]) {
  return points.map((point) => ({ x: Number(point.x), y: Number(point.y) }));
}

function planPoints(plan: RoomPlan): PlanPoint[] {
  if (isPolygonPlan(plan)) return normalizePoints(plan.points);

  return [
    { x: plan.x, y: plan.y },
    { x: plan.x + plan.width, y: plan.y },
    { x: plan.x + plan.width, y: plan.y + plan.height },
    { x: plan.x, y: plan.y + plan.height }
  ];
}

function polygonFromPlan(plan: RoomPlan) {
  return planPoints(plan)
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
}

function planLabel(plan: RoomPlan) {
  if (isPolygonPlan(plan) && typeof plan.labelX === "number" && typeof plan.labelY === "number") {
    return { x: plan.labelX, y: plan.labelY };
  }

  const points = planPoints(plan);
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  return { x: Math.round((minX + maxX) / 2), y: Math.round((minY + maxY) / 2) };
}

function roomPlan(rawRoom: RawLayoutRoom): RoomPlan {
  if (isPolygonPlan(rawRoom)) {
    if (rawRoom.points.length < 3) {
      throw new Error(`Полигон комнаты ${rawRoom.roomId} должен содержать минимум три точки`);
    }

    const points = normalizePoints(rawRoom.points);
    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));

    return {
      kind: "polygon",
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      points,
      labelX: rawRoom.labelX,
      labelY: rawRoom.labelY
    };
  }

  return {
    kind: "rect",
    x: Number(rawRoom.x),
    y: Number(rawRoom.y),
    width: Number(rawRoom.width),
    height: Number(rawRoom.height)
  };
}

function buildRoom(apartment: RawApartment, rawRoom: RawLayoutRoom, area: number): Room {
  const copy = ROOM_COPY[rawRoom.type];
  const plan = roomPlan(rawRoom);
  const label = planLabel(plan);

  return {
    id: rawRoom.roomId,
    type: rawRoom.type,
    name: rawRoom.name,
    area,
    plan,
    description: `${copy.description} Площадь помещения — ${area} м².`,
    furnitureTips: [...copy.furnitureTips],
    aiHints: [
      `Отвечайте по помещению «${rawRoom.name}» площадью ${area} м² в квартире ${apartment.id}, город ${apartment.city}.`,
      "Не обещайте перепланировку, перенос мокрых зон или точное размещение без проверки размеров.",
      "При советах по мебели сохраняйте свободный проход и не перекрывайте двери и окна."
    ],
    chatPrompts: [`Как лучше использовать ${rawRoom.name.toLowerCase()} ${area} м²?`, ...copy.prompts],
    polygon: polygonFromPlan(plan),
    labelX: label.x,
    labelY: label.y
  };
}

function buildApartment(rawApartment: RawApartment, layouts: Record<string, RawLayoutRoom[]>): Apartment {
  if (!isApartmentStatus(rawApartment.status)) {
    throw new Error(`Неизвестный статус квартиры ${rawApartment.id}: ${rawApartment.status}`);
  }

  const layout = layouts[rawApartment.layoutId];
  if (!layout?.length) {
    throw new Error(`Для квартиры ${rawApartment.id} не найдена планировка ${rawApartment.layoutId}`);
  }

  const shareTotal = layout.reduce((sum, room) => sum + room.areaShare, 0);
  if (Math.abs(shareTotal - 1) > 0.001) {
    throw new Error(`Сумма areaShare в планировке ${rawApartment.layoutId} должна быть равна 1`);
  }

  const roomIds = new Set(layout.map((room) => room.roomId));
  if (roomIds.size !== layout.length) {
    throw new Error(`В планировке ${rawApartment.layoutId} найдены повторяющиеся roomId`);
  }

  let allocatedArea = 0;
  const rooms = layout.map((room, index) => {
    const area =
      index === layout.length - 1
        ? Math.round((rawApartment.totalArea - allocatedArea) * 10) / 10
        : Math.round(rawApartment.totalArea * room.areaShare * 10) / 10;
    allocatedArea += area;
    return buildRoom(rawApartment, room, area);
  });

  const { layoutId: _layoutId, ...apartment } = rawApartment;
  return {
    ...apartment,
    status: rawApartment.status,
    rooms
  };
}

const rawApartments = apartmentData as RawApartment[];
const rawLayouts = layoutData as Record<string, RawLayoutRoom[]>;

if (rawApartments.length !== EXPECTED_APARTMENT_COUNT) {
  throw new Error(`В data/apartments.json должно быть ровно ${EXPECTED_APARTMENT_COUNT} квартир, сейчас: ${rawApartments.length}`);
}

const apartmentIds = new Set(rawApartments.map((apartment) => apartment.id));
if (apartmentIds.size !== rawApartments.length) {
  throw new Error("В data/apartments.json найдены повторяющиеся id квартир");
}

const projectNames = new Set(rawApartments.map((apartment) => apartment.project));
if (projectNames.size < 30) {
  throw new Error(`В каталоге должно быть не меньше 30 ЖК, сейчас: ${projectNames.size}`);
}

export const apartments: Apartment[] = rawApartments.map((apartment) => buildApartment(apartment, rawLayouts));

export function getApartmentById(id: string) {
  return apartments.find((apartment) => apartment.id === id);
}

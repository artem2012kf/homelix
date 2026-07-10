import apartmentData from "@/data/apartments.json";
import layoutData from "@/data/apartment-layouts.json";
import type { Apartment, ApartmentStatus, Room, RoomPlan, RoomType } from "@/types/apartment";

type RawRoom = {
  id: string;
  type: RoomType;
  name: string;
  area: number;
};

type RawApartment = Omit<Apartment, "status" | "rooms"> & {
  status: string;
  layoutId: string;
  rooms: RawRoom[];
};

type RawLayoutRoom = RoomPlan & {
  roomId: string;
};

type RoomCopy = {
  description: string;
  furnitureTips: string[];
  prompts: string[];
};

const EXPECTED_APARTMENT_COUNT = 15;

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

function polygonFromPlan(plan: RoomPlan) {
  const right = plan.x + plan.width;
  const bottom = plan.y + plan.height;
  return `${plan.x},${plan.y} ${right},${plan.y} ${right},${bottom} ${plan.x},${bottom}`;
}

function buildRoom(apartmentId: string, rawRoom: RawRoom, plan: RoomPlan): Room {
  const copy = ROOM_COPY[rawRoom.type];
  const roomName = rawRoom.name.toLowerCase();

  return {
    ...rawRoom,
    plan,
    description: `${copy.description} Площадь помещения — ${rawRoom.area} м².`,
    furnitureTips: [...copy.furnitureTips],
    aiHints: [
      `Отвечайте по помещению «${rawRoom.name}» площадью ${rawRoom.area} м² в квартире ${apartmentId}.`,
      "Не обещайте перепланировку, перенос мокрых зон или точное размещение без проверки размеров.",
      "При советах по мебели сохраняйте свободный проход и не перекрывайте двери и окна."
    ],
    chatPrompts: [`Как лучше использовать ${roomName} ${rawRoom.area} м²?`, ...copy.prompts],
    polygon: polygonFromPlan(plan),
    labelX: Math.round(plan.x + plan.width / 2),
    labelY: Math.round(plan.y + plan.height / 2)
  };
}

function buildApartment(rawApartment: RawApartment, layouts: Record<string, RawLayoutRoom[]>): Apartment {
  if (!isApartmentStatus(rawApartment.status)) {
    throw new Error(`Неизвестный статус квартиры ${rawApartment.id}: ${rawApartment.status}`);
  }

  const layout = layouts[rawApartment.layoutId];
  if (!layout) {
    throw new Error(`Для квартиры ${rawApartment.id} не найдена планировка ${rawApartment.layoutId}`);
  }

  const planByRoomId = new Map(layout.map(({ roomId, ...plan }) => [roomId, plan] as const));
  const rooms = rawApartment.rooms.map((room) => {
    const plan = planByRoomId.get(room.id);
    if (!plan) throw new Error(`В планировке ${rawApartment.layoutId} отсутствует комната ${room.id}`);
    return buildRoom(rawApartment.id, room, plan);
  });

  if (planByRoomId.size !== rooms.length) {
    throw new Error(`Планировка ${rawApartment.layoutId} содержит лишние или повторяющиеся комнаты`);
  }

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

export const apartments: Apartment[] = rawApartments.map((apartment) => buildApartment(apartment, rawLayouts));

export function getApartmentById(id: string) {
  return apartments.find((apartment) => apartment.id === id);
}

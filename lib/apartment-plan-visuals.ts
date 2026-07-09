import type { Room } from "@/types/apartment";

export type VisualRoom = Room & {
  visualX: number;
  visualY: number;
  visualWidth: number;
  visualHeight: number;
  visualLabelX: number;
  visualLabelY: number;
};

export type VisualBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  centerX: number;
  centerY: number;
};

export type DoorSide = "left" | "right" | "top" | "bottom";

export type VisualDoor = {
  id: string;
  roomId: string;
  side: DoorSide;
  x: number;
  y: number;
  size: number;
  entry?: boolean;
};

export type VisualWindow = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export const FIRST_PLAN_BATCH_IDS = [
  // Первая партия — 10 квартир
  "apt-204",
  "apt-318",
  "apt-112",
  "apt-407",
  "apt-509",
  "apt-621",
  "apt-715",
  "apt-806",
  "apt-233",
  "apt-103",

  // Вторая партия — ещё 10 квартир
  "apt-126",
  "apt-145",
  "apt-219",
  "apt-276",
  "apt-331",
  "apt-384",
  "apt-416",
  "apt-452",
  "apt-518",
  "apt-566",

  // Финальная партия — оставшиеся квартиры
  "apt-604",
  "apt-649",
  "apt-702",
  "apt-748",
  "apt-811",
  "apt-858",
  "apt-930",
  "apt-976",
  "apt-1004"
];

export const PLAN_FRAME = {
  x: 58,
  y: 58,
  width: 670,
  height: 480
};

function rect(room: Room, x: number, y: number, width: number, height: number): VisualRoom {
  return {
    ...room,
    visualX: x,
    visualY: y,
    visualWidth: width,
    visualHeight: height,
    visualLabelX: x + width / 2,
    visualLabelY: y + height / 2
  };
}

export function isHall(room: Room) {
  const name = room.name.toLowerCase();
  return room.type === "hall" || name.includes("прихож") || name.includes("холл");
}

export function isBathroom(room: Room) {
  const name = room.name.toLowerCase();
  return room.type === "bathroom" || name.includes("сануз") || name.includes("ванн");
}

export function isBalcony(room: Room) {
  const name = room.name.toLowerCase();
  return room.type === "balcony" || name.includes("лодж") || name.includes("балкон");
}

export function isStorage(room: Room) {
  const name = room.name.toLowerCase();
  return room.type === "wardrobe" || name.includes("гардер") || name.includes("клад");
}

export function isKitchen(room: Room) {
  const name = room.name.toLowerCase();
  return room.type === "kitchen" || name.includes("кухн");
}

export function isLiving(room: Room) {
  const name = room.name.toLowerCase();
  return room.type === "living" || name.includes("гостин") || name.includes("жилая");
}

export function isBedroom(room: Room) {
  const name = room.name.toLowerCase();
  return room.type === "bedroom" || room.type === "children" || name.includes("спаль") || name.includes("детск");
}

function byAreaDesc(a: Room, b: Room) {
  return b.area - a.area;
}

function parsePolygon(polygon: string) {
  return polygon
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      return { x, y };
    })
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

export function getVisualBounds(room: VisualRoom): VisualBounds {
  const minX = room.visualX;
  const minY = room.visualY;
  const maxX = room.visualX + room.visualWidth;
  const maxY = room.visualY + room.visualHeight;

  return {
    minX,
    minY,
    maxX,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };
}

function getLegacyBounds(room: Room): VisualBounds {
  const points = parsePolygon(room.polygon);
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    minX,
    minY,
    maxX,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };
}

function legacyVisualRoom(room: Room): VisualRoom {
  const bounds = getLegacyBounds(room);
  return rect(room, bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
}

function findFirst(rooms: Room[], predicate: (room: Room) => boolean, used: Set<string>) {
  return rooms.find((room) => !used.has(room.id) && predicate(room));
}

function addRoom(
  result: VisualRoom[],
  used: Set<string>,
  room: Room | undefined,
  x: number,
  y: number,
  width: number,
  height: number
) {
  if (!room || used.has(room.id)) return;
  used.add(room.id);
  result.push(rect(room, x, y, width, height));
}

function makeStudioLayout(rooms: Room[]) {
  const used = new Set<string>();
  const result: VisualRoom[] = [];
  const hall = findFirst(rooms, isHall, used);
  const bathroom = findFirst(rooms, isBathroom, used);
  const balcony = findFirst(rooms, isBalcony, used);
  const kitchen = rooms.find((room) => !used.has(room.id) && isKitchen(room) && !isLiving(room));
  const living = rooms.find((room) => !used.has(room.id) && (isLiving(room) || isBedroom(room)));
  const kitchenLiving = rooms.find((room) => !used.has(room.id) && isKitchen(room) && isLiving(room));

  addRoom(result, used, bathroom, 58, 58, 154, 160);
  addRoom(result, used, hall, 58, 218, 154, 118);

  if (kitchenLiving) {
    addRoom(result, used, kitchenLiving, 212, 58, balcony ? 340 : 516, 210);
    addRoom(result, used, balcony, 552, 58, 176, 210);
    const main = rooms.find((room) => !used.has(room.id) && (isLiving(room) || isBedroom(room)));
    addRoom(result, used, main, 212, 268, 516, 270);
  } else {
    addRoom(result, used, kitchen, 212, 58, balcony ? 250 : 516, 160);
    addRoom(result, used, balcony, 462, 58, 266, 160);
    addRoom(result, used, living, 212, 218, 516, 320);
  }

  const remaining = rooms.filter((room) => !used.has(room.id));
  remaining.forEach((room, index) => addRoom(result, used, room, 58, 336 + index * 68, 154, 68));

  return result;
}

function makeEuroTwoLayout(rooms: Room[]) {
  const used = new Set<string>();
  const result: VisualRoom[] = [];
  const hall = findFirst(rooms, isHall, used);
  const bathroom = findFirst(rooms, isBathroom, used);
  const storage = findFirst(rooms, isStorage, used);
  const balcony = findFirst(rooms, isBalcony, used);
  const kitchenLiving = rooms.find((room) => !used.has(room.id) && isKitchen(room));
  const bedrooms = rooms.filter((room) => isBedroom(room)).sort(byAreaDesc);

  addRoom(result, used, bathroom, 58, 58, 154, 150);
  addRoom(result, used, hall, 58, 208, 154, 130);
  addRoom(result, used, storage, 58, 338, 154, 200);

  addRoom(result, used, kitchenLiving, 212, 58, balcony ? 356 : 516, 190);
  addRoom(result, used, balcony, 568, 58, 160, 190);

  if (bedrooms.length <= 1) {
    addRoom(result, used, bedrooms[0], 212, 248, 516, 290);
  } else {
    addRoom(result, used, bedrooms[0], 212, 248, 258, 290);
    addRoom(result, used, bedrooms[1], 470, 248, 258, 290);
  }

  const remaining = rooms.filter((room) => !used.has(room.id));
  if (remaining.length === 1) {
    addRoom(result, used, remaining[0], 470, 248, 258, 290);
  } else {
    remaining.forEach((room, index) => {
      const w = Math.floor(516 / remaining.length);
      addRoom(result, used, room, 212 + w * index, 248, index === remaining.length - 1 ? 516 - w * index : w, 290);
    });
  }

  return result;
}

function makeThreeRoomLayout(rooms: Room[]) {
  const used = new Set<string>();
  const result: VisualRoom[] = [];
  const hall = findFirst(rooms, isHall, used);
  const bathroom = findFirst(rooms, isBathroom, used);
  const storage = findFirst(rooms, isStorage, used);
  const balcony = findFirst(rooms, isBalcony, used);
  const kitchenLiving = rooms.find((room) => !used.has(room.id) && isKitchen(room));
  const bedrooms = rooms.filter((room) => isBedroom(room)).sort(byAreaDesc);

  addRoom(result, used, bathroom, 58, 58, 154, 146);
  addRoom(result, used, hall, 58, 204, 154, 126);
  addRoom(result, used, storage, 58, 330, 154, 208);

  addRoom(result, used, kitchenLiving, 212, 58, balcony ? 356 : 516, 186);
  addRoom(result, used, balcony, 568, 58, 160, 186);

  addRoom(result, used, bedrooms[0], 212, 244, 172, 294);
  addRoom(result, used, bedrooms[1], 384, 244, 172, 294);
  addRoom(result, used, bedrooms[2], 556, 244, 172, 294);

  const remaining = rooms.filter((room) => !used.has(room.id));
  remaining.forEach((room, index) => addRoom(result, used, room, 212 + index * 172, 398, 172, 140));

  return result;
}

function makeFourRoomLayout(rooms: Room[]) {
  const used = new Set<string>();
  const result: VisualRoom[] = [];
  const hall = findFirst(rooms, isHall, used);
  const bathrooms = rooms.filter(isBathroom).sort(byAreaDesc);
  const storage = findFirst(rooms, isStorage, used);
  const balcony = findFirst(rooms, isBalcony, used);
  const kitchen = rooms.find((room) => !used.has(room.id) && isKitchen(room) && !isLiving(room));
  const living = rooms.find((room) => !used.has(room.id) && isLiving(room) && !isKitchen(room));
  const kitchenLiving = rooms.find((room) => !used.has(room.id) && isKitchen(room) && isLiving(room));
  const bedrooms = rooms.filter((room) => isBedroom(room)).sort(byAreaDesc);

  addRoom(result, used, bathrooms[0], 58, 58, 154, 132);
  addRoom(result, used, bathrooms[1], 58, 190, 154, 110);
  addRoom(result, used, hall, 58, 300, 154, 128);
  addRoom(result, used, storage, 58, 428, 154, 110);

  if (kitchenLiving) {
    addRoom(result, used, kitchenLiving, 212, 58, balcony ? 356 : 516, 160);
  } else {
    addRoom(result, used, kitchen, 212, 58, 250, 160);
    addRoom(result, used, living, 462, 58, balcony ? 106 : 266, 160);
  }

  addRoom(result, used, balcony, 568, 58, 160, 160);

  addRoom(result, used, bedrooms[0], 212, 218, 172, 160);
  addRoom(result, used, bedrooms[1], 384, 218, 172, 160);
  addRoom(result, used, bedrooms[2], 556, 218, 172, 160);
  addRoom(result, used, bedrooms[3], 212, 378, 258, 160);

  const remaining = rooms.filter((room) => !used.has(room.id));
  if (remaining.length === 1) {
    addRoom(result, used, remaining[0], 470, 378, 258, 160);
  } else {
    remaining.forEach((room, index) => addRoom(result, used, room, 470 + index * 129, 378, 129, 160));
  }

  return result;
}

function qualityLayout(apartmentId: string | undefined, rooms: Room[]): VisualRoom[] {
  // Финальный этап: качественный генератор теперь работает для всех квартир.
  // apartmentId оставлен в сигнатуре, чтобы не ломать вызовы и чтобы потом можно было делать точечные схемы.
  void apartmentId;

  const bedrooms = rooms.filter(isBedroom);
  const hasSeparateLiving = rooms.some((room) => isLiving(room) && !isKitchen(room));
  const hasSeparateKitchen = rooms.some((room) => isKitchen(room) && !isLiving(room));

  if (bedrooms.length >= 4 || rooms.length >= 9) return makeFourRoomLayout(rooms);
  if (bedrooms.length >= 3 || rooms.length >= 7) return makeThreeRoomLayout(rooms);
  if (bedrooms.length >= 2) return makeEuroTwoLayout(rooms);
  if (hasSeparateLiving && hasSeparateKitchen) return makeStudioLayout(rooms);
  if (bedrooms.length <= 1 && rooms.length <= 5) return makeStudioLayout(rooms);
  return makeEuroTwoLayout(rooms);
}

export function getApartmentVisualRooms(apartmentId: string | undefined, rooms: Room[]) {
  const visualRooms = qualityLayout(apartmentId, rooms);
  const used = new Set(visualRooms.map((room) => room.id));

  const missing = rooms
    .filter((room) => !used.has(room.id))
    .map((room, index) => rect(room, 58 + index * 120, 438, 120, 100));

  return [...visualRooms, ...missing];
}

export function roomFill(room: Room) {
  if (isKitchen(room) || isLiving(room)) return "#eef5fb";
  if (isBedroom(room)) return "#eef8ef";
  if (isBathroom(room)) return "#eef3fa";
  if (isHall(room)) return "#fff6e8";
  if (isBalcony(room)) return "#f2f7ff";
  if (isStorage(room)) return "#f7f1ff";
  return "#ffffff";
}

export function getPlanBounds(visualRooms: VisualRoom[]): VisualBounds {
  const minX = Math.min(...visualRooms.map((room) => room.visualX));
  const minY = Math.min(...visualRooms.map((room) => room.visualY));
  const maxX = Math.max(...visualRooms.map((room) => room.visualX + room.visualWidth));
  const maxY = Math.max(...visualRooms.map((room) => room.visualY + room.visualHeight));

  return {
    minX,
    minY,
    maxX,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };
}

function overlap(aMin: number, aMax: number, bMin: number, bMax: number) {
  const min = Math.max(aMin, bMin);
  const max = Math.min(aMax, bMax);
  return { size: Math.max(0, max - min), center: (min + max) / 2 };
}

function touching(a: number, b: number) {
  return Math.abs(a - b) <= 2;
}

function doorBetween(room: VisualRoom, neighbor: VisualRoom, size = 46): Omit<VisualDoor, "id" | "roomId"> | null {
  const a = getVisualBounds(room);
  const b = getVisualBounds(neighbor);
  const vertical = overlap(a.minY, a.maxY, b.minY, b.maxY);
  const horizontal = overlap(a.minX, a.maxX, b.minX, b.maxX);

  if (touching(a.minX, b.maxX) && vertical.size >= 34) {
    return { side: "left", x: a.minX, y: clamp(vertical.center, a.minY + 28, a.maxY - 28), size: clamp(size, 34, vertical.size - 18) };
  }

  if (touching(a.maxX, b.minX) && vertical.size >= 34) {
    return { side: "right", x: a.maxX, y: clamp(vertical.center, a.minY + 28, a.maxY - 28), size: clamp(size, 34, vertical.size - 18) };
  }

  if (touching(a.minY, b.maxY) && horizontal.size >= 34) {
    return { side: "top", x: clamp(horizontal.center, a.minX + 28, a.maxX - 28), y: a.minY, size: clamp(size, 34, horizontal.size - 18) };
  }

  if (touching(a.maxY, b.minY) && horizontal.size >= 34) {
    return { side: "bottom", x: clamp(horizontal.center, a.minX + 28, a.maxX - 28), y: a.maxY, size: clamp(size, 34, horizontal.size - 18) };
  }

  return null;
}

export function getVisualDoors(visualRooms: VisualRoom[]) {
  const doors: VisualDoor[] = [];
  const hall = visualRooms.find(isHall);
  const bounds = getPlanBounds(visualRooms);

  if (hall) {
    const hallBounds = getVisualBounds(hall);

    doors.push({
      id: `${hall.id}-entry`,
      roomId: hall.id,
      entry: true,
      side: "left",
      x: bounds.minX,
      y: hallBounds.centerY,
      size: 50
    });

    for (const room of visualRooms) {
      if (room.id === hall.id || isBalcony(room)) continue;
      const door = doorBetween(room, hall, isKitchen(room) || isLiving(room) ? 54 : 44);
      if (!door) continue;

      doors.push({
        id: `${room.id}-to-hall`,
        roomId: room.id,
        ...door
      });
    }
  }

  for (const balcony of visualRooms.filter(isBalcony)) {
    const neighbor = visualRooms
      .filter((room) => room.id !== balcony.id)
      .map((room) => ({ room, door: doorBetween(balcony, room, 58) }))
      .filter((item): item is { room: VisualRoom; door: Omit<VisualDoor, "id" | "roomId"> } => Boolean(item.door))
      .sort((a, b) => {
        const scoreA = isKitchen(a.room) || isLiving(a.room) ? 3 : isBedroom(a.room) ? 2 : 1;
        const scoreB = isKitchen(b.room) || isLiving(b.room) ? 3 : isBedroom(b.room) ? 2 : 1;
        return scoreB - scoreA;
      })[0];

    if (neighbor) {
      doors.push({
        id: `${balcony.id}-door`,
        roomId: balcony.id,
        ...neighbor.door
      });
    }
  }

  return doors;
}

export function getVisualWindows(visualRooms: VisualRoom[]) {
  const windows: VisualWindow[] = [];
  const bounds = getPlanBounds(visualRooms);

  for (const room of visualRooms) {
    if (isHall(room) || isBathroom(room) || isStorage(room)) continue;

    const roomBounds = getVisualBounds(room);
    const horizontalSize = clamp(room.visualWidth * 0.42, 48, 118);
    const verticalSize = clamp(room.visualHeight * 0.42, 48, 118);

    if (touching(roomBounds.minY, bounds.minY)) {
      windows.push({ id: `${room.id}-window-top`, x1: roomBounds.centerX - horizontalSize / 2, y1: roomBounds.minY, x2: roomBounds.centerX + horizontalSize / 2, y2: roomBounds.minY });
    } else if (touching(roomBounds.maxY, bounds.maxY)) {
      windows.push({ id: `${room.id}-window-bottom`, x1: roomBounds.centerX - horizontalSize / 2, y1: roomBounds.maxY, x2: roomBounds.centerX + horizontalSize / 2, y2: roomBounds.maxY });
    } else if (touching(roomBounds.maxX, bounds.maxX)) {
      windows.push({ id: `${room.id}-window-right`, x1: roomBounds.maxX, y1: roomBounds.centerY - verticalSize / 2, x2: roomBounds.maxX, y2: roomBounds.centerY + verticalSize / 2 });
    }
  }

  return windows;
}

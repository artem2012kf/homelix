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

export const PLAN_FRAME = {
  x: 58,
  y: 58,
  width: 670,
  height: 480
};

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function hashId(apartmentId: string | undefined) {
  const text = apartmentId || "default";
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function getVariant(apartmentId: string | undefined, count: number) {
  return hashId(apartmentId) % count;
}

function rect(room: Room, x: number, y: number, width: number, height: number): VisualRoom {
  return {
    ...room,
    visualX: Math.round(x),
    visualY: Math.round(y),
    visualWidth: Math.round(width),
    visualHeight: Math.round(height),
    visualLabelX: Math.round(x + width / 2),
    visualLabelY: Math.round(y + height / 2)
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

function fillRemaining(result: VisualRoom[], used: Set<string>, rooms: Room[]) {
  const remaining = rooms.filter((room) => !used.has(room.id));
  if (remaining.length === 0) return;

  const slotWidth = PLAN_FRAME.width / remaining.length;
  remaining.forEach((room, index) => {
    addRoom(
      result,
      used,
      room,
      PLAN_FRAME.x + slotWidth * index,
      PLAN_FRAME.y + PLAN_FRAME.height - 112,
      index === remaining.length - 1 ? PLAN_FRAME.width - slotWidth * index : slotWidth,
      112
    );
  });
}

function makeStudioLayout(apartmentId: string | undefined, rooms: Room[]) {
  const variant = getVariant(apartmentId, 5);
  const used = new Set<string>();
  const result: VisualRoom[] = [];

  const hall = findFirst(rooms, isHall, used);
  const bathroom = findFirst(rooms, isBathroom, used);
  const balcony = findFirst(rooms, isBalcony, used);
  const kitchen = rooms.find((room) => !used.has(room.id) && isKitchen(room) && !isLiving(room));
  const living = rooms.find((room) => !used.has(room.id) && (isLiving(room) || isBedroom(room)));
  const kitchenLiving = rooms.find((room) => !used.has(room.id) && isKitchen(room) && isLiving(room));

  if (variant === 0) {
    addRoom(result, used, bathroom, 58, 58, 154, 160);
    addRoom(result, used, hall, 58, 218, 154, 126);
    addRoom(result, used, kitchenLiving ?? kitchen, 212, 58, balcony ? 340 : 516, 190);
    addRoom(result, used, balcony, 552, 58, 176, 190);
    addRoom(result, used, living, 212, 248, 516, 290);
  } else if (variant === 1) {
    addRoom(result, used, hall, 58, 58, 156, 136);
    addRoom(result, used, bathroom, 58, 194, 156, 166);
    addRoom(result, used, kitchenLiving ?? kitchen, 214, 58, 300, 170);
    addRoom(result, used, balcony, 514, 58, 214, 170);
    addRoom(result, used, living, 214, 228, 514, 310);
  } else if (variant === 2) {
    addRoom(result, used, bathroom, 58, 58, 166, 150);
    addRoom(result, used, hall, 224, 58, 150, 150);
    addRoom(result, used, kitchenLiving ?? kitchen, 374, 58, 354, 150);
    addRoom(result, used, living, 58, 208, 500, 330);
    addRoom(result, used, balcony, 558, 208, 170, 330);
  } else if (variant === 3) {
    addRoom(result, used, bathroom, 58, 58, 150, 160);
    addRoom(result, used, kitchenLiving ?? kitchen, 208, 58, 270, 160);
    addRoom(result, used, balcony, 478, 58, 250, 160);
    addRoom(result, used, hall, 58, 218, 150, 120);
    addRoom(result, used, living, 208, 218, 520, 320);
  } else {
    addRoom(result, used, hall, 58, 58, 150, 120);
    addRoom(result, used, bathroom, 58, 178, 150, 170);
    addRoom(result, used, kitchenLiving ?? kitchen, 208, 58, 520, 150);
    addRoom(result, used, living, 208, 208, balcony ? 350 : 520, 330);
    addRoom(result, used, balcony, 558, 208, 170, 330);
  }

  fillRemaining(result, used, rooms);
  return result;
}

function makeEuroTwoLayout(apartmentId: string | undefined, rooms: Room[]) {
  const variant = getVariant(apartmentId, 6);
  const used = new Set<string>();
  const result: VisualRoom[] = [];

  const hall = findFirst(rooms, isHall, used);
  const bathroom = findFirst(rooms, isBathroom, used);
  const storage = findFirst(rooms, isStorage, used);
  const balcony = findFirst(rooms, isBalcony, used);
  const kitchenLiving = rooms.find((room) => !used.has(room.id) && isKitchen(room));
  const bedrooms = rooms.filter((room) => isBedroom(room)).sort(byAreaDesc);

  if (variant === 0) {
    addRoom(result, used, bathroom, 58, 58, 154, 150);
    addRoom(result, used, hall, 58, 208, 154, 130);
    addRoom(result, used, storage, 58, 338, 154, 200);
    addRoom(result, used, kitchenLiving, 212, 58, balcony ? 356 : 516, 190);
    addRoom(result, used, balcony, 568, 58, 160, 190);
    addRoom(result, used, bedrooms[0], 212, 248, 516, 290);
  } else if (variant === 1) {
    addRoom(result, used, hall, 58, 58, 166, 144);
    addRoom(result, used, bathroom, 58, 202, 166, 156);
    addRoom(result, used, storage, 58, 358, 166, 180);
    addRoom(result, used, kitchenLiving, 224, 58, 504, 230);
    addRoom(result, used, bedrooms[0], 224, 288, balcony ? 330 : 504, 250);
    addRoom(result, used, balcony, 554, 288, 174, 250);
  } else if (variant === 2) {
    addRoom(result, used, bathroom, 58, 58, 154, 152);
    addRoom(result, used, kitchenLiving, 212, 58, 350, 206);
    addRoom(result, used, balcony, 562, 58, 166, 206);
    addRoom(result, used, hall, 58, 210, 154, 150);
    addRoom(result, used, bedrooms[0], 212, 264, 516, 274);
    addRoom(result, used, storage, 58, 360, 154, 178);
  } else if (variant === 3) {
    addRoom(result, used, hall, 58, 58, 190, 130);
    addRoom(result, used, kitchenLiving, 248, 58, 480, 210);
    addRoom(result, used, bathroom, 58, 188, 190, 150);
    addRoom(result, used, bedrooms[0], 248, 268, 330, 270);
    addRoom(result, used, balcony, 578, 268, 150, 270);
    addRoom(result, used, storage, 58, 338, 190, 200);
  } else if (variant === 4) {
    addRoom(result, used, bathroom, 58, 58, 160, 150);
    addRoom(result, used, hall, 218, 58, 160, 150);
    addRoom(result, used, kitchenLiving, 378, 58, 350, 210);
    addRoom(result, used, bedrooms[0], 58, 208, 500, 330);
    addRoom(result, used, balcony, 558, 268, 170, 270);
    addRoom(result, used, storage, 558, 208, 170, 60);
  } else {
    addRoom(result, used, kitchenLiving, 58, 58, 430, 200);
    addRoom(result, used, balcony, 488, 58, 240, 200);
    addRoom(result, used, hall, 58, 258, 160, 130);
    addRoom(result, used, bathroom, 58, 388, 160, 150);
    addRoom(result, used, bedrooms[0], 218, 258, 510, 280);
    addRoom(result, used, storage, 58, 388, 160, 150);
  }

  const unplacedBedrooms = bedrooms.filter((room) => !used.has(room.id));
  if (unplacedBedrooms.length === 1) {
    addRoom(result, used, unplacedBedrooms[0], 470, 248, 258, 290);
  }

  fillRemaining(result, used, rooms);
  return result;
}

function makeTwoBedroomLayout(apartmentId: string | undefined, rooms: Room[]) {
  const variant = getVariant(apartmentId, 5);
  const used = new Set<string>();
  const result: VisualRoom[] = [];

  const hall = findFirst(rooms, isHall, used);
  const bathroom = findFirst(rooms, isBathroom, used);
  const storage = findFirst(rooms, isStorage, used);
  const balcony = findFirst(rooms, isBalcony, used);
  const kitchenLiving = rooms.find((room) => !used.has(room.id) && isKitchen(room));
  const bedrooms = rooms.filter((room) => isBedroom(room)).sort(byAreaDesc);

  if (variant === 0) {
    addRoom(result, used, bathroom, 58, 58, 154, 146);
    addRoom(result, used, hall, 58, 204, 154, 126);
    addRoom(result, used, storage, 58, 330, 154, 208);
    addRoom(result, used, kitchenLiving, 212, 58, balcony ? 356 : 516, 186);
    addRoom(result, used, balcony, 568, 58, 160, 186);
    addRoom(result, used, bedrooms[0], 212, 244, 258, 294);
    addRoom(result, used, bedrooms[1], 470, 244, 258, 294);
  } else if (variant === 1) {
    addRoom(result, used, hall, 58, 58, 176, 140);
    addRoom(result, used, bathroom, 58, 198, 176, 150);
    addRoom(result, used, storage, 58, 348, 176, 190);
    addRoom(result, used, kitchenLiving, 234, 58, 494, 200);
    addRoom(result, used, bedrooms[0], 234, 258, 247, 280);
    addRoom(result, used, bedrooms[1], 481, 258, 247, 280);
    addRoom(result, used, balcony, 558, 58, 170, 200);
  } else if (variant === 2) {
    addRoom(result, used, bathroom, 58, 58, 160, 152);
    addRoom(result, used, hall, 58, 210, 160, 150);
    addRoom(result, used, kitchenLiving, 218, 58, 340, 210);
    addRoom(result, used, balcony, 558, 58, 170, 210);
    addRoom(result, used, bedrooms[0], 218, 268, 255, 270);
    addRoom(result, used, bedrooms[1], 473, 268, 255, 270);
    addRoom(result, used, storage, 58, 360, 160, 178);
  } else if (variant === 3) {
    addRoom(result, used, kitchenLiving, 58, 58, 430, 190);
    addRoom(result, used, balcony, 488, 58, 240, 190);
    addRoom(result, used, hall, 58, 248, 170, 138);
    addRoom(result, used, bathroom, 58, 386, 170, 152);
    addRoom(result, used, bedrooms[0], 228, 248, 250, 290);
    addRoom(result, used, bedrooms[1], 478, 248, 250, 290);
    addRoom(result, used, storage, 58, 386, 170, 152);
  } else {
    addRoom(result, used, bathroom, 58, 58, 150, 150);
    addRoom(result, used, hall, 208, 58, 150, 150);
    addRoom(result, used, kitchenLiving, 358, 58, 370, 190);
    addRoom(result, used, bedrooms[0], 58, 208, 335, 330);
    addRoom(result, used, bedrooms[1], 393, 248, 335, 290);
    addRoom(result, used, balcony, 558, 58, 170, 190);
    addRoom(result, used, storage, 393, 208, 165, 40);
  }

  fillRemaining(result, used, rooms);
  return result;
}

function makeThreeBedroomLayout(apartmentId: string | undefined, rooms: Room[]) {
  const variant = getVariant(apartmentId, 5);
  const used = new Set<string>();
  const result: VisualRoom[] = [];

  const hall = findFirst(rooms, isHall, used);
  const bathroom = findFirst(rooms, isBathroom, used);
  const storage = findFirst(rooms, isStorage, used);
  const balcony = findFirst(rooms, isBalcony, used);
  const kitchenLiving = rooms.find((room) => !used.has(room.id) && isKitchen(room));
  const bedrooms = rooms.filter((room) => isBedroom(room)).sort(byAreaDesc);

  if (variant === 0) {
    addRoom(result, used, bathroom, 58, 58, 154, 146);
    addRoom(result, used, hall, 58, 204, 154, 126);
    addRoom(result, used, storage, 58, 330, 154, 208);
    addRoom(result, used, kitchenLiving, 212, 58, balcony ? 356 : 516, 186);
    addRoom(result, used, balcony, 568, 58, 160, 186);
    addRoom(result, used, bedrooms[0], 212, 244, 172, 294);
    addRoom(result, used, bedrooms[1], 384, 244, 172, 294);
    addRoom(result, used, bedrooms[2], 556, 244, 172, 294);
  } else if (variant === 1) {
    addRoom(result, used, hall, 58, 58, 170, 138);
    addRoom(result, used, bathroom, 58, 196, 170, 152);
    addRoom(result, used, storage, 58, 348, 170, 190);
    addRoom(result, used, kitchenLiving, 228, 58, 500, 182);
    addRoom(result, used, bedrooms[0], 228, 240, 250, 298);
    addRoom(result, used, bedrooms[1], 478, 240, 250, 150);
    addRoom(result, used, bedrooms[2], 478, 390, 250, 148);
    addRoom(result, used, balcony, 578, 58, 150, 182);
  } else if (variant === 2) {
    addRoom(result, used, kitchenLiving, 58, 58, 420, 190);
    addRoom(result, used, balcony, 478, 58, 250, 190);
    addRoom(result, used, hall, 58, 248, 160, 130);
    addRoom(result, used, bathroom, 58, 378, 160, 160);
    addRoom(result, used, bedrooms[0], 218, 248, 255, 290);
    addRoom(result, used, bedrooms[1], 473, 248, 255, 145);
    addRoom(result, used, bedrooms[2], 473, 393, 255, 145);
    addRoom(result, used, storage, 58, 378, 160, 160);
  } else if (variant === 3) {
    addRoom(result, used, bathroom, 58, 58, 150, 150);
    addRoom(result, used, hall, 208, 58, 150, 150);
    addRoom(result, used, kitchenLiving, 358, 58, 370, 180);
    addRoom(result, used, bedrooms[0], 58, 208, 223, 330);
    addRoom(result, used, bedrooms[1], 281, 238, 223, 300);
    addRoom(result, used, bedrooms[2], 504, 238, 224, 300);
    addRoom(result, used, balcony, 558, 58, 170, 180);
    addRoom(result, used, storage, 358, 238, 146, 70);
  } else {
    addRoom(result, used, hall, 58, 58, 172, 150);
    addRoom(result, used, bathroom, 230, 58, 150, 150);
    addRoom(result, used, kitchenLiving, 380, 58, 348, 220);
    addRoom(result, used, bedrooms[0], 58, 208, 320, 330);
    addRoom(result, used, bedrooms[1], 378, 278, 175, 260);
    addRoom(result, used, bedrooms[2], 553, 278, 175, 260);
    addRoom(result, used, balcony, 558, 58, 170, 220);
    addRoom(result, used, storage, 230, 208, 148, 80);
  }

  fillRemaining(result, used, rooms);
  return result;
}

function makeFourBedroomLayout(apartmentId: string | undefined, rooms: Room[]) {
  const variant = getVariant(apartmentId, 4);
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

  if (variant === 0) {
    addRoom(result, used, bathrooms[0], 58, 58, 154, 132);
    addRoom(result, used, bathrooms[1], 58, 190, 154, 110);
    addRoom(result, used, hall, 58, 300, 154, 128);
    addRoom(result, used, storage, 58, 428, 154, 110);
    addRoom(result, used, kitchenLiving ?? kitchen, 212, 58, 250, 160);
    addRoom(result, used, living, 462, 58, balcony ? 106 : 266, 160);
    addRoom(result, used, balcony, 568, 58, 160, 160);
    addRoom(result, used, bedrooms[0], 212, 218, 172, 160);
    addRoom(result, used, bedrooms[1], 384, 218, 172, 160);
    addRoom(result, used, bedrooms[2], 556, 218, 172, 160);
    addRoom(result, used, bedrooms[3], 212, 378, 258, 160);
  } else if (variant === 1) {
    addRoom(result, used, hall, 58, 58, 170, 138);
    addRoom(result, used, bathrooms[0], 58, 196, 170, 138);
    addRoom(result, used, bathrooms[1], 58, 334, 170, 100);
    addRoom(result, used, storage, 58, 434, 170, 104);
    addRoom(result, used, kitchenLiving ?? kitchen, 228, 58, 260, 180);
    addRoom(result, used, living, 488, 58, 240, 180);
    addRoom(result, used, bedrooms[0], 228, 238, 250, 150);
    addRoom(result, used, bedrooms[1], 478, 238, 250, 150);
    addRoom(result, used, bedrooms[2], 228, 388, 250, 150);
    addRoom(result, used, bedrooms[3], 478, 388, 250, 150);
    addRoom(result, used, balcony, 608, 58, 120, 180);
  } else if (variant === 2) {
    addRoom(result, used, kitchenLiving ?? kitchen, 58, 58, 330, 170);
    addRoom(result, used, living, 388, 58, 240, 170);
    addRoom(result, used, balcony, 628, 58, 100, 170);
    addRoom(result, used, hall, 58, 228, 170, 130);
    addRoom(result, used, bathrooms[0], 58, 358, 170, 90);
    addRoom(result, used, bathrooms[1], 58, 448, 170, 90);
    addRoom(result, used, bedrooms[0], 228, 228, 166, 310);
    addRoom(result, used, bedrooms[1], 394, 228, 166, 155);
    addRoom(result, used, bedrooms[2], 560, 228, 168, 155);
    addRoom(result, used, bedrooms[3], 394, 383, 334, 155);
    addRoom(result, used, storage, 58, 448, 170, 90);
  } else {
    addRoom(result, used, bathrooms[0], 58, 58, 150, 125);
    addRoom(result, used, hall, 208, 58, 150, 125);
    addRoom(result, used, bathrooms[1], 58, 183, 150, 115);
    addRoom(result, used, storage, 208, 183, 150, 115);
    addRoom(result, used, kitchenLiving ?? kitchen, 358, 58, 370, 160);
    addRoom(result, used, living, 358, 218, 185, 160);
    addRoom(result, used, balcony, 543, 218, 185, 160);
    addRoom(result, used, bedrooms[0], 58, 298, 225, 240);
    addRoom(result, used, bedrooms[1], 283, 378, 148, 160);
    addRoom(result, used, bedrooms[2], 431, 378, 148, 160);
    addRoom(result, used, bedrooms[3], 579, 378, 149, 160);
  }

  fillRemaining(result, used, rooms);
  return result;
}

function qualityLayout(apartmentId: string | undefined, rooms: Room[]): VisualRoom[] {
  const bedrooms = rooms.filter(isBedroom);
  const hasSeparateLiving = rooms.some((room) => isLiving(room) && !isKitchen(room));
  const hasSeparateKitchen = rooms.some((room) => isKitchen(room) && !isLiving(room));

  if (bedrooms.length >= 4 || rooms.length >= 9) return makeFourBedroomLayout(apartmentId, rooms);
  if (bedrooms.length >= 3 || rooms.length >= 7) return makeThreeBedroomLayout(apartmentId, rooms);
  if (bedrooms.length >= 2) return makeTwoBedroomLayout(apartmentId, rooms);
  if (hasSeparateLiving && hasSeparateKitchen) return makeStudioLayout(apartmentId, rooms);
  if (bedrooms.length <= 1 && rooms.length <= 5) return makeStudioLayout(apartmentId, rooms);
  return makeEuroTwoLayout(apartmentId, rooms);
}

export function getApartmentVisualRooms(apartmentId: string | undefined, rooms: Room[]) {
  return qualityLayout(apartmentId, rooms);
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

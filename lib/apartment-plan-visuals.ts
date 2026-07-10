import type { Room, RoomPlan } from "@/types/apartment";

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
} as const;

const WALL_EPSILON = 2;
const MIN_DOOR_OVERLAP = 42;
const DEFAULT_DOOR_SIZE = 46;

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function normalizedName(room: Room) {
  return room.name.toLowerCase().replace(/ё/g, "е");
}

export function isHall(room: Room) {
  const name = normalizedName(room);
  return room.type === "hall" || name.includes("прихож") || name.includes("холл") || name.includes("коридор");
}

export function isBathroom(room: Room) {
  const name = normalizedName(room);
  return room.type === "bathroom" || name.includes("сануз") || name.includes("ванн") || name.includes("душев");
}

export function isBalcony(room: Room) {
  const name = normalizedName(room);
  return room.type === "balcony" || name.includes("лодж") || name.includes("балкон") || name.includes("террас");
}

export function isStorage(room: Room) {
  const name = normalizedName(room);
  return room.type === "wardrobe" || name.includes("гардер") || name.includes("клад") || name.includes("постироч") || name.includes("шкаф-ниша");
}

export function isKitchen(room: Room) {
  return room.type === "kitchen" || normalizedName(room).includes("кухн");
}

export function isLiving(room: Room) {
  const name = normalizedName(room);
  return room.type === "living" || name.includes("гостин") || name.includes("жилая");
}

export function isBedroom(room: Room) {
  const name = normalizedName(room);
  return room.type === "bedroom" || room.type === "children" || name.includes("спаль") || name.includes("детск") || name.includes("кабинет");
}

function visualRoom(room: Room, plan: RoomPlan): VisualRoom {
  const x = Math.round(plan.x);
  const y = Math.round(plan.y);
  const width = Math.max(1, Math.round(plan.width));
  const height = Math.max(1, Math.round(plan.height));

  return {
    ...room,
    visualX: x,
    visualY: y,
    visualWidth: width,
    visualHeight: height,
    visualLabelX: Math.round(x + width / 2),
    visualLabelY: Math.round(y + height / 2)
  };
}

function fallbackPlan(rooms: Room[]) {
  const columns = Math.max(1, Math.ceil(Math.sqrt(rooms.length)));
  const rows = Math.max(1, Math.ceil(rooms.length / columns));
  const cellWidth = PLAN_FRAME.width / columns;
  const cellHeight = PLAN_FRAME.height / rows;

  return rooms.map((room, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const isLastColumn = column === columns - 1;
    const isLastRow = row === rows - 1;

    return visualRoom(room, {
      x: PLAN_FRAME.x + column * cellWidth,
      y: PLAN_FRAME.y + row * cellHeight,
      width: isLastColumn ? PLAN_FRAME.width - column * cellWidth : cellWidth,
      height: isLastRow ? PLAN_FRAME.height - row * cellHeight : cellHeight
    });
  });
}

export function getApartmentVisualRooms(_apartmentId: string | undefined, rooms: Room[]) {
  if (rooms.length === 0) return [];
  if (rooms.every((room) => room.plan)) {
    return rooms.map((room) => visualRoom(room, room.plan as RoomPlan));
  }

  return fallbackPlan(rooms);
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
  if (visualRooms.length === 0) {
    return {
      minX: PLAN_FRAME.x,
      minY: PLAN_FRAME.y,
      maxX: PLAN_FRAME.x + PLAN_FRAME.width,
      maxY: PLAN_FRAME.y + PLAN_FRAME.height,
      centerX: PLAN_FRAME.x + PLAN_FRAME.width / 2,
      centerY: PLAN_FRAME.y + PLAN_FRAME.height / 2
    };
  }

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
  return Math.abs(a - b) <= WALL_EPSILON;
}

function doorBetween(room: VisualRoom, neighbor: VisualRoom, size = DEFAULT_DOOR_SIZE): Omit<VisualDoor, "id" | "roomId"> | null {
  const a = getVisualBounds(room);
  const b = getVisualBounds(neighbor);
  const vertical = overlap(a.minY, a.maxY, b.minY, b.maxY);
  const horizontal = overlap(a.minX, a.maxX, b.minX, b.maxX);

  if (touching(a.minX, b.maxX) && vertical.size >= MIN_DOOR_OVERLAP) {
    return { side: "left", x: a.minX, y: clamp(vertical.center, a.minY + 28, a.maxY - 28), size: clamp(size, 34, vertical.size - 16) };
  }

  if (touching(a.maxX, b.minX) && vertical.size >= MIN_DOOR_OVERLAP) {
    return { side: "right", x: a.maxX, y: clamp(vertical.center, a.minY + 28, a.maxY - 28), size: clamp(size, 34, vertical.size - 16) };
  }

  if (touching(a.minY, b.maxY) && horizontal.size >= MIN_DOOR_OVERLAP) {
    return { side: "top", x: clamp(horizontal.center, a.minX + 28, a.maxX - 28), y: a.minY, size: clamp(size, 34, horizontal.size - 16) };
  }

  if (touching(a.maxY, b.minY) && horizontal.size >= MIN_DOOR_OVERLAP) {
    return { side: "bottom", x: clamp(horizontal.center, a.minX + 28, a.maxX - 28), y: a.maxY, size: clamp(size, 34, horizontal.size - 16) };
  }

  return null;
}

function entryDoor(hall: VisualRoom, bounds: VisualBounds): VisualDoor {
  const hallBounds = getVisualBounds(hall);
  const candidates = [
    { side: "left" as const, distance: Math.abs(hallBounds.minX - bounds.minX), x: hallBounds.minX, y: hallBounds.centerY },
    { side: "right" as const, distance: Math.abs(hallBounds.maxX - bounds.maxX), x: hallBounds.maxX, y: hallBounds.centerY },
    { side: "top" as const, distance: Math.abs(hallBounds.minY - bounds.minY), x: hallBounds.centerX, y: hallBounds.minY },
    { side: "bottom" as const, distance: Math.abs(hallBounds.maxY - bounds.maxY), x: hallBounds.centerX, y: hallBounds.maxY }
  ].sort((a, b) => a.distance - b.distance);
  const nearest = candidates[0];

  return {
    id: `${hall.id}-entry`,
    roomId: hall.id,
    entry: true,
    side: nearest.side,
    x: nearest.x,
    y: nearest.y,
    size: 50
  };
}

function neighborScore(neighbor: VisualRoom) {
  if (isHall(neighbor)) return 100;
  if (isKitchen(neighbor) || isLiving(neighbor)) return 70;
  if (isBedroom(neighbor)) return 45;
  if (isStorage(neighbor)) return 30;
  if (isBathroom(neighbor)) return 15;
  return 20 + Math.min(neighbor.area, 20);
}

export function getVisualDoors(visualRooms: VisualRoom[]) {
  if (visualRooms.length === 0) return [];

  const doors: VisualDoor[] = [];
  const bounds = getPlanBounds(visualRooms);
  const hall = visualRooms.find(isHall);

  if (hall) doors.push(entryDoor(hall, bounds));

  for (const room of visualRooms) {
    if (room.id === hall?.id || isBalcony(room)) continue;

    const neighbor = visualRooms
      .filter((candidate) => candidate.id !== room.id && !isBalcony(candidate))
      .map((candidate) => ({
        candidate,
        door: doorBetween(room, candidate, isKitchen(room) || isLiving(room) ? 54 : DEFAULT_DOOR_SIZE)
      }))
      .filter((item): item is { candidate: VisualRoom; door: Omit<VisualDoor, "id" | "roomId"> } => Boolean(item.door))
      .sort((a, b) => neighborScore(b.candidate) - neighborScore(a.candidate))[0];

    if (neighbor) {
      doors.push({
        id: `${room.id}-door`,
        roomId: room.id,
        ...neighbor.door
      });
    }
  }

  for (const balcony of visualRooms.filter(isBalcony)) {
    const neighbor = visualRooms
      .filter((candidate) => candidate.id !== balcony.id)
      .map((candidate) => ({ candidate, door: doorBetween(balcony, candidate, 58) }))
      .filter((item): item is { candidate: VisualRoom; door: Omit<VisualDoor, "id" | "roomId"> } => Boolean(item.door))
      .sort((a, b) => neighborScore(b.candidate) - neighborScore(a.candidate))[0];

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
  if (visualRooms.length === 0) return [];

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
    } else if (touching(roomBounds.minX, bounds.minX)) {
      windows.push({ id: `${room.id}-window-left`, x1: roomBounds.minX, y1: roomBounds.centerY - verticalSize / 2, x2: roomBounds.minX, y2: roomBounds.centerY + verticalSize / 2 });
    } else if (touching(roomBounds.maxX, bounds.maxX)) {
      windows.push({ id: `${room.id}-window-right`, x1: roomBounds.maxX, y1: roomBounds.centerY - verticalSize / 2, x2: roomBounds.maxX, y2: roomBounds.centerY + verticalSize / 2 });
    }
  }

  return windows;
}

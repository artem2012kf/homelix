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

type LayoutRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type RoomGroup = {
  room: Room;
  weight: number;
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
  return room.type === "wardrobe" || name.includes("гардер") || name.includes("клад") || name.includes("постироч");
}

export function isKitchen(room: Room) {
  const name = normalizedName(room);
  return room.type === "kitchen" || name.includes("кухн");
}

export function isLiving(room: Room) {
  const name = normalizedName(room);
  return room.type === "living" || name.includes("гостин") || name.includes("жилая");
}

export function isBedroom(room: Room) {
  const name = normalizedName(room);
  return room.type === "bedroom" || room.type === "children" || name.includes("спаль") || name.includes("детск");
}

function isServiceRoom(room: Room) {
  return isHall(room) || isBathroom(room) || isStorage(room);
}

function roomWeight(room: Room) {
  return Math.max(room.area, 2.5);
}

function rect(room: Room, area: LayoutRect): VisualRoom {
  const x = Math.round(area.x);
  const y = Math.round(area.y);
  const width = Math.max(1, Math.round(area.width));
  const height = Math.max(1, Math.round(area.height));

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

function hashId(apartmentId: string | undefined) {
  const value = apartmentId || "default";
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function totalWeight(items: RoomGroup[]) {
  return items.reduce((sum, item) => sum + item.weight, 0);
}

function balancedSplit(items: RoomGroup[]): [RoomGroup[], RoomGroup[]] {
  if (items.length <= 1) return [items, []];

  const total = totalWeight(items);
  let running = 0;
  let splitIndex = 1;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let index = 1; index < items.length; index += 1) {
    running += items[index - 1].weight;
    const distance = Math.abs(total / 2 - running);
    if (distance < bestDistance) {
      bestDistance = distance;
      splitIndex = index;
    }
  }

  return [items.slice(0, splitIndex), items.slice(splitIndex)];
}

function weightedLayout(items: RoomGroup[], area: LayoutRect, depth = 0): VisualRoom[] {
  if (items.length === 0) return [];
  if (items.length === 1) return [rect(items[0].room, area)];

  const sorted = [...items].sort((a, b) => b.weight - a.weight || a.room.id.localeCompare(b.room.id));
  const [first, second] = balancedSplit(sorted);
  const firstWeight = totalWeight(first);
  const ratio = firstWeight / Math.max(totalWeight(sorted), 1);
  const splitVertically = area.width / Math.max(area.height, 1) > 1.15 || (depth % 2 === 0 && area.width >= area.height);

  if (splitVertically) {
    const minimumWidth = Math.min(96, area.width / 2);
    const firstWidth = clamp(Math.round(area.width * ratio), minimumWidth, area.width - minimumWidth);
    return [
      ...weightedLayout(first, { ...area, width: firstWidth }, depth + 1),
      ...weightedLayout(second, { x: area.x + firstWidth, y: area.y, width: area.width - firstWidth, height: area.height }, depth + 1)
    ];
  }

  const minimumHeight = Math.min(82, area.height / 2);
  const firstHeight = clamp(Math.round(area.height * ratio), minimumHeight, area.height - minimumHeight);
  return [
    ...weightedLayout(first, { ...area, height: firstHeight }, depth + 1),
    ...weightedLayout(second, { x: area.x, y: area.y + firstHeight, width: area.width, height: area.height - firstHeight }, depth + 1)
  ];
}

function stackRooms(rooms: Room[], area: LayoutRect, hall: Room | undefined, reverse: boolean) {
  if (rooms.length === 0) return [];

  const ordered = [...rooms].sort((a, b) => {
    if (a.id === hall?.id) return -1;
    if (b.id === hall?.id) return 1;
    if (isBathroom(a) !== isBathroom(b)) return isBathroom(a) ? -1 : 1;
    return b.area - a.area;
  });

  const hallHeight = hall ? clamp(area.height * 0.34, 122, 172) : 0;
  const otherRooms = ordered.filter((room) => room.id !== hall?.id);
  const otherWeight = otherRooms.reduce((sum, room) => sum + roomWeight(room), 0);
  const remainingHeight = area.height - hallHeight;
  const result: VisualRoom[] = [];
  let cursorY = reverse ? area.y + area.height : area.y;

  const add = (room: Room, height: number) => {
    const roundedHeight = Math.max(1, Math.round(height));
    const y = reverse ? cursorY - roundedHeight : cursorY;
    result.push(rect(room, { x: area.x, y, width: area.width, height: roundedHeight }));
    cursorY = reverse ? y : y + roundedHeight;
  };

  if (hall) add(hall, hallHeight);

  otherRooms.forEach((room, index) => {
    const usedHeight = Math.abs(cursorY - (reverse ? area.y + area.height : area.y));
    const available = area.height - usedHeight;
    const height = index === otherRooms.length - 1 ? available : remainingHeight * (roomWeight(room) / Math.max(otherWeight, 1));
    add(room, height);
  });

  return result;
}

function layoutMainRooms(rooms: Room[], area: LayoutRect, commonAtTop: boolean) {
  if (rooms.length === 0) return [];

  const commonRooms = rooms.filter((room) => isKitchen(room) || isLiving(room));
  const privateRooms = rooms.filter((room) => !commonRooms.some((candidate) => candidate.id === room.id));

  if (commonRooms.length === 0 || privateRooms.length === 0) {
    return weightedLayout(rooms.map((room) => ({ room, weight: roomWeight(room) })), area);
  }

  const commonShare = clamp(
    commonRooms.reduce((sum, room) => sum + roomWeight(room), 0) /
      rooms.reduce((sum, room) => sum + roomWeight(room), 0),
    0.3,
    0.48
  );
  const commonHeight = Math.round(area.height * commonShare);
  const commonArea = commonAtTop
    ? { x: area.x, y: area.y, width: area.width, height: commonHeight }
    : { x: area.x, y: area.y + area.height - commonHeight, width: area.width, height: commonHeight };
  const privateArea = commonAtTop
    ? { x: area.x, y: area.y + commonHeight, width: area.width, height: area.height - commonHeight }
    : { x: area.x, y: area.y, width: area.width, height: area.height - commonHeight };

  return [
    ...weightedLayout(commonRooms.map((room) => ({ room, weight: roomWeight(room) })), commonArea),
    ...weightedLayout(privateRooms.map((room) => ({ room, weight: roomWeight(room) })), privateArea)
  ];
}

function mirrorRoom(room: VisualRoom, horizontal: boolean, vertical: boolean): VisualRoom {
  const mirroredX = horizontal
    ? PLAN_FRAME.x + PLAN_FRAME.width - (room.visualX - PLAN_FRAME.x) - room.visualWidth
    : room.visualX;
  const mirroredY = vertical
    ? PLAN_FRAME.y + PLAN_FRAME.height - (room.visualY - PLAN_FRAME.y) - room.visualHeight
    : room.visualY;

  return rect(room, {
    x: mirroredX,
    y: mirroredY,
    width: room.visualWidth,
    height: room.visualHeight
  });
}

function buildLayout(apartmentId: string | undefined, rooms: Room[]) {
  if (rooms.length === 0) return [];

  const variant = hashId(apartmentId) % 4;
  const mirrorHorizontal = variant === 1 || variant === 3;
  const mirrorVertical = variant === 2 || variant === 3;
  const hall = rooms.find(isHall);
  const serviceRooms = rooms.filter(isServiceRoom);
  const balconies = rooms.filter(isBalcony);
  const mainRooms = rooms.filter((room) => !isServiceRoom(room) && !isBalcony(room));
  const hasServiceZone = serviceRooms.length > 0;
  const serviceWidth = hasServiceZone ? clamp(142 + serviceRooms.length * 9, 154, 194) : 0;
  const balconyHeight = balconies.length > 0 ? clamp(82 + balconies.length * 8, 88, 112) : 0;
  const mainX = PLAN_FRAME.x + serviceWidth;
  const mainWidth = PLAN_FRAME.width - serviceWidth;
  const mainHeight = PLAN_FRAME.height - balconyHeight;
  const visualRooms: VisualRoom[] = [];

  if (hasServiceZone) {
    visualRooms.push(
      ...stackRooms(
        serviceRooms,
        { x: PLAN_FRAME.x, y: PLAN_FRAME.y, width: serviceWidth, height: PLAN_FRAME.height },
        hall,
        mirrorVertical
      )
    );
  }

  visualRooms.push(
    ...layoutMainRooms(
      mainRooms,
      {
        x: mainX,
        y: PLAN_FRAME.y + (mirrorVertical ? balconyHeight : 0),
        width: mainWidth,
        height: mainHeight
      },
      !mirrorVertical
    )
  );

  if (balconies.length > 0) {
    visualRooms.push(
      ...weightedLayout(
        balconies.map((room) => ({ room, weight: roomWeight(room) })),
        {
          x: mainX,
          y: mirrorVertical ? PLAN_FRAME.y : PLAN_FRAME.y + PLAN_FRAME.height - balconyHeight,
          width: mainWidth,
          height: balconyHeight
        }
      )
    );
  }

  const placedIds = new Set(visualRooms.map((room) => room.id));
  const missingRooms = rooms.filter((room) => !placedIds.has(room.id));
  if (missingRooms.length > 0) {
    visualRooms.push(
      ...weightedLayout(
        missingRooms.map((room) => ({ room, weight: roomWeight(room) })),
        { x: mainX, y: PLAN_FRAME.y, width: mainWidth, height: PLAN_FRAME.height }
      )
    );
  }

  return visualRooms.map((room) => mirrorRoom(room, mirrorHorizontal, false));
}

export function getApartmentVisualRooms(apartmentId: string | undefined, rooms: Room[]) {
  return buildLayout(apartmentId, rooms);
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

function neighborScore(room: VisualRoom, neighbor: VisualRoom) {
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
      .sort((a, b) => neighborScore(room, b.candidate) - neighborScore(room, a.candidate))[0];

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
      .sort((a, b) => neighborScore(balcony, b.candidate) - neighborScore(balcony, a.candidate))[0];

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

import type { PlanPoint } from "@/types/apartment";
import {
  getVisualBounds,
  isBalcony,
  isBathroom,
  isBedroom,
  isHall,
  isKitchen,
  isLiving,
  isStorage,
  type DoorSide,
  type VisualDoor,
  type VisualRoom,
  type VisualWindow
} from "@/lib/apartment-plan-visuals";

export type PolygonVisualRoom = VisualRoom & {
  visualPoints: PlanPoint[];
  visualPolygon: string;
};

export type OutlineSegment = {
  id: string;
  roomId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type Axis = "horizontal" | "vertical" | "diagonal";
type EdgeName = "top" | "right" | "bottom" | "left";
type EdgeMod = { start: number; end: number; offset: number };
type RoomMods = Partial<Record<EdgeName, EdgeMod>>;
type RawEdge = Omit<OutlineSegment, "id"> & { axis: Axis };
type SegmentPiece = OutlineSegment & { key: string; axis: Axis; length: number };
type SegmentGroup = {
  key: string;
  pieces: SegmentPiece[];
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  length: number;
  axis: Axis;
};

const EPSILON = 1.5;

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededUnit(key: string) {
  let value = hashString(key) || 1;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return (value >>> 0) / 4294967296;
}

function almostEqual(a: number, b: number) {
  return Math.abs(a - b) <= EPSILON;
}

function pointKey(point: PlanPoint) {
  return `${point.x.toFixed(2)}:${point.y.toFixed(2)}`;
}

function dedupePoints(points: PlanPoint[]) {
  const result: PlanPoint[] = [];
  for (const point of points) {
    const rounded = { x: Math.round(point.x * 10) / 10, y: Math.round(point.y * 10) / 10 };
    if (!result.length || pointKey(result[result.length - 1]) !== pointKey(rounded)) result.push(rounded);
  }
  if (result.length > 1 && pointKey(result[0]) === pointKey(result[result.length - 1])) result.pop();
  return result;
}

function buildPolygon(room: VisualRoom, mods: RoomMods) {
  const left = room.visualX;
  const top = room.visualY;
  const right = room.visualX + room.visualWidth;
  const bottom = room.visualY + room.visualHeight;
  const points: PlanPoint[] = [{ x: left, y: top }];

  const topMod = mods.top;
  if (topMod) {
    points.push(
      { x: topMod.start, y: top },
      { x: topMod.start, y: top + topMod.offset },
      { x: topMod.end, y: top + topMod.offset },
      { x: topMod.end, y: top }
    );
  }
  points.push({ x: right, y: top });

  const rightMod = mods.right;
  if (rightMod) {
    points.push(
      { x: right, y: rightMod.start },
      { x: right + rightMod.offset, y: rightMod.start },
      { x: right + rightMod.offset, y: rightMod.end },
      { x: right, y: rightMod.end }
    );
  }
  points.push({ x: right, y: bottom });

  const bottomMod = mods.bottom;
  if (bottomMod) {
    points.push(
      { x: bottomMod.end, y: bottom },
      { x: bottomMod.end, y: bottom + bottomMod.offset },
      { x: bottomMod.start, y: bottom + bottomMod.offset },
      { x: bottomMod.start, y: bottom }
    );
  }
  points.push({ x: left, y: bottom });

  const leftMod = mods.left;
  if (leftMod) {
    points.push(
      { x: left, y: leftMod.end },
      { x: left + leftMod.offset, y: leftMod.end },
      { x: left + leftMod.offset, y: leftMod.start },
      { x: left, y: leftMod.start }
    );
  }

  return dedupePoints(points);
}

function pointInPolygon(points: PlanPoint[], x: number, y: number) {
  let inside = false;
  for (let index = 0, previous = points.length - 1; index < points.length; previous = index, index += 1) {
    const a = points[index];
    const b = points[previous];
    const intersects = a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / ((b.y - a.y) || 0.00001) + a.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function distanceToSegment(x: number, y: number, a: PlanPoint, b: PlanPoint) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return Math.hypot(x - a.x, y - a.y);
  const t = clamp(((x - a.x) * dx + (y - a.y) * dy) / lengthSquared, 0, 1);
  return Math.hypot(x - (a.x + t * dx), y - (a.y + t * dy));
}

function labelPoint(points: PlanPoint[], fallbackX: number, fallbackY: number) {
  if (pointInPolygon(points, fallbackX, fallbackY)) return { x: fallbackX, y: fallbackY };

  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  let best = { x: fallbackX, y: fallbackY, score: -1 };

  for (let row = 1; row <= 7; row += 1) {
    for (let column = 1; column <= 7; column += 1) {
      const x = minX + ((maxX - minX) * column) / 8;
      const y = minY + ((maxY - minY) * row) / 8;
      if (!pointInPolygon(points, x, y)) continue;
      let nearest = Number.POSITIVE_INFINITY;
      for (let index = 0; index < points.length; index += 1) {
        nearest = Math.min(nearest, distanceToSegment(x, y, points[index], points[(index + 1) % points.length]));
      }
      if (nearest > best.score) best = { x, y, score: nearest };
    }
  }

  return { x: best.x, y: best.y };
}

function addInteriorBends(apartmentId: string, rooms: VisualRoom[], mods: Map<string, RoomMods>) {
  const candidates: Array<{
    first: VisualRoom;
    second: VisualRoom;
    axis: "vertical" | "horizontal";
    min: number;
    max: number;
  }> = [];

  for (let firstIndex = 0; firstIndex < rooms.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < rooms.length; secondIndex += 1) {
      const first = rooms[firstIndex];
      const second = rooms[secondIndex];
      if (isBalcony(first) || isBalcony(second)) continue;
      const a = getVisualBounds(first);
      const b = getVisualBounds(second);
      const verticalMin = Math.max(a.minY, b.minY);
      const verticalMax = Math.min(a.maxY, b.maxY);
      const horizontalMin = Math.max(a.minX, b.minX);
      const horizontalMax = Math.min(a.maxX, b.maxX);

      if ((almostEqual(a.maxX, b.minX) || almostEqual(b.maxX, a.minX)) && verticalMax - verticalMin >= 105) {
        const left = a.centerX < b.centerX ? first : second;
        const right = left.id === first.id ? second : first;
        candidates.push({ first: left, second: right, axis: "vertical", min: verticalMin, max: verticalMax });
      }

      if ((almostEqual(a.maxY, b.minY) || almostEqual(b.maxY, a.minY)) && horizontalMax - horizontalMin >= 105) {
        const upper = a.centerY < b.centerY ? first : second;
        const lower = upper.id === first.id ? second : first;
        candidates.push({ first: upper, second: lower, axis: "horizontal", min: horizontalMin, max: horizontalMax });
      }
    }
  }

  candidates.sort(
    (a, b) =>
      seededUnit(`${apartmentId}:${a.first.id}:${a.second.id}:bend-order`) -
      seededUnit(`${apartmentId}:${b.first.id}:${b.second.id}:bend-order`)
  );

  const used = new Set<string>();
  const target = Math.max(1, Math.min(4, Math.floor(rooms.length / 2.8)));
  let added = 0;

  for (const candidate of candidates) {
    if (added >= target) break;
    if (used.has(candidate.first.id) || used.has(candidate.second.id)) continue;
    const span = candidate.max - candidate.min;
    const segmentLength = clamp(span * (0.28 + seededUnit(`${apartmentId}:${candidate.first.id}:bend-length`) * 0.16), 48, 88);
    const centerRatio = seededUnit(`${apartmentId}:${candidate.first.id}:${candidate.second.id}:bend-position`) > 0.5 ? 0.68 : 0.32;
    const center = candidate.min + span * centerRatio;
    const start = clamp(center - segmentLength / 2, candidate.min + 20, candidate.max - segmentLength - 20);
    const end = start + segmentLength;
    const firstBounds = getVisualBounds(candidate.first);
    const secondBounds = getVisualBounds(candidate.second);
    const maxDepth =
      candidate.axis === "vertical"
        ? Math.min(firstBounds.maxX - firstBounds.minX, secondBounds.maxX - secondBounds.minX) * 0.18
        : Math.min(firstBounds.maxY - firstBounds.minY, secondBounds.maxY - secondBounds.minY) * 0.18;
    const depth = clamp(16 + seededUnit(`${apartmentId}:${candidate.first.id}:bend-depth`) * 18, 16, Math.min(34, maxDepth));
    const offset = seededUnit(`${apartmentId}:${candidate.first.id}:${candidate.second.id}:bend-direction`) > 0.5 ? depth : -depth;
    const firstMods = mods.get(candidate.first.id) ?? {};
    const secondMods = mods.get(candidate.second.id) ?? {};

    if (candidate.axis === "vertical") {
      if (firstMods.right || secondMods.left) continue;
      firstMods.right = { start, end, offset };
      secondMods.left = { start, end, offset };
    } else {
      if (firstMods.bottom || secondMods.top) continue;
      firstMods.bottom = { start, end, offset };
      secondMods.top = { start, end, offset };
    }

    mods.set(candidate.first.id, firstMods);
    mods.set(candidate.second.id, secondMods);
    used.add(candidate.first.id);
    used.add(candidate.second.id);
    added += 1;
  }
}

function addExteriorRecesses(apartmentId: string, rooms: VisualRoom[], mods: Map<string, RoomMods>) {
  const bounds = rooms.map(getVisualBounds);
  const minX = Math.min(...bounds.map((item) => item.minX));
  const minY = Math.min(...bounds.map((item) => item.minY));
  const maxX = Math.max(...bounds.map((item) => item.maxX));
  const maxY = Math.max(...bounds.map((item) => item.maxY));
  const candidates: Array<{ room: VisualRoom; side: EdgeName; min: number; max: number; inward: number }> = [];

  for (const room of rooms) {
    if (isBathroom(room) || isStorage(room)) continue;
    const roomBounds = getVisualBounds(room);
    if (almostEqual(roomBounds.minY, minY) && room.visualWidth >= 150) candidates.push({ room, side: "top", min: roomBounds.minX, max: roomBounds.maxX, inward: 1 });
    if (almostEqual(roomBounds.maxY, maxY) && room.visualWidth >= 150) candidates.push({ room, side: "bottom", min: roomBounds.minX, max: roomBounds.maxX, inward: -1 });
    if (almostEqual(roomBounds.minX, minX) && room.visualHeight >= 150) candidates.push({ room, side: "left", min: roomBounds.minY, max: roomBounds.maxY, inward: 1 });
    if (almostEqual(roomBounds.maxX, maxX) && room.visualHeight >= 150) candidates.push({ room, side: "right", min: roomBounds.minY, max: roomBounds.maxY, inward: -1 });
  }

  candidates.sort(
    (a, b) =>
      seededUnit(`${apartmentId}:${a.room.id}:${a.side}:facade-order`) -
      seededUnit(`${apartmentId}:${b.room.id}:${b.side}:facade-order`)
  );

  const target = rooms.length >= 8 ? 2 : 1;
  const used = new Set<string>();
  let added = 0;

  for (const candidate of candidates) {
    if (added >= target) break;
    if (used.has(candidate.room.id)) continue;
    const roomMods = mods.get(candidate.room.id) ?? {};
    if (roomMods[candidate.side]) continue;
    const span = candidate.max - candidate.min;
    const segmentLength = clamp(span * (0.2 + seededUnit(`${apartmentId}:${candidate.room.id}:facade-width`) * 0.16), 50, 92);
    const center = candidate.min + span * (0.3 + seededUnit(`${apartmentId}:${candidate.room.id}:facade-position`) * 0.4);
    const start = clamp(center - segmentLength / 2, candidate.min + 24, candidate.max - segmentLength - 24);
    const depth = 16 + seededUnit(`${apartmentId}:${candidate.room.id}:facade-depth`) * 16;
    roomMods[candidate.side] = { start, end: start + segmentLength, offset: depth * candidate.inward };
    mods.set(candidate.room.id, roomMods);
    used.add(candidate.room.id);
    added += 1;
  }
}

export function getPolygonVisualRooms(apartmentId: string | undefined, rooms: VisualRoom[]) {
  const seed = apartmentId || "apartment";
  const mods = new Map<string, RoomMods>();
  addInteriorBends(seed, rooms, mods);
  addExteriorRecesses(seed, rooms, mods);

  return rooms.map((room): PolygonVisualRoom => {
    const visualPoints = buildPolygon(room, mods.get(room.id) ?? {});
    const label = labelPoint(visualPoints, room.visualLabelX, room.visualLabelY);
    return {
      ...room,
      visualPoints,
      visualPolygon: visualPoints.map((point) => `${point.x},${point.y}`).join(" "),
      visualLabelX: Math.round(label.x),
      visualLabelY: Math.round(label.y)
    };
  });
}

function rawEdges(room: PolygonVisualRoom): RawEdge[] {
  return room.visualPoints.map((point, index): RawEdge => {
    const next = room.visualPoints[(index + 1) % room.visualPoints.length];
    const axis: Axis = almostEqual(point.y, next.y) ? "horizontal" : almostEqual(point.x, next.x) ? "vertical" : "diagonal";
    return { roomId: room.id, x1: point.x, y1: point.y, x2: next.x, y2: next.y, axis };
  });
}

function canonicalKey(x1: number, y1: number, x2: number, y2: number) {
  const first = `${x1.toFixed(2)}:${y1.toFixed(2)}`;
  const second = `${x2.toFixed(2)}:${y2.toFixed(2)}`;
  return first < second ? `${first}|${second}` : `${second}|${first}`;
}

function splitSegments(rooms: PolygonVisualRoom[]) {
  const edges: RawEdge[] = rooms.flatMap(rawEdges);
  const horizontalBreaks = new Map<string, number[]>();
  const verticalBreaks = new Map<string, number[]>();

  for (const edge of edges) {
    if (edge.axis === "horizontal") {
      const key = edge.y1.toFixed(2);
      horizontalBreaks.set(key, [...(horizontalBreaks.get(key) ?? []), edge.x1, edge.x2]);
    } else if (edge.axis === "vertical") {
      const key = edge.x1.toFixed(2);
      verticalBreaks.set(key, [...(verticalBreaks.get(key) ?? []), edge.y1, edge.y2]);
    }
  }

  const pieces: SegmentPiece[] = [];
  for (const edge of edges) {
    if (edge.axis === "diagonal") {
      const length = Math.hypot(edge.x2 - edge.x1, edge.y2 - edge.y1);
      pieces.push({
        id: `${edge.roomId}-edge-${pieces.length}`,
        roomId: edge.roomId,
        x1: edge.x1,
        y1: edge.y1,
        x2: edge.x2,
        y2: edge.y2,
        axis: edge.axis,
        key: canonicalKey(edge.x1, edge.y1, edge.x2, edge.y2),
        length
      });
      continue;
    }

    const values =
      edge.axis === "horizontal"
        ? horizontalBreaks.get(edge.y1.toFixed(2)) ?? [edge.x1, edge.x2]
        : verticalBreaks.get(edge.x1.toFixed(2)) ?? [edge.y1, edge.y2];
    const min = edge.axis === "horizontal" ? Math.min(edge.x1, edge.x2) : Math.min(edge.y1, edge.y2);
    const max = edge.axis === "horizontal" ? Math.max(edge.x1, edge.x2) : Math.max(edge.y1, edge.y2);
    const breaks = [...new Set(values.filter((value) => value >= min - EPSILON && value <= max + EPSILON).map((value) => Math.round(value * 100) / 100))].sort((a, b) => a - b);

    for (let index = 0; index < breaks.length - 1; index += 1) {
      const start = breaks[index];
      const end = breaks[index + 1];
      if (end - start < 0.5) continue;
      const x1 = edge.axis === "horizontal" ? start : edge.x1;
      const y1 = edge.axis === "vertical" ? start : edge.y1;
      const x2 = edge.axis === "horizontal" ? end : edge.x2;
      const y2 = edge.axis === "vertical" ? end : edge.y2;
      pieces.push({
        id: `${edge.roomId}-edge-${pieces.length}`,
        roomId: edge.roomId,
        x1,
        y1,
        x2,
        y2,
        axis: edge.axis,
        length: end - start,
        key: canonicalKey(x1, y1, x2, y2)
      });
    }
  }

  return pieces;
}

function segmentGroups(rooms: PolygonVisualRoom[]) {
  const grouped = new Map<string, SegmentPiece[]>();
  for (const piece of splitSegments(rooms)) grouped.set(piece.key, [...(grouped.get(piece.key) ?? []), piece]);

  return [...grouped.entries()].map(([key, pieces]): SegmentGroup => ({
    key,
    pieces,
    x1: pieces[0].x1,
    y1: pieces[0].y1,
    x2: pieces[0].x2,
    y2: pieces[0].y2,
    length: pieces[0].length,
    axis: pieces[0].axis
  }));
}

export function getPolygonOutlineSegments(rooms: PolygonVisualRoom[]) {
  return segmentGroups(rooms)
    .filter((group) => group.pieces.length === 1)
    .map((group, index): OutlineSegment => ({
      id: `outline-${index}`,
      roomId: group.pieces[0].roomId,
      x1: group.x1,
      y1: group.y1,
      x2: group.x2,
      y2: group.y2
    }));
}

function neighborScore(room: VisualRoom) {
  if (isHall(room)) return 100;
  if (isKitchen(room) || isLiving(room)) return 75;
  if (isBedroom(room)) return 45;
  if (isStorage(room)) return 30;
  if (isBathroom(room)) return 15;
  return 20;
}

function doorSide(room: PolygonVisualRoom, group: SegmentGroup): DoorSide {
  const bounds = getVisualBounds(room);
  if (group.axis === "vertical") return bounds.centerX < group.x1 ? "right" : "left";
  return bounds.centerY < group.y1 ? "bottom" : "top";
}

function doorOnGroup(room: PolygonVisualRoom, group: SegmentGroup, apartmentId: string, entry = false): VisualDoor {
  const ratio = 0.32 + seededUnit(`${apartmentId}:${room.id}:${group.key}:door-position`) * 0.36;
  const size = clamp(entry ? 52 : isKitchen(room) || isLiving(room) ? 54 : 46, 34, Math.max(34, group.length - 16));
  return {
    id: `${room.id}-${entry ? "entry" : "door"}`,
    roomId: room.id,
    entry,
    side: doorSide(room, group),
    x: group.axis === "horizontal" ? Math.min(group.x1, group.x2) + group.length * ratio : group.x1,
    y: group.axis === "vertical" ? Math.min(group.y1, group.y2) + group.length * ratio : group.y1,
    size
  };
}

export function getPolygonDoors(rooms: PolygonVisualRoom[], apartmentId = "apartment") {
  const groups = segmentGroups(rooms);
  const doors: VisualDoor[] = [];
  const hall = rooms.find(isHall);

  if (hall) {
    const exterior = groups
      .filter((group) => group.pieces.length === 1 && group.pieces[0].roomId === hall.id && group.axis !== "diagonal" && group.length >= 62)
      .sort((a, b) => b.length - a.length);
    const edge = exterior[Math.floor(seededUnit(`${apartmentId}:entry-edge`) * Math.min(2, exterior.length))] ?? exterior[0];
    if (edge) doors.push(doorOnGroup(hall, edge, apartmentId, true));
  }

  for (const room of rooms) {
    if (room.id === hall?.id || isBalcony(room)) continue;
    const shared = groups
      .filter((group) => group.pieces.length >= 2 && group.axis !== "diagonal" && group.length >= 52 && group.pieces.some((piece) => piece.roomId === room.id))
      .map((group) => {
        const neighborId = group.pieces.find((piece) => piece.roomId !== room.id)?.roomId;
        return { group, neighbor: rooms.find((candidate) => candidate.id === neighborId) };
      })
      .filter((item): item is { group: SegmentGroup; neighbor: PolygonVisualRoom } => Boolean(item.neighbor))
      .sort((a, b) => neighborScore(b.neighbor) - neighborScore(a.neighbor) || b.group.length - a.group.length);
    if (shared[0]) doors.push(doorOnGroup(room, shared[0].group, apartmentId));
  }

  for (const balcony of rooms.filter(isBalcony)) {
    const shared = groups
      .filter((group) => group.pieces.length >= 2 && group.axis !== "diagonal" && group.length >= 64 && group.pieces.some((piece) => piece.roomId === balcony.id))
      .sort((a, b) => b.length - a.length);
    if (shared[0]) doors.push({ ...doorOnGroup(balcony, shared[0], apartmentId), size: clamp(62, 44, shared[0].length - 14) });
  }

  return doors;
}

export function getPolygonWindows(rooms: PolygonVisualRoom[], apartmentId = "apartment") {
  const groups = segmentGroups(rooms);
  const windows: VisualWindow[] = [];

  for (const room of rooms) {
    if (isHall(room) || isBathroom(room) || isStorage(room)) continue;
    const exterior = groups
      .filter((group) => group.pieces.length === 1 && group.pieces[0].roomId === room.id && group.axis !== "diagonal" && group.length >= 70)
      .sort((a, b) => b.length - a.length);
    if (!exterior.length) continue;
    const edge = exterior[Math.floor(seededUnit(`${apartmentId}:${room.id}:window-edge`) * Math.min(2, exterior.length))] ?? exterior[0];
    const glazing = isBalcony(room);
    const count = !glazing && room.area >= 20 && edge.length >= 230 ? 2 : 1;
    const size = clamp(edge.length * (count === 2 ? 0.27 : glazing ? 0.7 : 0.44), glazing ? 72 : 48, glazing ? 210 : 124);
    const ratios = count === 2 ? [0.32, 0.68] : [0.36 + seededUnit(`${apartmentId}:${room.id}:window-position`) * 0.28];

    ratios.forEach((ratio, index) => {
      const min = edge.axis === "horizontal" ? Math.min(edge.x1, edge.x2) : Math.min(edge.y1, edge.y2);
      const max = edge.axis === "horizontal" ? Math.max(edge.x1, edge.x2) : Math.max(edge.y1, edge.y2);
      const center = clamp(min + edge.length * ratio, min + size / 2 + 8, max - size / 2 - 8);
      if (edge.axis === "horizontal") {
        windows.push({ id: `${room.id}-window-${index}`, x1: center - size / 2, y1: edge.y1, x2: center + size / 2, y2: edge.y1, kind: glazing ? "glazing" : "window" });
      } else {
        windows.push({ id: `${room.id}-window-${index}`, x1: edge.x1, y1: center - size / 2, x2: edge.x1, y2: center + size / 2, kind: glazing ? "glazing" : "window" });
      }
    });
  }

  return windows;
}

export function rectFitsPolygon(room: PolygonVisualRoom, x: number, y: number, width: number, height: number, padding = 3) {
  return [
    { x: x + padding, y: y + padding },
    { x: x + width - padding, y: y + padding },
    { x: x + width - padding, y: y + height - padding },
    { x: x + padding, y: y + height - padding },
    { x: x + width / 2, y: y + height / 2 }
  ].every((point) => pointInPolygon(room.visualPoints, point.x, point.y));
}

export function fixtureFitsPolygon(room: PolygonVisualRoom, fixture: { x: number; y: number; width: number; height: number }) {
  return rectFitsPolygon(room, fixture.x, fixture.y, fixture.width, fixture.height, 1);
}

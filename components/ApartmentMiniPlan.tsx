import type { Apartment, Room } from "@/types/apartment";

type LayoutRoom = Room & {
  visualX: number;
  visualY: number;
  visualWidth: number;
  visualHeight: number;
};

const PLAN = {
  x: 56,
  y: 56,
  width: 672,
  height: 488
};

function byAreaDesc(a: Room, b: Room) {
  return b.area - a.area;
}

function isLiving(room: Room) {
  const name = room.name.toLowerCase();
  return room.type === "living" || name.includes("гостин") || name.includes("жилая");
}

function isKitchen(room: Room) {
  const name = room.name.toLowerCase();
  return room.type === "kitchen" || name.includes("кухн");
}

function isBalcony(room: Room) {
  const name = room.name.toLowerCase();
  return room.type === "balcony" || name.includes("лодж") || name.includes("балкон");
}

function isWet(room: Room) {
  return room.type === "bathroom" || room.name.toLowerCase().includes("сануз");
}

function isHall(room: Room) {
  return room.type === "hall" || room.name.toLowerCase().includes("прихож") || room.name.toLowerCase().includes("холл");
}

function isStorage(room: Room) {
  return room.type === "wardrobe" || room.name.toLowerCase().includes("гардер") || room.name.toLowerCase().includes("клад");
}

function isBedroomLike(room: Room) {
  const name = room.name.toLowerCase();
  return room.type === "bedroom" || room.type === "children" || name.includes("спаль") || name.includes("детск");
}

function layoutRoom(room: Room, x: number, y: number, width: number, height: number): LayoutRoom {
  return {
    ...room,
    visualX: x,
    visualY: y,
    visualWidth: width,
    visualHeight: height
  };
}

function makeSmartLayout(rooms: Room[]): LayoutRoom[] {
  const used = new Set<string>();
  const result: LayoutRoom[] = [];

  const hall = rooms.find(isHall);
  const bathroom = rooms.find(isWet);
  const balcony = rooms.find(isBalcony);
  const kitchen = rooms.find((room) => isKitchen(room) && !isLiving(room));
  const living = rooms.find((room) => isLiving(room) && !isKitchen(room));
  const kitchenLiving = rooms.find((room) => isKitchen(room) && isLiving(room));
  const storage = rooms.find(isStorage);
  const bedrooms = rooms.filter(isBedroomLike).sort(byAreaDesc);
  const otherRooms = rooms
    .filter(
      (room) =>
        !isHall(room) &&
        !isWet(room) &&
        !isBalcony(room) &&
        !isStorage(room) &&
        !isBedroomLike(room) &&
        room.id !== kitchen?.id &&
        room.id !== living?.id &&
        room.id !== kitchenLiving?.id
    )
    .sort(byAreaDesc);

  function add(room: Room | undefined, x: number, y: number, width: number, height: number) {
    if (!room || used.has(room.id)) return;
    used.add(room.id);
    result.push(layoutRoom(room, x, y, width, height));
  }

  const totalRooms = rooms.length;
  const bedroomsCount = bedrooms.length;

  if (totalRooms <= 5 && bedroomsCount <= 1) {
    const leftW = 170;
    const topH = 150;
    const balconyW = balcony ? 170 : 0;
    const mainW = PLAN.width - leftW - balconyW;

    add(bathroom, PLAN.x, PLAN.y, leftW, topH);
    add(hall, PLAN.x, PLAN.y + topH, leftW, 126);

    const mainRoom = kitchenLiving ?? kitchen ?? living ?? otherRooms[0] ?? bedrooms[0];
    add(mainRoom, PLAN.x + leftW, PLAN.y, mainW, topH);

    if (balcony) add(balcony, PLAN.x + leftW + mainW, PLAN.y, balconyW, topH);

    const bedroom = bedrooms.find((room) => room.id !== mainRoom?.id) ?? bedrooms[0];
    add(bedroom, PLAN.x + leftW, PLAN.y + topH, PLAN.width - leftW, PLAN.height - topH);

    if (storage && !used.has(storage.id)) add(storage, PLAN.x, PLAN.y + topH + 126, leftW, PLAN.height - topH - 126);
  } else if (bedroomsCount <= 2) {
    const leftW = 168;
    const topH = 158;
    const midH = 172;
    const rightW = balcony ? 172 : 0;
    const mainW = PLAN.width - leftW - rightW;

    add(bathroom, PLAN.x, PLAN.y, leftW, topH);
    add(hall, PLAN.x, PLAN.y + topH, leftW, 132);

    const mainRoom = kitchenLiving ?? kitchen ?? living ?? otherRooms[0];
    add(mainRoom, PLAN.x + leftW, PLAN.y, mainW, topH);

    if (balcony) add(balcony, PLAN.x + leftW + mainW, PLAN.y, rightW, topH);

    add(bedrooms[0], PLAN.x + leftW, PLAN.y + topH, Math.round(mainW * 0.54), midH);
    add(bedrooms[1], PLAN.x + leftW + Math.round(mainW * 0.54), PLAN.y + topH, mainW - Math.round(mainW * 0.54) + rightW, midH);

    add(storage, PLAN.x, PLAN.y + topH + 132, leftW, PLAN.height - topH - 132);
    add(otherRooms.find((room) => !used.has(room.id)), PLAN.x + leftW, PLAN.y + topH + midH, PLAN.width - leftW, PLAN.height - topH - midH);
  } else {
    const leftW = 168;
    const topH = 154;
    const midH = 166;
    const bottomH = PLAN.height - topH - midH;
    const usableW = PLAN.width - leftW;
    const colW = Math.round(usableW / 3);

    add(bathroom, PLAN.x, PLAN.y, leftW, Math.round(topH * 0.55));
    add(hall, PLAN.x, PLAN.y + Math.round(topH * 0.55), leftW, Math.round(topH * 0.7));
    add(storage, PLAN.x, PLAN.y + Math.round(topH * 1.25), leftW, PLAN.height - Math.round(topH * 1.25));

    const mainRoom = kitchenLiving ?? kitchen ?? living ?? otherRooms[0];
    add(mainRoom, PLAN.x + leftW, PLAN.y, colW * 2, topH);
    add(balcony, PLAN.x + leftW + colW * 2, PLAN.y, usableW - colW * 2, topH);

    add(bedrooms[0], PLAN.x + leftW, PLAN.y + topH, colW, midH);
    add(bedrooms[1], PLAN.x + leftW + colW, PLAN.y + topH, colW, midH);
    add(bedrooms[2], PLAN.x + leftW + colW * 2, PLAN.y + topH, usableW - colW * 2, midH);

    const bottomRooms = [...bedrooms.slice(3), ...otherRooms].filter((room) => !used.has(room.id));
    if (bottomRooms.length <= 1) {
      add(bottomRooms[0], PLAN.x + leftW, PLAN.y + topH + midH, usableW, bottomH);
    } else {
      const firstW = Math.round(usableW * 0.56);
      add(bottomRooms[0], PLAN.x + leftW, PLAN.y + topH + midH, firstW, bottomH);
      add(bottomRooms[1], PLAN.x + leftW + firstW, PLAN.y + topH + midH, usableW - firstW, bottomH);
    }
  }

  const remaining = rooms.filter((room) => !used.has(room.id));
  if (remaining.length > 0) {
    const slotW = Math.floor(PLAN.width / remaining.length);
    remaining.forEach((room, index) => {
      add(room, PLAN.x + slotW * index, PLAN.y + PLAN.height - 110, index === remaining.length - 1 ? PLAN.width - slotW * index : slotW, 110);
    });
  }

  return result;
}

function roomFill(room: Room) {
  if (isKitchen(room) || isLiving(room)) return "#eef5fb";
  if (isBedroomLike(room)) return "#eef8ef";
  if (isWet(room)) return "#eef3fa";
  if (isHall(room)) return "#fff6e8";
  if (isBalcony(room)) return "#f2f7ff";
  if (isStorage(room)) return "#f7f1ff";
  return "#ffffff";
}

export function ApartmentMiniPlan({ apartment }: { apartment: Apartment }) {
  const layoutRooms = makeSmartLayout(apartment.rooms);

  return (
    <div className="card-mini-plan" aria-label={`Мини-план квартиры ${apartment.title}`}>
      <svg viewBox="0 0 785 600" role="img" style={{ display: "block", width: "100%" }}>
        <rect x="34" y="34" width="720" height="530" rx="24" fill="#fffdf8" stroke="rgba(0, 59, 166, 0.12)" strokeWidth="2" />

        {layoutRooms.map((room) => (
          <rect
            key={room.id}
            x={room.visualX}
            y={room.visualY}
            width={room.visualWidth}
            height={room.visualHeight}
            fill={roomFill(room)}
            stroke="#c9ba9a"
            strokeWidth="4"
          />
        ))}

        <rect x={PLAN.x} y={PLAN.y} width={PLAN.width} height={PLAN.height} fill="none" stroke="#3f362c" strokeWidth="8" />
      </svg>
    </div>
  );
}

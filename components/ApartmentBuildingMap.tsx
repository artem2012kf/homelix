import Link from "next/link";
import type { Apartment, ApartmentStatus } from "@/types/apartment";
import { formatArea, formatPrice } from "@/lib/format";

type BuildingPlan = {
  name: string;
  title: string;
  subtitle: string;
  x: number;
  y: number;
  width: number;
  height: number;
  labelX: number;
  labelY: number;
};

const buildingPlans: BuildingPlan[] = [
  {
    name: "Корпус 1",
    title: "Корпус 1",
    subtitle: "парк и двор",
    x: 74,
    y: 88,
    width: 184,
    height: 74,
    labelX: 166,
    labelY: 130
  },
  {
    name: "Корпус 2",
    title: "Корпус 2",
    subtitle: "семейная зона",
    x: 356,
    y: 72,
    width: 184,
    height: 74,
    labelX: 448,
    labelY: 114
  },
  {
    name: "Корпус 3",
    title: "Корпус 3",
    subtitle: "тихий двор",
    x: 128,
    y: 264,
    width: 178,
    height: 78,
    labelX: 217,
    labelY: 308
  },
  {
    name: "Корпус 4",
    title: "Корпус 4",
    subtitle: "видовые этажи",
    x: 428,
    y: 252,
    width: 178,
    height: 78,
    labelX: 517,
    labelY: 296
  },
  {
    name: "Корпус 5",
    title: "Корпус 5",
    subtitle: "у бульвара",
    x: 252,
    y: 420,
    width: 210,
    height: 76,
    labelX: 357,
    labelY: 462
  }
];

const statusLabels: Record<ApartmentStatus, string> = {
  available: "Свободна",
  reserved: "Бронь",
  sold: "Продана"
};

function slugBuilding(building: string) {
  return building.toLowerCase().replace(/\s+/g, "-");
}

function getStatusCount(apartments: Apartment[], status: ApartmentStatus) {
  return apartments.filter((apartment) => apartment.status === status).length;
}

function getBestApartments(apartments: Apartment[]) {
  return [...apartments]
    .sort((a, b) => {
      if (a.status !== b.status) {
        const order: Record<ApartmentStatus, number> = { available: 0, reserved: 1, sold: 2 };
        return order[a.status] - order[b.status];
      }

      return a.price - b.price;
    })
    .slice(0, 3);
}

export function ApartmentBuildingMap({
  apartments,
  highlightBuilding,
  compact = false
}: {
  apartments: Apartment[];
  highlightBuilding?: string;
  compact?: boolean;
}) {
  const byBuilding = new Map<string, Apartment[]>();

  for (const apartment of apartments) {
    const items = byBuilding.get(apartment.building) ?? [];
    items.push(apartment);
    byBuilding.set(apartment.building, items);
  }

  return (
    <div className={compact ? "building-map building-map-compact" : "building-map"}>
      <div className="building-map-visual" aria-label="Схема расположения корпусов ЖК">
        <svg viewBox="0 0 720 560" role="img">
          <title>Карта расположения корпусов ЖК Солнечный квартал</title>
          <defs>
            <linearGradient id="mapBuildingGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#eef4ff" />
            </linearGradient>
            <linearGradient id="mapBuildingActiveGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F93E3E" />
              <stop offset="100%" stopColor="#D92C2C" />
            </linearGradient>
          </defs>

          <rect className="map-ground" x="22" y="22" width="676" height="516" rx="34" />
          <path className="map-road" d="M30 392 C146 330 230 368 320 286 C396 218 474 224 690 172" />
          <path className="map-road map-road-secondary" d="M96 88 C204 178 292 170 392 142 C510 108 590 72 686 38" />
          <path className="map-walk" d="M48 458 C162 420 216 456 308 404 C438 330 520 354 680 292" />

          <circle className="map-yard" cx="352" cy="276" r="78" />
          <circle className="map-yard map-yard-small" cx="548" cy="418" r="52" />

          {[72, 114, 640, 590, 326, 472].map((x, index) => (
            <g className="map-tree" key={`${x}-${index}`}>
              <circle cx={x} cy={index % 2 === 0 ? 218 : 404} r="12" />
              <path d={`M${x} ${index % 2 === 0 ? 230 : 416} l0 18`} />
            </g>
          ))}

          {buildingPlans.map((building) => {
            const buildingApartments = byBuilding.get(building.name) ?? [];
            const isActive = highlightBuilding === building.name;
            const available = getStatusCount(buildingApartments, "available");

            return (
              <a href={`#building-${slugBuilding(building.name)}`} key={building.name}>
                <g className={isActive ? "map-building map-building-active" : "map-building"}>
                  <rect
                    x={building.x}
                    y={building.y}
                    width={building.width}
                    height={building.height}
                    rx="18"
                  />
                  <text className="map-building-title" x={building.labelX} y={building.labelY - 8}>
                    {building.title}
                  </text>
                  <text className="map-building-subtitle" x={building.labelX} y={building.labelY + 15}>
                    {available} свободно
                  </text>
                </g>
              </a>
            );
          })}

          <g className="map-compass">
            <circle cx="654" cy="88" r="28" />
            <text x="654" y="94">N</text>
          </g>
        </svg>
      </div>

      <div className="building-map-cards">
        {buildingPlans.map((building) => {
          const buildingApartments = byBuilding.get(building.name) ?? [];
          const available = getStatusCount(buildingApartments, "available");
          const reserved = getStatusCount(buildingApartments, "reserved");
          const sold = getStatusCount(buildingApartments, "sold");
          const bestApartments = getBestApartments(buildingApartments);
          const minPrice = Math.min(...buildingApartments.map((apartment) => apartment.price));
          const minArea = Math.min(...buildingApartments.map((apartment) => apartment.totalArea));
          const maxArea = Math.max(...buildingApartments.map((apartment) => apartment.totalArea));
          const isActive = highlightBuilding === building.name;

          return (
            <article
              className={isActive ? "building-card building-card-active" : "building-card"}
              id={`building-${slugBuilding(building.name)}`}
              key={building.name}
            >
              <div className="building-card-header">
                <div>
                  <span>{building.subtitle}</span>
                  <h3>{building.name}</h3>
                </div>
                <strong>{buildingApartments.length}</strong>
              </div>

              <div className="building-card-stats">
                <span>{available} свободно</span>
                <span>{reserved} бронь</span>
                <span>{sold} продано</span>
              </div>

              <p>
                Площади от {formatArea(minArea)} до {formatArea(maxArea)}, цены от {formatPrice(minPrice)}.
              </p>

              {!compact && (
                <ul className="building-apartment-list">
                  {bestApartments.map((apartment) => (
                    <li key={apartment.id}>
                      <Link href={`/apartment/${apartment.id}`}>
                        <strong>{apartment.title}</strong>
                        <span>
                          {apartment.floor} этаж · {formatPrice(apartment.price)} · {statusLabels[apartment.status]}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

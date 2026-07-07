import type { Apartment, ApartmentStatus } from "@/types/apartment";

const districts = [
  { name: "Тюменская слобода", note: "новая застройка", buildings: ["Корпус 1"], x: 74, y: 316, width: 230, height: 118 },
  { name: "Московский тракт", note: "западное направление", buildings: ["Корпус 2"], x: 80, y: 150, width: 250, height: 104 },
  { name: "Заречный", note: "рядом с Турой", buildings: ["Корпус 3"], x: 382, y: 132, width: 210, height: 100 },
  { name: "Восточный", note: "семейные кварталы", buildings: ["Корпус 4"], x: 408, y: 292, width: 220, height: 116 },
  { name: "Центр", note: "городская инфраструктура", buildings: ["Корпус 5"], x: 260, y: 246, width: 176, height: 92 }
];

function statusCount(apartments: Apartment[], status: ApartmentStatus) {
  return apartments.filter((apartment) => apartment.status === status).length;
}

export function HeroDistrictMap({ apartments }: { apartments: Apartment[] }) {
  return (
    <div className="hero-district-map" aria-label="Районы Тюмени, где есть квартиры">
      <svg viewBox="0 0 700 520" role="img">
        <title>Районы Тюмени с квартирами ЖК Солнечный квартал</title>
        <defs>
          <linearGradient id="districtBlue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#eaf2ff" />
          </linearGradient>
          <linearGradient id="districtRed" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff7f7" />
            <stop offset="100%" stopColor="#ffe6e6" />
          </linearGradient>
        </defs>

        <rect className="hero-district-ground" x="18" y="28" width="664" height="464" rx="42" />
        <path className="hero-district-river" d="M38 192 C122 124 234 150 330 194 C430 240 506 176 662 154" />
        <path className="hero-district-road" d="M70 420 C166 346 272 350 362 292 C466 226 546 254 650 292" />
        <path className="hero-district-road hero-district-road-light" d="M94 88 C178 162 236 220 292 438" />

        {districts.map((district, index) => {
          const districtApartments = apartments.filter((apartment) => district.buildings.includes(apartment.building));
          const available = statusCount(districtApartments, "available");

          return (
            <g className="hero-district" key={district.name}>
              <rect
                className={index % 2 === 0 ? "hero-district-shape hero-district-shape-red" : "hero-district-shape"}
                x={district.x}
                y={district.y}
                width={district.width}
                height={district.height}
                rx="28"
              />
              <text className="hero-district-title" x={district.x + 24} y={district.y + 38}>
                {district.name}
              </text>
              <text className="hero-district-note" x={district.x + 24} y={district.y + 62}>
                {district.note}
              </text>
              <text className="hero-district-count" x={district.x + 24} y={district.y + 90}>
                {available} свободно · {districtApartments.length} всего
              </text>
            </g>
          );
        })}

        <g className="hero-district-pin">
          <circle cx="350" cy="268" r="24" />
          <text x="350" y="276">AI</text>
        </g>
      </svg>
    </div>
  );
}

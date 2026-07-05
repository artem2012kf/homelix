import Link from "next/link";

const cityPoints = [
  { name: "Центр", note: "деловая часть", x: 392, y: 232 },
  { name: "Заречный район", note: "через Туру", x: 322, y: 120 },
  { name: "Восточный район", note: "жилые кварталы", x: 604, y: 268 },
  { name: "Дом обороны", note: "север города", x: 458, y: 96 },
  { name: "Московский тракт", note: "выезд из города", x: 176, y: 350 },
  { name: "Тюменская слобода", note: "новая застройка", x: 268, y: 426 },
  { name: "Плеханово", note: "западное направление", x: 112, y: 234 }
];

export function TyumenCityMap({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "tyumen-map tyumen-map-compact" : "tyumen-map"}>
      <div className="tyumen-map-visual" aria-label="Схематическая карта Тюмени">
        <svg viewBox="0 0 760 520" role="img">
          <title>Схематическая карта Тюмени с расположением ЖК Солнечный квартал</title>
          <defs>
            <linearGradient id="tyumenWater" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#003BA6" stopOpacity="0.08" />
              <stop offset="50%" stopColor="#003BA6" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#003BA6" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="tyumenPin" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F93E3E" />
              <stop offset="100%" stopColor="#D92C2C" />
            </linearGradient>
          </defs>

          <rect className="tyumen-ground" x="24" y="24" width="712" height="472" rx="34" />

          <path
            className="tyumen-river"
            d="M34 176 C120 122 214 150 296 186 C408 236 496 176 586 152 C650 136 704 152 736 180"
          />
          <path
            className="tyumen-river-line"
            d="M34 176 C120 122 214 150 296 186 C408 236 496 176 586 152 C650 136 704 152 736 180"
          />

          <path className="tyumen-road-main" d="M70 402 C172 342 240 330 328 292 C438 244 540 260 704 314" />
          <path className="tyumen-road" d="M122 82 C172 170 212 248 270 430" />
          <path className="tyumen-road" d="M512 66 C474 152 452 244 438 430" />
          <path className="tyumen-road" d="M70 238 C186 212 278 226 398 250 C510 272 604 256 706 218" />

          <circle className="tyumen-center-ring" cx="392" cy="232" r="86" />
          <circle className="tyumen-center-ring tyumen-center-ring-small" cx="268" cy="426" r="64" />

          {cityPoints.map((point) => (
            <g className="tyumen-city-point" key={point.name}>
              <circle cx={point.x} cy={point.y} r="6" />
              <text x={point.x + 12} y={point.y - 5}>{point.name}</text>
              {!compact && <text className="tyumen-city-note" x={point.x + 12} y={point.y + 14}>{point.note}</text>}
            </g>
          ))}

          <g className="tyumen-project-pin">
            <path d="M268 352 C236 352 212 376 212 407 C212 453 268 486 268 486 C268 486 324 453 324 407 C324 376 300 352 268 352 Z" />
            <circle cx="268" cy="407" r="19" />
            <text x="268" y="414">SQ</text>
          </g>

          <g className="tyumen-project-label">
            <rect x="330" y="370" width="236" height="82" rx="20" />
            <text x="352" y="402">ЖК «Солнечный квартал»</text>
            <text className="tyumen-project-label-small" x="352" y="426">г. Тюмень · район новой застройки</text>
          </g>

          <g className="tyumen-compass">
            <circle cx="690" cy="72" r="28" />
            <text x="690" y="78">N</text>
          </g>
        </svg>
      </div>

      <aside className="tyumen-map-info">
        <span className="eyebrow">Тюмень</span>
        <h3>ЖК на карте города</h3>
        <p>
          Схема показывает городское расположение проекта: рядом отмечены основные районы, река Тура,
          транспортные направления и точка ЖК «Солнечный квартал».
        </p>
        <div className="tyumen-map-tags">
          <span>городская карта</span>
          <span>река Тура</span>
          <span>районы Тюмени</span>
          <span>точка ЖК</span>
        </div>
        <div className="tyumen-map-actions">
          <Link className="button button-primary" href="/#apartments">
            Смотреть квартиры
          </Link>
          <Link className="button button-ghost" href="/ai">
            Спросить ИИ
          </Link>
        </div>
      </aside>
    </div>
  );
}

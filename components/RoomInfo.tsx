import type { Room, RoomType } from "@/types/apartment";
import type { Locale } from "@/lib/i18n";

const englishRoomCopy: Record<RoomType, { description: string; tips: string[] }> = {
  kitchen: {
    description: "A combined kitchen and living area for cooking, dining and everyday relaxation.",
    tips: ["Linear or L-shaped kitchen", "Dining table", "Compact sofa", "Layered lighting"]
  },
  living: {
    description: "The main shared room for relaxing, meeting guests and family activities.",
    tips: ["Sofa and armchair", "TV or media unit", "Coffee table", "Storage along a free wall"]
  },
  bedroom: {
    description: "A private room designed for rest, storage and a calm daily routine.",
    tips: ["Bed with bedside tables", "Wardrobe", "Dresser", "Compact work or vanity desk"]
  },
  children: {
    description: "A flexible room for sleeping, study, play and organized storage.",
    tips: ["Bed", "Study desk", "Wardrobe", "Open storage for toys and books"]
  },
  bathroom: {
    description: "A wet zone planned for hygiene, laundry and closed storage.",
    tips: ["Vanity unit", "Mirror cabinet", "Washing machine", "Tall narrow storage"]
  },
  hall: {
    description: "The entrance zone connecting the apartment and organizing everyday storage.",
    tips: ["Shoe storage", "Mirror", "Bench or ottoman", "Shallow wardrobe"]
  },
  balcony: {
    description: "An additional bright zone for rest, plants or compact seasonal storage.",
    tips: ["Small table and chair", "Plant shelf", "Weather-resistant storage", "Reading corner"]
  },
  wardrobe: {
    description: "A dedicated storage room that keeps the living areas free from bulky wardrobes.",
    tips: ["Hanging rails", "Adjustable shelves", "Drawer units", "Upper storage for seasonal items"]
  }
};

export function RoomInfo({ room, locale = "ru" }: { room?: Room; locale?: Locale }) {
  const isEnglish = locale === "en";

  if (!room) {
    return (
      <aside className="room-panel empty-panel">
        <h3>{isEnglish ? "Select a room" : "Выберите комнату"}</h3>
        <p className="muted">{isEnglish ? "Hover over or tap a floor-plan zone to see its details." : "Наведите курсор или нажмите на зону планировки, чтобы увидеть описание."}</p>
      </aside>
    );
  }

  const english = englishRoomCopy[room.type];

  return (
    <aside className="room-panel">
      <span className="eyebrow">{isEnglish ? "Selected zone" : "Выбранная зона"}</span>
      <h3>{room.name}</h3>
      <p>{isEnglish ? english.description : room.description}</p>
      <div className="room-area-large">{room.area} m²</div>
      <h4>{isEnglish ? "What fits here" : "Что можно разместить"}</h4>
      <ul className="nice-list">
        {(isEnglish ? english.tips : room.furnitureTips).map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </aside>
  );
}

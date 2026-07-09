export type RoomType =
  | "kitchen"
  | "living"
  | "bedroom"
  | "children"
  | "bathroom"
  | "hall"
  | "balcony"
  | "wardrobe";

export type Room = {
  id: string;
  type: RoomType;
  name: string;
  area: number;
  description: string;
  furnitureTips: string[];
  /**
   * Внутренние подсказки для ИИ-консультанта.
   * Они не обязаны отображаться пользователю, но передаются модели как контекст комнаты.
   */
  aiHints: string[];
  /**
   * Видимые быстрые вопросы для пользователя. Если поле не заполнено,
   * чат автоматически создаст разные подсказки по типу комнаты.
   */
  chatPrompts?: string[];
  polygon: string;
  labelX: number;
  labelY: number;
};

export type ApartmentStatus = "available" | "reserved" | "sold";

export type Apartment = {
  id: string;
  title: string;
  project: string;
  building: string;
  section: string;
  floor: number;
  roomsCount: number;
  totalArea: number;
  price: number;
  mortgagePayment: number;
  status: ApartmentStatus;
  windowView: string;
  ceilingHeight: number;
  finishing: string;
  advantages: string[];
  rooms: Room[];
};

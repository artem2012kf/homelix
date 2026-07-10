export type RoomType =
  | "kitchen"
  | "living"
  | "bedroom"
  | "children"
  | "bathroom"
  | "hall"
  | "balcony"
  | "wardrobe";

export type RoomPlan = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Room = {
  id: string;
  type: RoomType;
  name: string;
  area: number;
  description: string;
  furnitureTips: string[];
  aiHints: string[];
  chatPrompts?: string[];
  plan?: RoomPlan;
  polygon: string;
  labelX: number;
  labelY: number;
};

export type ApartmentStatus = "available" | "reserved" | "sold";

export type Apartment = {
  id: string;
  title: string;
  city: string;
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
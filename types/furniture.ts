export type FurnitureCategory =
  | "sofa"
  | "bed"
  | "table"
  | "storage"
  | "kitchen"
  | "bathroom"
  | "lighting"
  | "decor";

export type FurnitureItem = {
  id: string;
  title: string;
  category: FurnitureCategory;
  room: string;
  price: number;
  oldPrice?: number;
  dimensions: string;
  material: string;
  color: string;
  delivery: string;
  description: string;
  tags: string[];
  image?: string;
};

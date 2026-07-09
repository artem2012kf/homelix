import type { FurnitureCategory } from "@/types/furniture";

export type FurniturePlacement = {
  id: string;
  roomId: string;
  itemId: string;
  title: string;
  category: FurnitureCategory;
  price: number;
  layoutVariant?: number;
  manualX?: number;
  manualY?: number;
  manualRotation?: number;
  createdAt?: number;
};

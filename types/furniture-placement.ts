import type { FurnitureCategory } from "@/types/furniture";

export type FurniturePlacement = {
  id: string;
  roomId: string;
  itemId: string;
  title: string;
  category: FurnitureCategory;
  price: number;
  /**
   * Вариант расположения внутри комнаты. ИИ меняет это поле,
   * когда пользователь просит передвинуть конкретную мебель.
   */
  layoutVariant?: number;
  /**
   * Ручные координаты на SVG-планировке. Хранятся только в браузере текущего устройства.
   */
  manualX?: number;
  manualY?: number;
  createdAt?: number;
};

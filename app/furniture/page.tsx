import type { Metadata } from "next";
import { FurnitureStore } from "@/components/FurnitureStore";

export const metadata: Metadata = {
  title: "Мебель с доставкой — ХОЛЛ",
  description: "Корзина мебели, стоимость и срок доставки в выбранную квартиру."
};

export default function FurniturePage() {
  return <FurnitureStore />;
}
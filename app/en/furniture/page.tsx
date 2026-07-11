import type { Metadata } from "next";
import { FurnitureStore } from "@/components/FurnitureStore";

export const metadata: Metadata = {
  title: "Furniture with delivery — HALL",
  description: "Furniture catalog, cart, delivery price and timing for the selected apartment."
};

export default function EnglishFurniturePage() {
  return <FurnitureStore />;
}

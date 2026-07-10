import type { Metadata } from "next";
import { LocalizedHomePage } from "@/components/LocalizedHomePage";

export const metadata: Metadata = {
  title: "HALL — apartments across Russia",
  description: "Choose a city and residential project, compare apartments, explore irregular floor plans and order furniture with delivery. Prices are converted to USD using an updated rate."
};

export default function EnglishHomePage() {
  return <LocalizedHomePage locale="en" />;
}
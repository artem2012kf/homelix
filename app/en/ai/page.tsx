import type { Metadata } from "next";
import { AiPageContent } from "@/components/AiPageContent";

export const metadata: Metadata = {
  title: "AI apartment assistant — HALL",
  description: "Apartment recommendations for the selected city and residential project."
};

export default function EnglishAiPage() {
  return <AiPageContent locale="en" />;
}

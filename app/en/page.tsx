import type { Metadata } from "next";
import { LocalizedHomePage } from "@/components/LocalizedHomePage";

export const metadata: Metadata = {
  title: "Homelix — interactive apartment selection with AI",
  description: "Browse apartments in Tyumen, explore interactive floor plans and use an AI assistant."
};

export default function EnglishHomePage() {
  return <LocalizedHomePage locale="en" />;
}

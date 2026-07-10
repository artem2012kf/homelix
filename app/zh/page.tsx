import type { Metadata } from "next";
import { LocalizedHomePage } from "@/components/LocalizedHomePage";

export const metadata: Metadata = {
  title: "Homelix — AI交互式选房平台",
  description: "浏览秋明房源、查看交互式户型图并使用AI选房顾问。"
};

export default function ChineseHomePage() {
  return <LocalizedHomePage locale="zh" />;
}

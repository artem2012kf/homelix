import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { AuthProvider } from "@/components/AuthProvider";
import { SmartRecommendationBell } from "@/components/SmartRecommendationBell";
import { apartments } from "@/lib/apartments";

export const metadata: Metadata = {
  title: "ЖК Солнечный квартал — выбор квартиры с ИИ",
  description: "Интерактивный сайт застройщика с планировками квартир и ИИ-консультантом.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/images/mascot.png"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <AuthProvider>
          <Header />
          {children}
          <SmartRecommendationBell apartments={apartments} />
        </AuthProvider>
      </body>
    </html>
  );
}

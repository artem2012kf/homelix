import type { Metadata } from "next";
import "./globals.css";
import "./i18n.css";
import "./security-ux.css";
import { Header } from "@/components/Header";
import { AuthProvider } from "@/components/AuthProvider";
import { SmartRecommendationBell } from "@/components/SmartRecommendationBell";
import { apartments } from "@/lib/apartments";

export const metadata: Metadata = {
  title: "Homelix — квартиры в новостройках по всей России",
  description:
    "Федеральный каталог квартир с интерактивными планировками, фильтром по городам, подбором мебели и цифровым консультантом.",
  alternates: {
    languages: {
      "ru-RU": "/",
      "en-US": "/en",
      "zh-CN": "/zh"
    }
  },
  icons: {
    icon: "/images/mascot-user.svg",
    shortcut: "/images/mascot-user.svg",
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

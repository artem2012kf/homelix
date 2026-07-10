import type { Metadata } from "next";
import "./globals.css";
import "./i18n.css";
import "./security-ux.css";
import "./hall-theme.css";
import { Header } from "@/components/Header";
import { AuthProvider } from "@/components/AuthProvider";
import { CityProvider } from "@/components/CityProvider";
import { CityChooser } from "@/components/CityChooser";
import { CityMap } from "@/components/CityMap";
import { SiteFooter } from "@/components/SiteFooter";
import { CartProvider } from "@/components/CartProvider";
import { CartDrawer } from "@/components/CartDrawer";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { SmartRecommendationBell } from "@/components/SmartRecommendationBell";
import { apartments } from "@/lib/apartments";

export const metadata: Metadata = {
  title: "ХОЛЛ — квартиры в новостройках по всей России",
  description: "Федеральный каталог квартир ХОЛЛ: выбор города и ЖК, фильтры, интерактивные планировки, мебель с доставкой и заявка на покупку.",
  applicationName: "ХОЛЛ",
  alternates: {
    languages: {
      "ru-RU": "/",
      "en-US": "/en"
    }
  },
  icons: {
    icon: [{ url: "/images/mascot-user.svg", type: "image/svg+xml" }],
    shortcut: "/images/mascot-user.svg",
    apple: "/images/mascot.png"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <AuthProvider>
          <CityProvider apartments={apartments}>
            <CurrencyProvider>
              <CartProvider>
                <Header />
                <CityChooser />
                {children}
                <SiteFooter />
                <CityMap />
                <CartDrawer />
                <SmartRecommendationBell apartments={apartments} />
              </CartProvider>
            </CurrencyProvider>
          </CityProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
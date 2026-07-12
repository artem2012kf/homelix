import type { Metadata } from "next";
import "./globals.css";
import "./i18n.css";
import "./security-ux.css";
import "./hall-theme.css";
import "./hall-components.css";
import "./catalog-responsive.css";
import "./transitions.css";
import "./scroll-reveal.css";
import "./dark-theme.css";
import "./dark-theme-refinements.css";
import "./mobile-header.css";
import { Header } from "@/components/Header";
import { AuthProvider } from "@/components/AuthProvider";
import { CityProvider } from "@/components/CityProvider";
import { CityChooser } from "@/components/CityChooser";
import { CityMap } from "@/components/CityMap";
import { SiteFooter } from "@/components/SiteFooter";
import { CartProvider } from "@/components/CartProvider";
import { CartDrawer } from "@/components/CartDrawer";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { CityRecommendationBell } from "@/components/CityRecommendationBell";
import { PageTransition } from "@/components/PageTransition";
import { ScrollRevealController } from "@/components/ScrollRevealController";
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
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/images/mascot.png"
  }
};

// Тема применяется до гидратации; изменение комментария также безопасно перезапускает Vercel deployment.
const themeScript = `(function(){try{var s=localStorage.getItem("hall-theme");var t=s==="dark"||s==="light"?s:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AuthProvider>
          <CityProvider apartments={apartments}>
            <CurrencyProvider>
              <CartProvider>
                <Header />
                <CityChooser />
                <ScrollRevealController />
                <PageTransition>{children}</PageTransition>
                <SiteFooter />
                <CityMap />
                <CartDrawer />
                <CityRecommendationBell apartments={apartments} />
              </CartProvider>
            </CurrencyProvider>
          </CityProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

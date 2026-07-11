import { LocalizedHomePage } from "@/components/LocalizedHomePage";

// Русская главная страница использует общий локализованный компонент.
export default function HomePage() {
  return <LocalizedHomePage locale="ru" />;
}

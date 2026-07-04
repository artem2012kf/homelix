import Link from "next/link";
import { AuthHeaderActions } from "@/components/AuthHeaderActions";

export function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="На главную">
        <span className="brand-mark">SQ</span>
        <span>
          <strong>Солнечный квартал</strong>
          <small>Интерактивный выбор квартир</small>
        </span>
      </Link>
      <nav className="header-nav" aria-label="Главная навигация">
        <a href="/#apartments">Квартиры</a>
        <Link href="/ai">ИИ без комнат</Link>
        <Link href="/furniture">Магазин мебели</Link>
        <a href="/#contacts">Контакты</a>
        <AuthHeaderActions />
      </nav>
    </header>
  );
}

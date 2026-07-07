import Link from "next/link";
import { YandexMap } from "@/components/YandexMap";

export default function YandexMapPage() {
  return (
    <main>
      <section className="section map-page-hero">
        <div className="section-heading wide-heading">
          <span className="eyebrow">Яндекс.Карта</span>
          <h1>ЖК на реальной карте Тюмени</h1>
          <p>
            Эта страница показывает расположение ЖК «Солнечный квартал» через Яндекс.Карты API.
            Ключ карты нужно добавить в Vercel Environment Variables.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/#apartments">
              Смотреть квартиры
            </Link>
            <Link className="button button-ghost" href="/map">
              Вернуться к карте ЖК
            </Link>
          </div>
        </div>
      </section>

      <section className="section yandex-map-section">
        <div className="section-heading">
          <span className="eyebrow">Тюмень</span>
          <h2>Расположение проекта</h2>
          <p>На карте отмечена точка ЖК. Если карта не появилась, проверьте переменную окружения.</p>
        </div>
        <YandexMap />
      </section>
    </main>
  );
}

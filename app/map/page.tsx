import Link from "next/link";
import { ApartmentBuildingMap } from "@/components/ApartmentBuildingMap";
import { TyumenCityMap } from "@/components/TyumenCityMap";
import { apartments } from "@/lib/apartments";

export default function MapPage() {
  return (
    <main>
      <section className="section map-page-hero">
        <div className="section-heading wide-heading">
          <span className="eyebrow">Карта Тюмени</span>
          <h1>Карта Тюмени и расположение ЖК</h1>
          <p>
            Сначала показана карта Тюмени с точкой ЖК «Солнечный квартал», затем — внутренняя схема корпусов,
            свободные квартиры, бронь и проданные варианты.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/#apartments">
              Смотреть каталог квартир
            </Link>
            <Link className="button button-ghost" href="/ai">
              Спросить ИИ-консультанта
            </Link>
          </div>
        </div>
      </section>

      <section className="section tyumen-city-map-section">
        <TyumenCityMap />
      </section>

      <section className="section map-page-section">
        <div className="section-heading">
          <span className="eyebrow">Схема ЖК</span>
          <h2>Корпуса и квартиры внутри комплекса</h2>
          <p>
            После городской карты можно посмотреть, в каком корпусе находятся квартиры и сколько вариантов доступно.
          </p>
        </div>
        <ApartmentBuildingMap apartments={apartments} />
      </section>
    </main>
  );
}

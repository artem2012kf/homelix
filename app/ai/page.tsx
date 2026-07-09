import Link from "next/link";
import { AiOnlyChat } from "@/components/AiOnlyChat";
import { apartments } from "@/lib/apartments";
import { formatArea, formatPrice, statusLabel } from "@/lib/format";

export default function AiPage() {
  return (
    <main>
      <section className="ai-page-hero">
        <Link href="/" className="back-link">
          ← На главную
        </Link>
        <span className="eyebrow">Отдельный ИИ-консультант</span>
        <h1>Задайте вопрос без выбора комнаты на планировке</h1>
        <p>
          Эта страница подходит для общей консультации: подбор квартиры, сравнение вариантов, вопросы по площади,
          стоимости, этажу, отделке и преимуществам жилого комплекса.
        </p>
      </section>

      <section className="section ai-page-grid">
        <AiOnlyChat />

        <aside className="available-list-card">
          <span className="eyebrow">Демо-каталог</span>
          <h2>Квартиры для консультации</h2>
          <div className="available-list">
            {apartments.map((apartment) => (
              <article key={apartment.id}>
                <div>
                  <span className={`status status-${apartment.status}`}>{statusLabel(apartment.status)}</span>
                  <h3>{apartment.title}</h3>
                  <p>
                    {apartment.building}, {apartment.floor} этаж · {formatArea(apartment.totalArea)}
                  </p>
                </div>
                <strong>{formatPrice(apartment.price)}</strong>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

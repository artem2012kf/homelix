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
        <span className="eyebrow">ИИ-консультант по новостройкам России</span>
        <h1>Назовите город, бюджет и требования к квартире</h1>
        <p>
          Консультант сравнивает предложения из 15 городов, учитывает стоимость, площадь, этаж, комнатность и цель
          покупки. Например: «Подбери двухкомнатную квартиру в Казани до 12 млн ₽».
        </p>
      </section>

      <section className="section ai-page-grid">
        <AiOnlyChat />

        <aside className="available-list-card">
          <span className="eyebrow">30 демонстрационных предложений</span>
          <h2>Квартиры по городам России</h2>
          <div className="available-list">
            {apartments.map((apartment) => (
              <article key={apartment.id}>
                <div>
                  <span className={`status status-${apartment.status}`}>{statusLabel(apartment.status)}</span>
                  <h3>{apartment.city} · {apartment.title}</h3>
                  <p>
                    {apartment.project}, {apartment.building}, {apartment.floor} этаж · {formatArea(apartment.totalArea)}
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
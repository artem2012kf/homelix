import Image from "next/image";
import { ApartmentCatalog } from "@/components/ApartmentCatalog";
import { apartments } from "@/lib/apartments";
import { formatPrice } from "@/lib/format";
import { residentialComplexes } from "@/lib/residential-complexes";

const availableCount = apartments.filter((item) => item.status === "available").length;
const totalCount = apartments.length;
const minPrice = Math.min(...apartments.map((item) => item.price));

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">Готовый сайт застройщика</span>
          <h1>Интерактивный выбор квартиры с ИИ-консультантом и личным кабинетом</h1>
          <p>
            Клиент выбирает квартиру, открывает мини-план, смотрит комнаты, задает вопросы ИИ, сохраняет варианты
            в избранное и бронирует свободные квартиры через аккаунт.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#apartments">
              Смотреть квартиры
            </a>
            <a className="button button-ghost" href="#complexes">
              ЖК Тюмени
            </a>
          </div>
          <div className="hero-stats" aria-label="Ключевые показатели каталога">
            <div>
              <strong>{totalCount}</strong>
              <span>квартир в базе</span>
            </div>
            <div>
              <strong>{availableCount}</strong>
              <span>свободны сейчас</span>
            </div>
            <div>
              <strong>от {formatPrice(minPrice)}</strong>
              <span>стартовая цена</span>
            </div>
          </div>
        </div>

        <div
          className="hero-widget"
          style={{
            position: "relative",
            minHeight: 520,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              width: "min(100%, 430px)",
              minHeight: 430,
              display: "grid",
              placeItems: "center",
              padding: 34,
              border: "1px solid var(--line)",
              borderRadius: 42,
              background:
                "radial-gradient(circle at 50% 28%, rgba(249, 62, 62, 0.12), transparent 13rem), #ffffff",
              boxShadow: "var(--shadow)",
              textAlign: "center"
            }}
          >
            <Image
              src="/images/mascot.png"
              alt="Маскот ЖК Солнечный квартал"
              width={270}
              height={270}
              priority
              style={{ width: "min(78%, 270px)", height: "auto", objectFit: "contain" }}
            />
            <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
              <strong style={{ fontSize: 30, lineHeight: 1, color: "var(--text)" }}>ЖК Тюмени в одном каталоге</strong>
              <span style={{ color: "var(--muted)", lineHeight: 1.45 }}>
                Маскот помогает выбрать квартиру, сравнить жилые комплексы и задать вопрос ИИ-консультанту.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="apartments">
        <div className="section-heading">
          <span className="eyebrow">Каталог</span>
          <h2>Квартиры в продаже</h2>
          <p>
            В карточках указано, в каком ЖК находится квартира: название комплекса, район, корпус, секция, этаж,
            площадь и цена.
          </p>
        </div>
        <ApartmentCatalog apartments={apartments} />
      </section>

      <section className="section" id="complexes">
        <div className="section-heading wide-heading">
          <span className="eyebrow">20 ЖК Тюмени</span>
          <h2>Жилые комплексы, которые можно показывать в каталоге</h2>
          <p>
            Список оформлен нормально: без лишних символов, с районом, оценками, количеством отзывов, уровнем цен и
            застройщиком.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 18
          }}
        >
          {residentialComplexes.map((complex, index) => (
            <article
              key={complex.id}
              style={{
                display: "grid",
                gap: 14,
                padding: 22,
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-xl)",
                background: "rgba(255, 255, 255, 0.86)",
                boxShadow: "0 18px 56px rgba(65, 45, 20, 0.08)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <span
                  style={{
                    display: "grid",
                    minWidth: 42,
                    height: 42,
                    placeItems: "center",
                    borderRadius: 14,
                    color: "#ffffff",
                    background: "var(--primary)",
                    fontWeight: 900
                  }}
                >
                  {index + 1}
                </span>
                {typeof complex.rating === "number" ? (
                  <strong style={{ color: "var(--text)" }}>★ {complex.rating}</strong>
                ) : null}
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: 25, letterSpacing: "-0.04em" }}>{complex.name}</h3>
                <p style={{ margin: "8px 0 0", color: "var(--muted)", lineHeight: 1.45 }}>
                  {complex.district}
                  {complex.microdistrict ? ` · ${complex.microdistrict}` : ""}
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 10
                }}
              >
                <div style={{ padding: 12, borderRadius: 18, background: "#fbf7ef" }}>
                  <small style={{ display: "block", color: "var(--muted)" }}>Общий балл</small>
                  <strong>{complex.score?.toLocaleString("ru-RU") ?? "—"}</strong>
                </div>
                <div style={{ padding: 12, borderRadius: 18, background: "#fbf7ef" }}>
                  <small style={{ display: "block", color: "var(--muted)" }}>Оценок</small>
                  <strong>{complex.reviews?.toLocaleString("ru-RU") ?? "—"}</strong>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {complex.tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: "7px 9px",
                      border: "1px solid var(--line)",
                      borderRadius: 999,
                      color: "var(--muted)",
                      background: "#ffffff",
                      fontSize: 12,
                      fontWeight: 800
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section architecture" id="architecture">
        <div className="section-heading wide-heading">
          <span className="eyebrow">Как работает</span>
          <h2>Полный сценарий выбора и бронирования квартиры</h2>
          <p>
            Раздел показывает логику проекта для сдачи: от просмотра каталога до консультации с ИИ, регистрации,
            избранного и бронирования квартиры.
          </p>
        </div>

        <div className="workflow-panel">
          <article>
            <span>01</span>
            <h3>Каталог</h3>
            <p>Пользователь видит все квартиры, сортирует их по цене, площади, этажу, комнатности и ипотечному платежу.</p>
          </article>
          <article>
            <span>02</span>
            <h3>ЖК</h3>
            <p>У каждой квартиры видно название жилого комплекса, район и основные характеристики объекта.</p>
          </article>
          <article>
            <span>03</span>
            <h3>ИИ-помощник</h3>
            <p>На странице квартиры ИИ получает контекст выбранной комнаты и отвечает по конкретной планировке.</p>
          </article>
          <article>
            <span>04</span>
            <h3>Личный кабинет</h3>
            <p>После регистрации клиент сохраняет избранное и бронирует свободные квартиры.</p>
          </article>
        </div>
      </section>

      <section className="section contacts-section" id="contacts">
        <div className="section-heading">
          <span className="eyebrow">Контакты</span>
          <h2>Офис продаж в Тюмени</h2>
          <p>
            Оставьте заявку на сайте, сохраните квартиру в личном кабинете или забронируйте свободный вариант для
            дальнейшего звонка менеджера.
          </p>
        </div>
        <div className="contacts-grid">
          <article>
            <span>Телефон</span>
            <strong>+7 (900) 000-00-00</strong>
            <p>Ежедневно с 9:00 до 21:00</p>
          </article>
          <article>
            <span>Адрес</span>
            <strong>г. Тюмень</strong>
            <p>Шоурум, консультации и подбор квартиры</p>
          </article>
          <article>
            <span>Email</span>
            <strong>sales@sunny-quarter.ru</strong>
            <p>Заявки, документы и консультации</p>
          </article>
        </div>
      </section>
    </main>
  );
}

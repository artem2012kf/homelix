import { ApartmentCatalog } from "@/components/ApartmentCatalog";
import { MascotLogo } from "@/components/MascotLogo";
import { apartments } from "@/lib/apartments";
import { formatPrice } from "@/lib/format";

const availableCount = apartments.filter((item) => item.status === "available").length;
const totalCount = apartments.length;
const minPrice = Math.min(...apartments.map((item) => item.price));
const projectNames = Array.from(new Set(apartments.map((item) => item.project)));
const buildingNames = Array.from(new Set(apartments.map((item) => item.building)));

function MascotHeroCard() {
  return (
    <div className="mascot-hero-card" aria-label="ИИ-маскот сайта">
      <style>{`
        .mascot-hero-card {
          position: relative;
          overflow: hidden;
          min-height: 520px;
          padding: clamp(22px, 3vw, 34px);
          border: 1px solid var(--line);
          border-radius: 42px;
          background:
            radial-gradient(circle at 22% 18%, rgba(249, 62, 62, 0.14), transparent 180px),
            radial-gradient(circle at 88% 8%, rgba(0, 59, 166, 0.10), transparent 190px),
            linear-gradient(135deg, #ffffff 0%, #f8fbff 54%, #fff4f4 100%);
          box-shadow: var(--shadow);
        }

        .mascot-hero-card::before {
          position: absolute;
          right: -60px;
          top: 38px;
          width: 240px;
          height: 240px;
          border: 1px solid rgba(0, 59, 166, 0.13);
          border-radius: 50%;
          content: "";
        }

        .mascot-hero-card::after {
          position: absolute;
          left: -70px;
          bottom: 80px;
          width: 130%;
          height: 96px;
          border: 2px solid rgba(0, 59, 166, 0.10);
          border-radius: 999px;
          transform: rotate(-10deg);
          content: "";
        }

        .mascot-hero-inner {
          position: relative;
          z-index: 1;
          display: grid;
          min-height: 452px;
          align-content: center;
          justify-items: center;
          text-align: center;
        }

        .mascot-hero-image {
          display: grid;
          width: min(260px, 72vw);
          height: min(260px, 72vw);
          place-items: center;
          overflow: hidden;
          border-radius: 42px;
          background: transparent;
        }

        .mascot-hero-title {
          margin-top: 18px;
          color: var(--text);
          font-size: clamp(26px, 3vw, 38px);
          line-height: 0.95;
          font-weight: 950;
          letter-spacing: -0.05em;
        }

        .mascot-hero-text {
          max-width: 390px;
          margin: 12px auto 0;
          color: var(--muted);
          font-size: 16px;
          line-height: 1.5;
        }

        .mascot-hero-badges {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin-top: 18px;
        }

        .mascot-hero-badges span {
          display: inline-flex;
          min-height: 34px;
          align-items: center;
          padding: 0 12px;
          border: 1px solid rgba(0, 59, 166, 0.14);
          border-radius: 999px;
          color: var(--text);
          background: rgba(255, 255, 255, 0.82);
          font-size: 13px;
          font-weight: 900;
        }

        .mascot-hero-stat {
          position: absolute;
          right: 22px;
          top: 22px;
          z-index: 2;
          width: 154px;
          padding: 18px;
          border: 1px solid var(--line);
          border-radius: 26px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 18px 42px rgba(0, 59, 166, 0.10);
          text-align: left;
        }

        .mascot-hero-stat strong,
        .mascot-hero-stat span {
          display: block;
        }

        .mascot-hero-stat strong {
          color: var(--text);
          font-size: 44px;
          line-height: 1;
          letter-spacing: -0.06em;
        }

        .mascot-hero-stat span {
          margin-top: 6px;
          color: var(--muted);
          font-size: 13px;
          font-weight: 800;
          line-height: 1.25;
        }

        .brand-mark {
          overflow: hidden;
        }

        .brand-mark img {
          display: block !important;
          width: 100% !important;
          height: 100% !important;
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: contain !important;
        }

        @media (max-width: 1050px) {
          .mascot-hero-card {
            min-height: auto;
          }

          .mascot-hero-inner {
            min-height: 390px;
          }
        }

        @media (max-width: 720px) {
          .mascot-hero-stat {
            position: static;
            width: 100%;
            margin-bottom: 16px;
          }

          .mascot-hero-inner {
            min-height: auto;
          }

          .mascot-hero-image {
            width: 190px;
            height: 190px;
          }
        }
      `}</style>

      <div className="mascot-hero-stat">
        <strong>{availableCount}</strong>
        <span>квартиры доступны сейчас</span>
      </div>

      <div className="mascot-hero-inner">
        <div className="mascot-hero-image">
          <MascotLogo />
        </div>
        <div className="mascot-hero-title">ИИ-помощник по квартирам</div>
        <p className="mascot-hero-text">
          Маскот помогает выбрать квартиру, сравнить параметры, сохранить вариант в избранное и перейти к бронированию.
        </p>
        <div className="mascot-hero-badges" aria-label="Краткая информация о проекте">
          <span>{projectNames[0] ?? "ЖК Солнечный квартал"}</span>
          <span>{buildingNames.length} корпусов</span>
          <span>{totalCount} квартир в базе</span>
        </div>
      </div>
    </div>
  );
}

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
            <a className="button button-ghost" href="#architecture">
              Как работает
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

        <div className="hero-widget">
          <MascotHeroCard />
        </div>
      </section>

      <section className="section" id="apartments">
        <div className="section-heading">
          <span className="eyebrow">Каталог</span>
          <h2>Квартиры в продаже</h2>
          <p>
            Каталог показывает актуальные статусы, мини-планы, цены, этажи, площадь и название жилого комплекса для каждой квартиры.
          </p>
        </div>
        <ApartmentCatalog apartments={apartments} />
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
            <h3>Мини-план</h3>
            <p>В карточке сразу видно примерную структуру квартиры: комнаты, санузел, прихожую и лоджию.</p>
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

        <div className="steps-grid extended-steps">
          <article>
            <strong>1</strong>
            <h3>Актуальные статусы</h3>
            <p>Квартиры автоматически группируются: сначала свободные, затем забронированные, затем проданные.</p>
          </article>
          <article>
            <strong>2</strong>
            <h3>Интерактивная SVG-планировка</h3>
            <p>Каждая комната — отдельная зона. При наведении меняется выбранная комната и быстрые подсказки для ИИ.</p>
          </article>
          <article>
            <strong>3</strong>
            <h3>Контекстный ИИ-чат</h3>
            <p>ИИ знает площадь, цену, этаж, отделку, преимущества квартиры и параметры выбранной комнаты.</p>
          </article>
          <article>
            <strong>4</strong>
            <h3>История диалога</h3>
            <p>Чат сохраняет сообщения и не начинает каждый ответ заново с приветствия.</p>
          </article>
          <article>
            <strong>5</strong>
            <h3>Регистрация клиента</h3>
            <p>Почта и пароль дают доступ к избранному, бронированиям и личному кабинету.</p>
          </article>
          <article>
            <strong>6</strong>
            <h3>База данных проекта</h3>
            <p>В проекте есть серверная JSON-база и SQL-схема для перехода на PostgreSQL или Supabase.</p>
          </article>
          <article>
            <strong>7</strong>
            <h3>Магазин мебели</h3>
            <p>Отдельная вкладка показывает мебель с изображениями, ценами, размерами и сроками доставки.</p>
          </article>
          <article>
            <strong>8</strong>
            <h3>Работа в локальной сети</h3>
            <p>Проект можно открыть с другого компьютера по IP-адресу, если сервер запущен с hostname 0.0.0.0.</p>
          </article>
          <article>
            <strong>9</strong>
            <h3>Готовность к расширению</h3>
            <p>Структура позволяет подключить CRM, платежи, админ-панель, менеджеров и реальные SVG-планировки.</p>
          </article>
        </div>
      </section>

      <section className="section contacts-section" id="contacts">
        <div className="section-heading">
          <span className="eyebrow">Контакты</span>
          <h2>Офис продаж ЖК «Солнечный квартал» в Тюмени</h2>
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
            <strong>г. Тюмень, ул. Солнечная, 12</strong>
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

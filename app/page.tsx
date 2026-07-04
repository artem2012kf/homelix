import { ApartmentCatalog } from "@/components/ApartmentCatalog";
import { apartments } from "@/lib/apartments";
import { formatPrice } from "@/lib/format";

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
          <div className="floating-card">
            <strong>{availableCount}</strong>
            <span>квартиры доступны сейчас</span>
          </div>
          <div className="mini-plan">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>

      <section className="section" id="apartments">
        <div className="section-heading">
          <span className="eyebrow">Каталог</span>
          <h2>Квартиры в продаже</h2>
          <p>
            Каталог показывает актуальные статусы, мини-планы, цены, этажи и площадь. Сортировка сохраняет порядок:
            свободные варианты идут первыми, затем бронь и проданные квартиры.
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
          <h2>Офис продаж ЖК «Солнечный квартал»</h2>
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
            <strong>г. Тюмень, Улица Республики, 150, Офис 403</strong>
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

import Link from "next/link";
import type { CSSProperties } from "react";
import { MascotImage } from "@/components/MascotImage";
import { ProjectEconomicsCalculator } from "@/components/ProjectEconomicsCalculator";

const card: CSSProperties = {
  padding: 22,
  border: "1px solid var(--line)",
  borderRadius: 26,
  background: "rgba(255, 255, 255, 0.9)",
  boxShadow: "0 18px 48px rgba(0, 59, 166, 0.08)"
};

const criteria = [
  {
    number: 1,
    title: "Новизна",
    score: "4–5",
    proof: "Единый сценарий объединяет каталог, интерактивную планировку, консультацию, мебель, избранное и бронирование.",
    next: "Для 6+ баллов нужны подтвержденные отличия от решений конкретных конкурентов и результаты пилота."
  },
  {
    number: 2,
    title: "Оформление проекта",
    score: "6–8",
    proof: "Рабочий сайт можно опробовать лично; добавлены единый маскот, интерактивные планы и отдельный паспорт проекта.",
    next: "До 10 баллов не хватает финальной презентации, раздаточного материала и оформленного бизнес-плана."
  },
  {
    number: 3,
    title: "Теория и практика",
    score: "7–9",
    proof: "Проект охватывает интерфейсы, серверные маршруты, типизацию, авторизацию, состояние бронирований и алгоритмы планировок.",
    next: "На защите нужно объяснить архитектуру, ограничения демо и путь к промышленной версии."
  },
  {
    number: 4,
    title: "Рынок и ценностное предложение",
    score: "2–3",
    proof: "Определены клиентские сегменты, боль и базовое сравнение классов конкурентов.",
    next: "Для 6+ баллов обязательны CustDev, отзывы застройщиков и предварительные договоренности."
  },
  {
    number: 5,
    title: "Экономика",
    score: "2–4",
    proof: "Есть прозрачная модель внедрения, подписки, расходов, безубыточности и окупаемости с редактируемыми гипотезами.",
    next: "Нужны реальные затраты команды, подтвержденная цена, письма поддержки и первые платежи."
  },
  {
    number: 6,
    title: "Реальное внедрение",
    score: "8–10",
    proof: "ПО работает онлайн и демонстрирует полный пользовательский путь от выбора до бронирования.",
    next: "Промышленная версия потребует CRM, реальной базы объектов, аналитики, ролей сотрудников и мониторинга."
  },
  {
    number: 7,
    title: "Защита проекта",
    score: "6–9",
    proof: "На странице ниже есть готовый сценарий демонстрации и ответы на ожидаемые вопросы.",
    next: "Фактический балл зависит от выступления команды и способности отвечать без чтения текста."
  },
  {
    number: 8,
    title: "Креативность защиты",
    score: "7–9",
    proof: "Проект имеет узнаваемого маскота, историю боли покупателя и интерактивную демонстрацию вместо статичных слайдов.",
    next: "Для максимума можно добавить короткое видео и физический QR-стенд с запуском демо."
  },
  {
    number: 9,
    title: "TRL",
    score: "6–7",
    proof: "Создан полнофункциональный онлайн-прототип, который можно тестировать в условиях, близких к реальному пользовательскому сценарию.",
    next: "TRL-8/9 потребует эксплуатации у реального застройщика, контроля качества и подтвержденной надежности."
  },
  {
    number: 10,
    title: "Программная сложность",
    score: "7–9",
    proof: "Собственные модули планировок, мебели, рекомендаций, авторизации, бронирований и адаптивного интерфейса работают совместно.",
    next: "На защите нужно показать код ключевых алгоритмов и объяснить, что не является готовым шаблоном."
  }
] as const;

const segments = [
  {
    title: "Застройщик и отдел продаж",
    pain: "Покупателю трудно представить жизнь в квартире, а менеджер повторяет одинаковые консультации.",
    value: "Интерактивная демонстрация, самостоятельный подбор и квалификация интереса до звонка менеджера."
  },
  {
    title: "Покупатель квартиры",
    pain: "Каталоги показывают цену и площадь, но плохо объясняют планировку, мебель и семейные сценарии.",
    value: "План, консультация по комнатам, сохранение вариантов и понятный путь к бронированию в одном интерфейсе."
  },
  {
    title: "Мебельный партнер",
    pain: "Товар показывается отдельно от конкретной квартиры и реального пространства клиента.",
    value: "Подбор и размещение мебели на плане создает дополнительный канал лидов и партнерской монетизации."
  }
] as const;

const comparison = [
  ["Обычный сайт застройщика", "Точные данные конкретного ЖК", "Слабая персонализация и статичные планировки"],
  ["Агрегатор недвижимости", "Большой выбор объектов", "Нет глубокого контекста конкретного проекта и комнат"],
  ["Отдельный чат-виджет", "Быстрые ответы", "Не связан с планом, мебелью, аккаунтом и бронированием"],
  ["Homelix", "Единый интерактивный путь и визуальный контекст", "Нужны CustDev, CRM-интеграция и реальный пилот"]
] as const;

const demoSteps = [
  "Показать проблему: покупатель видит десятки карточек, но не понимает, подходит ли квартира его семье.",
  "Открыть каталог и отфильтровать объекты по цене, площади и комнатности.",
  "Перейти в квартиру, выбрать комнату на плане и задать вопрос консультанту.",
  "Разместить мебель на планировке и показать ручное перемещение предмета.",
  "Войти в аккаунт, добавить объект в избранное и выполнить демонстрационное бронирование.",
  "Открыть экономический калькулятор и назвать, какие показатели являются гипотезой, а какие подтверждены кодом."
] as const;

export default function ProjectPage() {
  return (
    <main>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "clamp(24px, 5vw, 64px)",
          alignItems: "center",
          padding: "clamp(48px, 7vw, 92px) clamp(18px, 4vw, 64px)"
        }}
      >
        <div>
          <Link href="/" className="back-link">
            ← На главную
          </Link>
          <span className="eyebrow">Паспорт проекта для жюри</span>
          <h1 style={{ margin: 0, fontSize: "clamp(42px, 7vw, 78px)", lineHeight: 0.98, letterSpacing: "-0.065em" }}>
            Homelix: выбор квартиры через интерактивный план и цифрового помощника
          </h1>
          <p style={{ margin: "24px 0 0", maxWidth: 760, color: "var(--muted)", fontSize: 19, lineHeight: 1.55 }}>
            Эта страница связывает рабочие функции сайта с критериями оценки. Самооценка намеренно консервативная: пилоты, продажи, CustDev и письма поддержки не считаются выполненными, пока у команды нет подтверждающих документов.
          </p>
          <div className="hero-actions">
            <Link href="/#apartments" className="button button-primary">
              Открыть демо
            </Link>
            <a href="#criteria" className="button button-ghost">
              Смотреть критерии
            </a>
          </div>
        </div>

        <div style={{ ...card, display: "grid", placeItems: "center", textAlign: "center", minHeight: 430 }}>
          <MascotImage
            width={230}
            priority
            alt="Маскот Homelix"
            style={{ width: "min(72%, 230px)", height: "auto", filter: "drop-shadow(0 24px 34px rgba(249, 62, 62, 0.24))" }}
          />
          <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
            <strong style={{ fontSize: 30 }}>Маскот — элемент бренда и защиты</strong>
            <span style={{ color: "var(--muted)", lineHeight: 1.45 }}>
              Он объединяет главный экран, навигацию и консультацию, помогая идентифицировать проект.
            </span>
          </div>
        </div>
      </section>

      <section className="section" id="proof">
        <div className="section-heading wide-heading">
          <span className="eyebrow">Что уже подтверждено</span>
          <h2>Не макет, а работающий пользовательский сценарий</h2>
          <p>Все перечисленные элементы доступны в текущем онлайн-прототипе и могут быть показаны жюри без презентационных обещаний.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {[
            ["Каталог", "Фильтрация и сравнение квартир по цене, площади, этажу, комнатности и статусу."],
            ["Интерактивный план", "Комнаты выбираются на SVG-планировке; автоматически создаются стены, двери и окна."],
            ["Мебель", "Предметы подбираются по категории и бюджету, размещаются на плане и двигаются вручную."],
            ["Личный кабинет", "Регистрация, вход, избранное, бронирование и отмена брони связаны с серверными маршрутами."],
            ["Консультант", "Ответы учитывают квартиру, выбранную комнату, цену, параметры и пользовательский запрос."],
            ["Адаптивность", "Основные сценарии рассчитаны на компьютер и мобильный экран."]
          ].map(([title, text]) => (
            <article key={title} style={card}>
              <h3 style={{ margin: 0, fontSize: 24 }}>{title}</h3>
              <p style={{ margin: "10px 0 0", color: "var(--muted)", lineHeight: 1.5 }}>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="criteria">
        <div className="section-heading wide-heading">
          <span className="eyebrow">Самооценка</span>
          <h2>Сверка с десятью критериями</h2>
          <p>Диапазоны являются ориентиром, а не обещанием балла: итоговая оценка зависит от доказательств и выступления команды.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {criteria.map((criterion) => (
            <article key={criterion.number} style={{ ...card, display: "grid", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <span
                  style={{
                    display: "grid",
                    width: 42,
                    height: 42,
                    placeItems: "center",
                    borderRadius: 14,
                    color: "#ffffff",
                    background: "var(--primary)",
                    fontWeight: 900
                  }}
                >
                  {criterion.number}
                </span>
                <strong style={{ padding: "8px 12px", borderRadius: 999, color: "#ffffff", background: "#003BA6" }}>
                  {criterion.score} / 10
                </strong>
              </div>
              <h3 style={{ margin: 0, fontSize: 25 }}>{criterion.title}</h3>
              <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--text)" }}>Основание: </strong>
                {criterion.proof}
              </p>
              <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--primary-dark)" }}>Чтобы повысить балл: </strong>
                {criterion.next}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="market">
        <div className="section-heading wide-heading">
          <span className="eyebrow">MRL и рынок</span>
          <h2>Кому нужен продукт и какую боль он решает</h2>
          <p>Сегменты и предложения сформулированы, но пока считаются гипотезой — без интервью и пилота нельзя заявлять MRL-6.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 16 }}>
          {segments.map((segment) => (
            <article key={segment.title} style={card}>
              <h3 style={{ margin: 0, fontSize: 25 }}>{segment.title}</h3>
              <p style={{ margin: "14px 0 0", color: "var(--muted)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--primary-dark)" }}>Боль: </strong>
                {segment.pain}
              </p>
              <p style={{ margin: "12px 0 0", color: "var(--muted)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--text)" }}>Ценность: </strong>
                {segment.value}
              </p>
            </article>
          ))}
        </div>

        <div style={{ ...card, marginTop: 18, overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {['Класс решения', 'Сильная сторона', 'Ограничение'].map((title) => (
                  <th key={title} style={{ padding: 14, borderBottom: "1px solid var(--line)", textAlign: "left" }}>{title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell) => (
                    <td key={cell} style={{ padding: 14, borderBottom: "1px solid var(--line)", color: "var(--muted)", lineHeight: 1.45 }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" id="economics">
        <ProjectEconomicsCalculator />
      </section>

      <section className="section" id="readiness">
        <div className="section-heading wide-heading">
          <span className="eyebrow">Готовность</span>
          <h2>TRL-6 как честная текущая позиция</h2>
          <p>Прототип полнофункционален и работает онлайн, но еще не подтвержден эксплуатацией у реального застройщика.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {[
            ["Сейчас", "Онлайн-демо, каталог, планировки, мебель, аккаунт и бронирование работают как единый продукт."],
            ["Следующий шаг", "Подключить настоящую базу объектов и CRM, провести 8–12 интервью с отделами продаж."],
            ["Пилот", "Запустить один ЖК, измерить конверсию в заявку, глубину просмотра, сохранения и бронирования."],
            ["Промышленная версия", "Добавить роли сотрудников, аудит, аналитику, резервное копирование, SLA и мониторинг."]
          ].map(([title, text]) => (
            <article key={title} style={card}>
              <h3 style={{ margin: 0, fontSize: 24 }}>{title}</h3>
              <p style={{ margin: "10px 0 0", color: "var(--muted)", lineHeight: 1.5 }}>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="defense">
        <div className="section-heading wide-heading">
          <span className="eyebrow">Защита проекта</span>
          <h2>Сценарий демонстрации на 5 минут</h2>
          <p>Лучше показывать продукт в действии, а не перечислять функции со слайда.</p>
        </div>
        <div style={{ ...card, display: "grid", gap: 12 }}>
          {demoSteps.map((step, index) => (
            <div key={step} style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 14, alignItems: "start" }}>
              <span style={{ display: "grid", width: 40, height: 40, placeItems: "center", borderRadius: 14, color: "#fff", background: "var(--primary)", fontWeight: 900 }}>
                {index + 1}
              </span>
              <p style={{ margin: 0, paddingTop: 8, color: "var(--muted)", lineHeight: 1.5 }}>{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 26 }}>
        <div style={{ ...card, display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 18, alignItems: "center", background: "#003BA6", color: "#ffffff" }}>
          <div>
            <span style={{ opacity: 0.76, fontWeight: 800 }}>Главный вывод</span>
            <h2 style={{ margin: "8px 0 0", fontSize: "clamp(28px, 4vw, 44px)" }}>Сильная сторона проекта — работающий комплексный прототип.</h2>
            <p style={{ margin: "10px 0 0", maxWidth: 780, opacity: 0.82, lineHeight: 1.5 }}>
              Главный резерв роста оценки — не новые декоративные функции, а подтверждение рынка: CustDev, письмо от застройщика, пилот и реальные показатели.
            </p>
          </div>
          <Link href="/#apartments" className="button" style={{ color: "#003BA6", background: "#ffffff" }}>
            Перейти к демонстрации
          </Link>
        </div>
      </section>
    </main>
  );
}

"use client";

import { useMemo, useState } from "react";

const money = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0
});

type NumberFieldProps = {
  label: string;
  value: number;
  min: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
};

function NumberField({ label, value, min, step, suffix, onChange }: NumberFieldProps) {
  return (
    <label
      style={{
        display: "grid",
        gap: 7,
        padding: 14,
        border: "1px solid var(--line)",
        borderRadius: 18,
        background: "#ffffff"
      }}
    >
      <span style={{ color: "var(--muted)", fontSize: 13, fontWeight: 800 }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(event) => {
            const next = Number(event.target.value);
            onChange(Number.isFinite(next) ? Math.max(min, next) : min);
          }}
          style={{
            width: "100%",
            minWidth: 0,
            padding: "10px 12px",
            border: "1px solid var(--line)",
            borderRadius: 12,
            color: "var(--text)",
            background: "#fbf7ef",
            fontWeight: 900
          }}
        />
        {suffix ? <small style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>{suffix}</small> : null}
      </span>
    </label>
  );
}

export function ProjectEconomicsCalculator() {
  const [clients, setClients] = useState(5);
  const [newImplementations, setNewImplementations] = useState(1);
  const [implementationPrice, setImplementationPrice] = useState(180_000);
  const [subscriptionPrice, setSubscriptionPrice] = useState(45_000);
  const [variableCost, setVariableCost] = useState(12_000);
  const [fixedCosts, setFixedCosts] = useState(150_000);
  const [initialInvestment, setInitialInvestment] = useState(600_000);

  const metrics = useMemo(() => {
    const recurringRevenue = clients * subscriptionPrice;
    const implementationRevenue = newImplementations * implementationPrice;
    const revenue = recurringRevenue + implementationRevenue;
    const costs = fixedCosts + clients * variableCost;
    const operatingProfit = revenue - costs;
    const paybackMonths = operatingProfit > 0 ? initialInvestment / operatingProfit : null;
    const breakEvenClients = subscriptionPrice > variableCost
      ? Math.ceil(Math.max(0, fixedCosts - implementationRevenue) / (subscriptionPrice - variableCost))
      : null;

    return {
      recurringRevenue,
      implementationRevenue,
      revenue,
      costs,
      operatingProfit,
      paybackMonths,
      breakEvenClients
    };
  }, [clients, fixedCosts, implementationPrice, initialInvestment, newImplementations, subscriptionPrice, variableCost]);

  const metricCards = [
    ["Выручка в месяц", money.format(metrics.revenue)],
    ["Расходы в месяц", money.format(metrics.costs)],
    ["Операционный результат", money.format(metrics.operatingProfit)],
    ["Окупаемость вложений", metrics.paybackMonths ? `${metrics.paybackMonths.toFixed(1)} мес.` : "не достигнута"],
    ["Точка безубыточности", metrics.breakEvenClients === null ? "не рассчитывается" : `${metrics.breakEvenClients} клиентов`],
    ["Регулярная выручка", money.format(metrics.recurringRevenue)]
  ] as const;

  return (
    <section
      style={{
        display: "grid",
        gap: 20,
        padding: "clamp(20px, 4vw, 34px)",
        border: "1px solid var(--line)",
        borderRadius: 32,
        background: "linear-gradient(145deg, rgba(255,255,255,0.96), rgba(255,246,238,0.92))",
        boxShadow: "var(--shadow)"
      }}
    >
      <div>
        <span className="eyebrow">Экономическая модель</span>
        <h2 style={{ margin: 0, fontSize: "clamp(30px, 4vw, 48px)", letterSpacing: "-0.04em" }}>
          Проверяемая гипотеза, а не выдуманная отчетность
        </h2>
        <p style={{ margin: "14px 0 0", maxWidth: 820, color: "var(--muted)", lineHeight: 1.55 }}>
          Значения можно менять во время защиты. Калькулятор показывает логику выручки, затрат, точки безубыточности и срока окупаемости. До первых договоренностей эти цифры считаются гипотезой и должны быть подтверждены CustDev.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
        <NumberField label="Действующие клиенты" value={clients} min={0} step={1} onChange={setClients} />
        <NumberField label="Новых внедрений в месяц" value={newImplementations} min={0} step={1} onChange={setNewImplementations} />
        <NumberField label="Стоимость внедрения" value={implementationPrice} min={0} step={10_000} suffix="₽" onChange={setImplementationPrice} />
        <NumberField label="Подписка с клиента" value={subscriptionPrice} min={0} step={5_000} suffix="₽/мес." onChange={setSubscriptionPrice} />
        <NumberField label="Переменные расходы" value={variableCost} min={0} step={1_000} suffix="₽/клиент" onChange={setVariableCost} />
        <NumberField label="Постоянные расходы" value={fixedCosts} min={0} step={10_000} suffix="₽/мес." onChange={setFixedCosts} />
        <NumberField label="Начальные вложения" value={initialInvestment} min={0} step={50_000} suffix="₽" onChange={setInitialInvestment} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
        {metricCards.map(([label, value]) => (
          <article key={label} style={{ padding: 18, borderRadius: 20, background: "#003BA6", color: "#ffffff" }}>
            <span style={{ display: "block", fontSize: 13, opacity: 0.78 }}>{label}</span>
            <strong style={{ display: "block", marginTop: 8, fontSize: 23, lineHeight: 1.1 }}>{value}</strong>
          </article>
        ))}
      </div>

      <small style={{ color: "var(--muted)", lineHeight: 1.5 }}>
        Демо-расчет не является финансовым прогнозом или подтверждением продаж. Для балла MRL-6 и выше нужны интервью, письма поддержки или договоренности с застройщиками.
      </small>
    </section>
  );
}

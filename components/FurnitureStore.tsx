"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CurrencyPrice, useCurrency } from "@/components/CurrencyProvider";
import { useCart } from "@/components/CartProvider";
import { useCity } from "@/components/CityProvider";
import { furnitureCategoryLabels, furnitureItems } from "@/lib/furniture";
import type { FurnitureCategory } from "@/types/furniture";

const categoryOrder: FurnitureCategory[] = ["sofa", "bed", "table", "storage", "kitchen", "bathroom", "lighting", "decor"];

export function FurnitureStore() {
  const { selectedCity, selectedProject } = useCity();
  const { addItem, count, subtotal, deliveryPrice, deliveryWindow, openCart } = useCart();
  const { isEnglish, source } = useCurrency();
  const [category, setCategory] = useState<FurnitureCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [addedId, setAddedId] = useState("");

  const items = useMemo(() => furnitureItems.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (query.trim()) {
      const haystack = `${item.title} ${item.room} ${item.description} ${item.tags.join(" ")}`.toLowerCase();
      if (!haystack.includes(query.trim().toLowerCase())) return false;
    }
    return true;
  }), [category, query]);

  function add(item: (typeof furnitureItems)[number]) {
    addItem(item);
    setAddedId(item.id);
    window.setTimeout(() => setAddedId((current) => current === item.id ? "" : current), 1400);
  }

  return (
    <main>
      <section className="furniture-hero hall-furniture-hero">
        <div>
          <span className="eyebrow">{isEnglish ? "Furniture & delivery" : "Мебель и доставка"}</span>
          <h1>{isEnglish ? "Complete your HALL apartment" : "Соберите интерьер для квартиры ХОЛЛ"}</h1>
          <p>
            {isEnglish
              ? `Furniture will be delivered to the selected apartment in ${selectedCity}. Prices are shown in USD using an automatically refreshed rate.`
              : `Добавляйте товары в корзину, выбирайте квартиру в ${selectedCity} и сразу смотрите стоимость и срок доставки.`}
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#furniture-list">{isEnglish ? "Browse furniture" : "Смотреть мебель"}</a>
            <Link className="button button-ghost" href="/#apartments">{isEnglish ? "Choose apartment" : "Выбрать квартиру"}</Link>
          </div>
        </div>
        <aside className="furniture-summary-card hall-cart-summary">
          <span>{selectedProject}</span>
          <strong>{count}</strong>
          <small>{isEnglish ? "items in cart" : "товаров в корзине"}</small>
          <dl>
            <div><dt>{isEnglish ? "Furniture" : "Мебель"}</dt><dd><CurrencyPrice value={subtotal} /></dd></div>
            <div><dt>{isEnglish ? "Delivery" : "Доставка"}</dt><dd><CurrencyPrice value={deliveryPrice} /></dd></div>
            <div><dt>{isEnglish ? "Timing" : "Срок"}</dt><dd>{deliveryWindow}</dd></div>
          </dl>
          <button className="button button-primary" type="button" onClick={openCart}>{isEnglish ? "Open cart" : "Открыть корзину"}</button>
          {isEnglish ? <small>Exchange rate: {source === "live" ? "live" : "fallback"}</small> : null}
        </aside>
      </section>

      <section className="section furniture-section" id="furniture-list">
        <div className="section-heading">
          <span className="eyebrow">{isEnglish ? "Catalog" : "Каталог"}</span>
          <h2>{isEnglish ? "Furniture for every room" : "Мебель для каждой комнаты"}</h2>
          <p>{isEnglish ? "All product images are delivered by Next.js in AVIF when the browser supports it." : "Изображения автоматически отдаются в AVIF, если формат поддерживается браузером."}</p>
        </div>

        <div className="furniture-store-toolbar">
          <label>
            <span>{isEnglish ? "Search" : "Поиск"}</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isEnglish ? "Sofa, bed, desk..." : "Диван, кровать, стол..."} />
          </label>
          <div className="furniture-category-nav" aria-label={isEnglish ? "Furniture categories" : "Категории мебели"}>
            <button type="button" className={category === "all" ? "is-active" : ""} onClick={() => setCategory("all")}>{isEnglish ? "All" : "Все"}</button>
            {categoryOrder.map((value) => (
              <button type="button" className={category === value ? "is-active" : ""} onClick={() => setCategory(value)} key={value}>{furnitureCategoryLabels[value]}</button>
            ))}
          </div>
        </div>

        <div className="furniture-grid hall-furniture-grid">
          {items.map((item) => (
            <article className="furniture-card" key={item.id}>
              <div className={`furniture-visual furniture-visual-${item.category}`}>
                {item.image ? (
                  <Image src={item.image} alt={item.title} width={640} height={650} className="furniture-image" sizes="(max-width: 720px) 100vw, 33vw" />
                ) : <span>{furnitureCategoryLabels[item.category]}</span>}
              </div>
              <div className="furniture-card-body">
                <div className="furniture-card-topline"><span>{item.room}</span>{item.oldPrice ? <strong>{isEnglish ? "Sale" : "Скидка"}</strong> : null}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className="furniture-price-row">
                  <strong><CurrencyPrice value={item.price} /></strong>
                  {item.oldPrice ? <s><CurrencyPrice value={item.oldPrice} /></s> : null}
                </div>
                <dl className="furniture-specs">
                  <div><dt>{isEnglish ? "Size" : "Размер"}</dt><dd>{item.dimensions}</dd></div>
                  <div><dt>{isEnglish ? "Material" : "Материал"}</dt><dd>{item.material}</dd></div>
                  <div><dt>{isEnglish ? "Color" : "Цвет"}</dt><dd>{item.color}</dd></div>
                  <div><dt>{isEnglish ? "Delivery" : "Доставка"}</dt><dd>{item.delivery}</dd></div>
                </dl>
                <button className="button button-primary furniture-button" type="button" onClick={() => add(item)}>
                  {addedId === item.id ? (isEnglish ? "Added" : "Добавлено") : (isEnglish ? "Add to cart" : "В корзину")}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
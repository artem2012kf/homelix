"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CurrencyPrice, useCurrency } from "@/components/CurrencyProvider";
import { useCart } from "@/components/CartProvider";
import { useCity } from "@/components/CityProvider";
import { furnitureCategoryLabels, furnitureItems } from "@/lib/furniture";
import { localizePath } from "@/lib/locale-path";
import type { FurnitureCategory } from "@/types/furniture";

const categoryOrder: FurnitureCategory[] = ["sofa", "bed", "table", "storage", "kitchen", "bathroom", "lighting", "decor"];
const categoryLabelsEn: Record<FurnitureCategory, string> = {
  sofa: "Sofas",
  bed: "Beds",
  table: "Tables",
  storage: "Storage",
  kitchen: "Kitchens",
  bathroom: "Bathroom",
  lighting: "Lighting",
  decor: "Decor"
};

function englishTitle(title: string) {
  return title
    .replace(/^Угловой диван\s+/i, "Corner sofa ")
    .replace(/^Диван\s+/i, "Sofa ")
    .replace(/^Кровать\s+/i, "Bed ")
    .replace(/^Обеденный стол\s+/i, "Dining table ")
    .replace(/^Рабочий стол\s+/i, "Desk ")
    .replace(/^Шкаф\s+/i, "Wardrobe ")
    .replace(/^Гардеробная система\s+/i, "Walk-in closet system ")
    .replace(/^Кухонный гарнитур\s+/i, "Kitchen set ")
    .replace(/^Кухонный остров\s+/i, "Kitchen island ")
    .replace(/^Тумба под раковину\s+/i, "Vanity unit ")
    .replace(/^Трековая система\s+/i, "Track lighting ")
    .replace(/^Комплект текстиля\s+/i, "Textile set ")
    .replace(/^Детская система\s+/i, "Kids room set ")
    .replace(/^Кресло\s+/i, "Armchair ")
    .replace(/^Пуф\s+/i, "Ottoman ")
    .replace(/^Балконный набор\s+/i, "Balcony set ");
}

function englishRoom(room: string) {
  return room
    .replace(/Кухня-гостиная/gi, "Kitchen-living room")
    .replace(/Мастер-спальня/gi, "Primary bedroom")
    .replace(/Спальня/gi, "Bedroom")
    .replace(/Гостиная/gi, "Living room")
    .replace(/Прихожая/gi, "Hallway")
    .replace(/Гардеробная/gi, "Walk-in closet")
    .replace(/Санузел/gi, "Bathroom")
    .replace(/Кухня/gi, "Kitchen")
    .replace(/Детская/gi, "Kids room")
    .replace(/Кабинет/gi, "Study")
    .replace(/Лоджия/gi, "Loggia")
    .replace(/коридор/gi, "corridor")
    .replace(/студия/gi, "studio");
}

function englishDescription(category: FurnitureCategory) {
  const descriptions: Record<FurnitureCategory, string> = {
    sofa: "Comfortable seating selected for modern apartments while keeping circulation routes clear.",
    bed: "A practical bed for a comfortable bedroom with space for bedside storage.",
    table: "A compact table designed for dining, work or study without overcrowding the room.",
    storage: "A storage solution that uses wall space efficiently and keeps the room organized.",
    kitchen: "A functional kitchen module designed for integrated appliances and everyday use.",
    bathroom: "Moisture-resistant bathroom furniture with practical enclosed storage.",
    lighting: "Flexible lighting for zoning the room and creating comfortable everyday scenarios.",
    decor: "A coordinated decor set that adds comfort and a finished look to the interior."
  };
  return descriptions[category];
}

function englishMaterial(value: string) {
  return value
    .replace(/массив березы/gi, "solid birch")
    .replace(/массив дуба/gi, "solid oak")
    .replace(/шпон дуба/gi, "oak veneer")
    .replace(/металл/gi, "metal")
    .replace(/текстиль/gi, "textile")
    .replace(/велюр/gi, "velvet")
    .replace(/рогожка/gi, "woven fabric")
    .replace(/фанера/gi, "plywood")
    .replace(/зеркало/gi, "mirror")
    .replace(/алюминиевый профиль/gi, "aluminium profile")
    .replace(/керамика/gi, "ceramic")
    .replace(/ротанг/gi, "rattan")
    .replace(/лен/gi, "linen")
    .replace(/хлопок/gi, "cotton")
    .replace(/кварцевый агломерат/gi, "quartz composite")
    .replace(/ортопедическое основание/gi, "orthopaedic base")
    .replace(/подъемный механизм/gi, "lift-up mechanism");
}

function englishColor(value: string) {
  return value
    .replace(/теплый бежевый/gi, "warm beige")
    .replace(/серо-песочный/gi, "sand grey")
    .replace(/светло-серый/gi, "light grey")
    .replace(/молочный/gi, "ivory")
    .replace(/натуральный дуб/gi, "natural oak")
    .replace(/белый матовый/gi, "matte white")
    .replace(/белый глянец/gi, "gloss white")
    .replace(/черный матовый/gi, "matte black")
    .replace(/теплый песочный/gi, "warm sand")
    .replace(/кремовый/gi, "cream")
    .replace(/терракотовый/gi, "terracotta")
    .replace(/графит/gi, "graphite")
    .replace(/натуральный ротанг/gi, "natural rattan")
    .replace(/белый/gi, "white")
    .replace(/дуб/gi, "oak");
}

function englishDelivery(value: string) {
  return value.replace(/дней/gi, "days").replace(/день/gi, "day");
}

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
      const localizedTitle = isEnglish ? englishTitle(item.title) : item.title;
      const localizedRoom = isEnglish ? englishRoom(item.room) : item.room;
      const localizedDescription = isEnglish ? englishDescription(item.category) : item.description;
      const haystack = `${localizedTitle} ${localizedRoom} ${localizedDescription} ${item.tags.join(" ")}`.toLowerCase();
      if (!haystack.includes(query.trim().toLowerCase())) return false;
    }
    return true;
  }), [category, isEnglish, query]);

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
            <Link className="button button-ghost" href={`${localizePath(isEnglish ? "en" : "ru", "/")}#apartments`}>{isEnglish ? "Choose apartment" : "Выбрать квартиру"}</Link>
          </div>
        </div>
        <aside className="furniture-summary-card hall-cart-summary">
          <span>{selectedProject || (isEnglish ? "Any project" : "Любой ЖК")}</span>
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
          <p>{isEnglish ? "Product images are delivered by Next.js in AVIF when the browser supports it." : "Изображения автоматически отдаются в AVIF, если формат поддерживается браузером."}</p>
        </div>

        <div className="furniture-store-toolbar">
          <label>
            <span>{isEnglish ? "Search" : "Поиск"}</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isEnglish ? "Sofa, bed, desk..." : "Диван, кровать, стол..."} />
          </label>
          <div className="furniture-category-nav" aria-label={isEnglish ? "Furniture categories" : "Категории мебели"}>
            <button type="button" className={category === "all" ? "is-active" : ""} onClick={() => setCategory("all")}>{isEnglish ? "All" : "Все"}</button>
            {categoryOrder.map((value) => (
              <button type="button" className={category === value ? "is-active" : ""} onClick={() => setCategory(value)} key={value}>{isEnglish ? categoryLabelsEn[value] : furnitureCategoryLabels[value]}</button>
            ))}
          </div>
        </div>

        <div className="furniture-grid hall-furniture-grid">
          {items.map((item) => {
            const title = isEnglish ? englishTitle(item.title) : item.title;
            const room = isEnglish ? englishRoom(item.room) : item.room;
            const description = isEnglish ? englishDescription(item.category) : item.description;
            return (
              <article className="furniture-card" key={item.id}>
                <div className={`furniture-visual furniture-visual-${item.category}`}>
                  {item.image ? (
                    <Image src={item.image} alt={title} width={640} height={650} className="furniture-image" sizes="(max-width: 720px) 100vw, 33vw" />
                  ) : <span>{isEnglish ? categoryLabelsEn[item.category] : furnitureCategoryLabels[item.category]}</span>}
                </div>
                <div className="furniture-card-body">
                  <div className="furniture-card-topline"><span>{room}</span>{item.oldPrice ? <strong>{isEnglish ? "Sale" : "Скидка"}</strong> : null}</div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <div className="furniture-price-row">
                    <strong><CurrencyPrice value={item.price} /></strong>
                    {item.oldPrice ? <s><CurrencyPrice value={item.oldPrice} /></s> : null}
                  </div>
                  <dl className="furniture-specs">
                    <div><dt>{isEnglish ? "Size" : "Размер"}</dt><dd>{item.dimensions.replace(/см/gi, "cm").replace(/ м([,\s])/g, " m$1")}</dd></div>
                    <div><dt>{isEnglish ? "Material" : "Материал"}</dt><dd>{isEnglish ? englishMaterial(item.material) : item.material}</dd></div>
                    <div><dt>{isEnglish ? "Color" : "Цвет"}</dt><dd>{isEnglish ? englishColor(item.color) : item.color}</dd></div>
                    <div><dt>{isEnglish ? "Delivery" : "Доставка"}</dt><dd>{isEnglish ? englishDelivery(item.delivery) : item.delivery}</dd></div>
                  </dl>
                  <button className="button button-primary furniture-button" type="button" onClick={() => add(item)}>
                    {addedId === item.id ? (isEnglish ? "Added" : "Добавлено") : (isEnglish ? "Add to cart" : "В корзину")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

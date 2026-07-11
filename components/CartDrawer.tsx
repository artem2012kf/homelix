"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { useCity } from "@/components/CityProvider";
import { useAuth } from "@/components/AuthProvider";
import { CurrencyPrice, useCurrency } from "@/components/CurrencyProvider";
import { apartments } from "@/lib/apartments";
import {
  getLocaleFromPathname,
  localizeApartment,
  translateComplexName,
  translatePlace
} from "@/lib/i18n";
import { localizePath } from "@/lib/locale-path";

function englishDelivery(value: string) {
  return value.replace(/дней/gi, "days").replace(/дня/gi, "days").replace(/день/gi, "day");
}

function englishFurnitureTitle(title: string) {
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

export function CartDrawer() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const isEnglish = locale === "en";
  const router = useRouter();
  const { user } = useAuth();
  const { selectedCity, selectedProject } = useCity();
  const { isEnglish: currencyIsEnglish } = useCurrency();
  const {
    lines,
    count,
    subtotal,
    deliveryPrice,
    total,
    deliveryWindow,
    selectedApartmentId,
    isOpen,
    storageMode,
    isSyncing,
    closeCart,
    removeItem,
    setQuantity,
    clear,
    setSelectedApartmentId
  } = useCart();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const deliveryApartments = apartments.filter((item) => item.city === selectedCity && item.status !== "sold");
  const cityLabel = translatePlace(selectedCity, locale);

  async function checkout() {
    if (!user) {
      setMessage(isEnglish ? "Sign in to place the order." : "Для оформления войдите в личный кабинет.");
      router.push(localizePath(locale, "/account"));
      return;
    }
    if (!lines.length) return;
    setPending(true);
    setMessage(isEnglish ? "Submitting the request..." : "Отправляем заявку...");
    try {
      const response = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "furniture",
          city: selectedCity,
          project: selectedProject,
          apartmentId: selectedApartmentId || undefined,
          deliveryPrice,
          deliveryWindow,
          furniture: lines.map((line) => ({ itemId: line.item.id, quantity: line.quantity }))
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(isEnglish ? "Could not place the order." : data.error || "Не удалось оформить заказ.");
      setMessage(
        isEnglish
          ? `Request ${data.requestId} was accepted. A manager will confirm the delivery date.`
          : `Заявка ${data.requestId} принята. Менеджер уточнит дату доставки.`
      );
      clear();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : isEnglish ? "Could not place the order." : "Не удалось оформить заказ.");
    } finally {
      setPending(false);
    }
  }

  if (!isOpen) return null;

  const storageText = isSyncing
    ? isEnglish ? "Saving cart..." : "Сохраняем корзину..."
    : storageMode === "account"
      ? isEnglish ? "Saved to your account" : "Сохранено в аккаунте"
      : isEnglish ? "Sign in to sync this cart across devices" : "Войдите, чтобы синхронизировать корзину между устройствами";

  return (
    <div className="cart-backdrop" role="presentation" onMouseDown={closeCart}>
      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={isEnglish ? "Furniture cart" : "Корзина мебели"}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="cart-head">
          <div>
            <span className="eyebrow">{isEnglish ? "Furniture with delivery" : "Мебель с доставкой"}</span>
            <h2>{isEnglish ? "Cart" : "Корзина"} · {count}</h2>
            <small aria-live="polite">{storageText}</small>
          </div>
          <button className="icon-button" type="button" onClick={closeCart} aria-label={isEnglish ? "Close cart" : "Закрыть корзину"}>×</button>
        </div>

        <div className="cart-lines">
          {lines.length ? lines.map((line) => (
            <article className="cart-line" key={line.item.id}>
              <div>
                <strong>{isEnglish ? englishFurnitureTitle(line.item.title) : line.item.title}</strong>
                <span>{currencyIsEnglish ? englishDelivery(line.item.delivery) : line.item.delivery} · <CurrencyPrice value={line.item.price} /></span>
              </div>
              <div className="cart-quantity">
                <button type="button" onClick={() => setQuantity(line.item.id, line.quantity - 1)} aria-label={isEnglish ? "Decrease quantity" : "Уменьшить"}>−</button>
                <span>{line.quantity}</span>
                <button type="button" onClick={() => setQuantity(line.item.id, line.quantity + 1)} aria-label={isEnglish ? "Increase quantity" : "Увеличить"}>+</button>
              </div>
              <strong><CurrencyPrice value={line.item.price * line.quantity} /></strong>
              <button className="cart-remove" type="button" onClick={() => removeItem(line.item.id)}>{isEnglish ? "Remove" : "Удалить"}</button>
            </article>
          )) : <p className="cart-empty">{isEnglish ? "Your cart is empty. Add furniture from the catalog." : "Корзина пуста. Добавьте мебель из каталога."}</p>}
        </div>

        {lines.length ? (
          <div className="cart-checkout">
            <label>
              <span>{isEnglish ? "Deliver to apartment" : "Доставить в квартиру"}</span>
              <select value={selectedApartmentId} onChange={(event) => setSelectedApartmentId(event.target.value)}>
                <option value="">{isEnglish ? "A manager will confirm the address" : "Адрес уточнит менеджер"}</option>
                {deliveryApartments.map((apartment) => {
                  const displayApartment = localizeApartment(apartment, locale);
                  return (
                    <option value={apartment.id} key={apartment.id}>
                      {displayApartment.title} · {translateComplexName(apartment.project, locale)}
                    </option>
                  );
                })}
              </select>
            </label>
            <dl>
              <div><dt>{isEnglish ? "Furniture" : "Мебель"}</dt><dd><CurrencyPrice value={subtotal} /></dd></div>
              <div><dt>{isEnglish ? `Delivery to ${cityLabel}` : `Доставка в ${cityLabel}`}</dt><dd><CurrencyPrice value={deliveryPrice} /></dd></div>
              <div><dt>{isEnglish ? "Timing" : "Срок"}</dt><dd>{isEnglish ? englishDelivery(deliveryWindow) : deliveryWindow}</dd></div>
              <div className="cart-total"><dt>{isEnglish ? "Total" : "Итого"}</dt><dd><CurrencyPrice value={total} /></dd></div>
            </dl>
            <button className="button button-primary" type="button" onClick={checkout} disabled={pending}>
              {pending ? (isEnglish ? "Processing..." : "Оформляем...") : (isEnglish ? "Buy with delivery" : "Купить с доставкой")}
            </button>
            <button className="button button-ghost" type="button" onClick={clear}>{isEnglish ? "Clear cart" : "Очистить корзину"}</button>
            {message ? <p className="cart-message" aria-live="polite">{message}</p> : null}
          </div>
        ) : null}
      </aside>
    </div>
  );
}

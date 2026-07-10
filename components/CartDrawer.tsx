"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { useCity } from "@/components/CityProvider";
import { useAuth } from "@/components/AuthProvider";
import { apartments } from "@/lib/apartments";
import { formatPrice } from "@/lib/format";

export function CartDrawer() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedCity, selectedProject } = useCity();
  const {
    lines,
    count,
    subtotal,
    deliveryPrice,
    total,
    deliveryWindow,
    selectedApartmentId,
    isOpen,
    closeCart,
    removeItem,
    setQuantity,
    clear,
    setSelectedApartmentId
  } = useCart();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const deliveryApartments = apartments.filter((item) => item.city === selectedCity && item.status !== "sold");

  async function checkout() {
    if (!user) {
      setMessage("Для оформления войдите в личный кабинет.");
      router.push("/account");
      return;
    }
    if (!lines.length) return;
    setPending(true);
    setMessage("Отправляем заявку...");
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
      if (!response.ok) throw new Error(data.error || "Не удалось оформить заказ.");
      setMessage(`Заявка ${data.requestId} принята. Менеджер уточнит дату доставки.`);
      clear();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось оформить заказ.");
    } finally {
      setPending(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="cart-backdrop" role="presentation" onMouseDown={closeCart}>
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Корзина мебели" onMouseDown={(event) => event.stopPropagation()}>
        <div className="cart-head">
          <div>
            <span className="eyebrow">Мебель с доставкой</span>
            <h2>Корзина · {count}</h2>
          </div>
          <button className="icon-button" type="button" onClick={closeCart} aria-label="Закрыть корзину">×</button>
        </div>

        <div className="cart-lines">
          {lines.length ? lines.map((line) => (
            <article className="cart-line" key={line.item.id}>
              <div>
                <strong>{line.item.title}</strong>
                <span>{line.item.delivery} · {formatPrice(line.item.price)}</span>
              </div>
              <div className="cart-quantity">
                <button type="button" onClick={() => setQuantity(line.item.id, line.quantity - 1)} aria-label="Уменьшить">−</button>
                <span>{line.quantity}</span>
                <button type="button" onClick={() => setQuantity(line.item.id, line.quantity + 1)} aria-label="Увеличить">+</button>
              </div>
              <strong>{formatPrice(line.item.price * line.quantity)}</strong>
              <button className="cart-remove" type="button" onClick={() => removeItem(line.item.id)}>Удалить</button>
            </article>
          )) : <p className="cart-empty">Корзина пуста. Добавьте мебель из каталога.</p>}
        </div>

        {lines.length ? (
          <div className="cart-checkout">
            <label>
              <span>Доставить в квартиру</span>
              <select value={selectedApartmentId} onChange={(event) => setSelectedApartmentId(event.target.value)}>
                <option value="">Адрес уточнит менеджер</option>
                {deliveryApartments.map((apartment) => (
                  <option value={apartment.id} key={apartment.id}>{apartment.title} · {apartment.project}</option>
                ))}
              </select>
            </label>
            <dl>
              <div><dt>Мебель</dt><dd>{formatPrice(subtotal)}</dd></div>
              <div><dt>Доставка в {selectedCity}</dt><dd>{formatPrice(deliveryPrice)}</dd></div>
              <div><dt>Срок</dt><dd>{deliveryWindow}</dd></div>
              <div className="cart-total"><dt>Итого</dt><dd>{formatPrice(total)}</dd></div>
            </dl>
            <button className="button button-primary" type="button" onClick={checkout} disabled={pending}>
              {pending ? "Оформляем..." : "Купить с доставкой"}
            </button>
            <button className="button button-ghost" type="button" onClick={clear}>Очистить корзину</button>
            {message ? <p className="cart-message" aria-live="polite">{message}</p> : null}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
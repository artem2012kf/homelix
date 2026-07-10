"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ApartmentCard } from "@/components/ApartmentCard";
import { useAuth } from "@/components/AuthProvider";
import type { Apartment } from "@/types/apartment";

type Mode = "login" | "register";

export function AccountPanel({ apartments }: { apartments: Apartment[] }) {
  const { user, login, register, logout, favorites, reservations } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const favoriteApartments = useMemo(
    () => apartments.filter((apartment) => favorites.includes(apartment.id)),
    [apartments, favorites]
  );

  const reservedApartments = useMemo(
    () => apartments.filter((apartment) => reservations.includes(apartment.id)),
    [apartments, reservations]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setMessage("Проверяем данные...");

    try {
      const result = mode === "login" ? await login(email, password) : await register(email, password, website);
      setMessage(
        result.ok
          ? mode === "login"
            ? "Вы вошли в кабинет."
            : "Аккаунт создан. Вы вошли в кабинет."
          : result.error ?? "Не удалось выполнить действие."
      );

      if (result.ok) {
        setPassword("");
        setWebsite("");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (user) {
    return (
      <div className="account-layout">
        <section className="account-card">
          <span className="eyebrow">Личный кабинет</span>
          <h1>Здравствуйте</h1>
          <p>
            Вы вошли как <strong>{user.email}</strong>. Здесь сохраняются избранные квартиры и брони.
          </p>
          <div className="account-stats">
            <div>
              <strong>{favoriteApartments.length}</strong>
              <span>в избранном</span>
            </div>
            <div>
              <strong>{reservedApartments.length}</strong>
              <span>забронировано</span>
            </div>
          </div>
          <div className="hero-actions">
            <Link className="button button-primary" href="/#apartments">
              Выбрать квартиру
            </Link>
            <button className="button button-ghost" type="button" onClick={() => void logout()}>
              Выйти
            </button>
          </div>
          <div className="demo-warning" role="note">
            <strong>Демонстрационный режим</strong>
            <span>Сессия защищена httpOnly-cookie, но без подключённой внешней БД данные serverless-инстанса могут быть сброшены.</span>
          </div>
        </section>

        <section className="account-list-section">
          <div className="section-heading compact-heading">
            <span className="eyebrow">Бронь</span>
            <h2>Забронированные квартиры</h2>
          </div>
          {reservedApartments.length ? (
            <div className="account-cards-grid">
              {reservedApartments.map((apartment) => (
                <ApartmentCard apartment={apartment} key={apartment.id} />
              ))}
            </div>
          ) : (
            <p className="empty-account-text">Пока нет забронированных квартир.</p>
          )}
        </section>

        <section className="account-list-section">
          <div className="section-heading compact-heading">
            <span className="eyebrow">Избранное</span>
            <h2>Избранные квартиры</h2>
          </div>
          {favoriteApartments.length ? (
            <div className="account-cards-grid">
              {favoriteApartments.map((apartment) => (
                <ApartmentCard apartment={apartment} key={apartment.id} />
              ))}
            </div>
          ) : (
            <p className="empty-account-text">Пока нет избранных квартир.</p>
          )}
        </section>
      </div>
    );
  }

  return (
    <section className="account-auth-section">
      <div className="account-card auth-card">
        <span className="eyebrow">Аккаунт покупателя</span>
        <h1>{mode === "login" ? "Вход" : "Регистрация"}</h1>
        <p>Войдите, чтобы сохранять квартиры в избранное и бронировать свободные варианты.</p>

        <div className="auth-tabs">
          <button className={mode === "login" ? "is-active" : ""} type="button" onClick={() => setMode("login")}>
            Войти
          </button>
          <button className={mode === "register" ? "is-active" : ""} type="button" onClick={() => setMode("register")}>
            Зарегистрироваться
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
          <label>
            <span>Почта</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
          </label>
          <label>
            <span>Пароль</span>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === "register" ? "Минимум 10 символов" : "Введите пароль"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={mode === "register" ? 10 : undefined}
                maxLength={128}
                required
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-pressed={showPassword}>
                {showPassword ? "Скрыть" : "Показать"}
              </button>
            </div>
          </label>
          {mode === "register" ? (
            <label className="honeypot-field" aria-hidden="true">
              <span>Сайт</span>
              <input
                type="text"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </label>
          ) : null}
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Подождите..." : mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>

        {message ? <p className="auth-message" aria-live="polite">{message}</p> : null}
        <div className="demo-warning" role="note">
          <strong>Важно</strong>
          <span>Это демонстрационный каталог. Не используйте пароль от других сервисов.</span>
        </div>
      </div>
    </section>
  );
}

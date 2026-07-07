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
    setMessage("Проверяем данные...");

    const result = mode === "login" ? await login(email, password) : await register(email, password);
    setMessage(result.ok ? (mode === "login" ? "Вы вошли в кабинет." : "Аккаунт создан. Вы вошли в кабинет.") : result.error ?? "Не удалось выполнить действие.");

    if (result.ok) {
      setPassword("");
    }
  }

  if (user) {
    return (
      <div className="account-layout">
        <section className="account-card">
          <span className="eyebrow">Личный кабинет</span>
          <h1>Здравствуйте</h1>
          <p>
            Вы вошли как <strong>{user.email}</strong>. Здесь сохраняются избранные квартиры и демо-брони.
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
            <button className="button button-ghost" type="button" onClick={logout}>
              Выйти
            </button>
          </div>
          <small className="demo-warning">
            Это демо-авторизация через локальную JSON-базу проекта. Для промышленного сайта лучше подключить PostgreSQL/Supabase и защищенное хранение паролей.
          </small>
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
        <p>
          Зарегистрируйтесь по почте и паролю, чтобы добавлять квартиры в избранное и бронировать свободные варианты.
        </p>

        <div className="auth-tabs">
          <button className={mode === "login" ? "is-active" : ""} type="button" onClick={() => setMode("login")}>
            Войти
          </button>
          <button className={mode === "register" ? "is-active" : ""} type="button" onClick={() => setMode("register")}>
            Зарегистрироваться
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Почта</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" required />
          </label>
          <label>
            <span>Пароль</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Минимум 6 символов" required />
          </label>
          <button className="button button-primary" type="submit">
            {mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>

        {message ? <p className="auth-message">{message}</p> : null}
        <small className="demo-warning">
          Демо-режим: данные сохраняются в локальной JSON-базе проекта на компьютере, где запущен сервер.
        </small>
      </div>
    </section>
  );
}

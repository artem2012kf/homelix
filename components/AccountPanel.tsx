"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ApartmentCard } from "@/components/ApartmentCard";
import { useAuth } from "@/components/AuthProvider";
import type { Apartment } from "@/types/apartment";

type Mode = "login" | "register" | "request-reset" | "reset-password";

type ApiMessage = {
  message?: string;
  error?: string;
  previewResetUrl?: string;
};

export function AccountPanel({ apartments, resetToken = "" }: { apartments: Apartment[]; resetToken?: string }) {
  const { user, login, register, logout, favorites, reservations } = useAuth();
  const [mode, setMode] = useState<Mode>(resetToken ? "reset-password" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [previewResetUrl, setPreviewResetUrl] = useState("");

  const favoriteApartments = useMemo(
    () => apartments.filter((apartment) => favorites.includes(apartment.id)),
    [apartments, favorites]
  );

  const reservedApartments = useMemo(
    () => apartments.filter((apartment) => reservations.includes(apartment.id)),
    [apartments, reservations]
  );

  function chooseMode(nextMode: Mode) {
    setMode(nextMode);
    setMessage("");
    setPreviewResetUrl("");
    setPassword("");
    setConfirmPassword("");
  }

  async function requestPasswordReset() {
    const response = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = (await response.json().catch(() => ({}))) as ApiMessage;
    if (!response.ok) return { ok: false, error: data.error ?? "Не удалось отправить инструкцию." };
    setPreviewResetUrl(data.previewResetUrl ?? "");
    return { ok: true, message: data.message ?? "Инструкция отправлена." };
  }

  async function completePasswordReset() {
    if (password !== confirmPassword) return { ok: false, error: "Пароли не совпадают." };
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetToken, password })
    });
    const data = (await response.json().catch(() => ({}))) as ApiMessage;
    return response.ok
      ? { ok: true, message: data.message ?? "Пароль обновлён." }
      : { ok: false, error: data.error ?? "Не удалось обновить пароль." };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setMessage("Проверяем данные...");

    try {
      if (mode === "request-reset") {
        const result = await requestPasswordReset();
        setMessage(result.ok ? result.message ?? "Инструкция отправлена." : result.error ?? "Не удалось выполнить действие.");
        return;
      }

      if (mode === "reset-password") {
        const result = await completePasswordReset();
        setMessage(result.ok ? result.message ?? "Пароль обновлён." : result.error ?? "Не удалось выполнить действие.");
        if (result.ok) {
          setPassword("");
          setConfirmPassword("");
          window.history.replaceState({}, "", "/account");
          setMode("login");
        }
        return;
      }

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

  const title =
    mode === "login"
      ? "Вход"
      : mode === "register"
        ? "Регистрация"
        : mode === "request-reset"
          ? "Восстановление пароля"
          : "Новый пароль";
  const description =
    mode === "request-reset"
      ? "Введите почту аккаунта. Ссылка восстановления действует 20 минут."
      : mode === "reset-password"
        ? "Придумайте новый пароль длиной не менее 10 символов."
        : "Войдите, чтобы сохранять квартиры в избранное и бронировать свободные варианты.";

  return (
    <section className="account-auth-section">
      <div className="account-card auth-card">
        <span className="eyebrow">Аккаунт покупателя</span>
        <h1>{title}</h1>
        <p>{description}</p>

        {mode === "login" || mode === "register" ? (
          <div className="auth-tabs">
            <button className={mode === "login" ? "is-active" : ""} type="button" onClick={() => chooseMode("login")}>
              Войти
            </button>
            <button className={mode === "register" ? "is-active" : ""} type="button" onClick={() => chooseMode("register")}>
              Зарегистрироваться
            </button>
          </div>
        ) : null}

        <form className="auth-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
          {mode !== "reset-password" ? (
            <label>
              <span>Почта</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
                maxLength={254}
                required
              />
            </label>
          ) : null}

          {mode !== "request-reset" ? (
            <label>
              <span>{mode === "reset-password" ? "Новый пароль" : "Пароль"}</span>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === "login" ? "Введите пароль" : "Минимум 10 символов"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  minLength={mode === "login" ? undefined : 10}
                  maxLength={128}
                  required
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-pressed={showPassword}>
                  {showPassword ? "Скрыть" : "Показать"}
                </button>
              </div>
            </label>
          ) : null}

          {mode === "reset-password" ? (
            <label>
              <span>Повторите пароль</span>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={10}
                maxLength={128}
                required
              />
            </label>
          ) : null}

          {mode === "register" ? (
            <label className="honeypot-field" aria-hidden="true">
              <span>Сайт</span>
              <input type="text" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" />
            </label>
          ) : null}

          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Подождите..."
              : mode === "login"
                ? "Войти"
                : mode === "register"
                  ? "Создать аккаунт"
                  : mode === "request-reset"
                    ? "Отправить инструкцию"
                    : "Сохранить новый пароль"}
          </button>
        </form>

        {mode === "login" ? (
          <button className="auth-secondary-action" type="button" onClick={() => chooseMode("request-reset")}>
            Забыли пароль?
          </button>
        ) : null}
        {mode === "request-reset" || mode === "reset-password" ? (
          <button className="auth-secondary-action" type="button" onClick={() => chooseMode("login")}>
            Вернуться ко входу
          </button>
        ) : null}

        {message ? <p className="auth-message" aria-live="polite">{message}</p> : null}
        {previewResetUrl ? (
          <p className="auth-message" role="note">
            Демо-ссылка: <Link href={previewResetUrl}>открыть восстановление пароля</Link>
          </p>
        ) : null}
        <div className="demo-warning" role="note">
          <strong>Важно</strong>
          <span>Это демонстрационный каталог. Не используйте пароль от других сервисов.</span>
        </div>
      </div>
    </section>
  );
}
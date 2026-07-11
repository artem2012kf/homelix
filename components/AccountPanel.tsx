"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ApartmentCard } from "@/components/ApartmentCard";
import { useAuth } from "@/components/AuthProvider";
import { useCity } from "@/components/CityProvider";
import { useCart } from "@/components/CartProvider";
import type { Apartment } from "@/types/apartment";

type Mode = "login" | "register" | "reset-password";
type ApiMessage = { message?: string; error?: string; previewResetUrl?: string; previewCode?: string; verificationToken?: string };

export function AccountPanel({ apartments, resetToken = "" }: { apartments: Apartment[]; resetToken?: string }) {
  const { user, login, logout, favorites, reservations } = useAuth();
  const { selectedCity, selectedProject, openChooser } = useCity();
  const { count: cartCount, openCart } = useCart();
  const [mode, setMode] = useState<Mode>(resetToken ? "reset-password" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [message, setMessage] = useState("");
  const [previewResetUrl, setPreviewResetUrl] = useState("");
  const [previewCode, setPreviewCode] = useState("");
  const [isMissingAccountOpen, setIsMissingAccountOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const favoriteApartments = useMemo(() => apartments.filter((apartment) => favorites.includes(apartment.id)), [apartments, favorites]);
  const reservedApartments = useMemo(() => apartments.filter((apartment) => reservations.includes(apartment.id)), [apartments, reservations]);

  function chooseMode(nextMode: Mode) {
    setMode(nextMode);
    setMessage("");
    setPreviewResetUrl("");
    setPreviewCode("");
    setVerificationToken("");
    setVerificationCode("");
    setPassword("");
    setConfirmPassword("");
  }

  useEffect(() => {
    if (!isMissingAccountOpen) return;
    const timerId = window.setTimeout(() => {
      setIsMissingAccountOpen(false);
      chooseMode("register");
    }, 2000);
    return () => window.clearTimeout(timerId);
  }, [isMissingAccountOpen]);

  async function requestVerificationCode() {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setMessage("Сначала укажите корректную почту.");
      return;
    }
    setIsSendingCode(true);
    setMessage("Проверяем домен почты и отправляем код...");
    try {
      const response = await fetch("/api/auth/request-email-verification", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json().catch(() => ({})) as ApiMessage;
      if (!response.ok || !data.verificationToken) throw new Error(data.error || "Не удалось отправить код.");
      setVerificationToken(data.verificationToken);
      setPreviewCode(data.previewCode ?? "");
      setMessage(data.message || "Код отправлен на почту.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось отправить код.");
    } finally {
      setIsSendingCode(false);
    }
  }

  async function requestPasswordReset() {
    const response = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await response.json().catch(() => ({})) as ApiMessage;
    if (!response.ok) return { ok: false, error: data.error ?? "Не удалось отправить инструкцию." };
    setPreviewResetUrl(data.previewResetUrl ?? "");
    return { ok: true, message: data.message ?? "Инструкция отправлена." };
  }

  async function handlePasswordResetRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isResetSubmitting) return;
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setResetMessage("Укажите корректную почту аккаунта.");
      return;
    }

    setIsResetSubmitting(true);
    setResetMessage("Отправляем ссылку восстановления...");
    try {
      const result = await requestPasswordReset();
      setResetMessage(result.ok ? result.message ?? "Инструкция отправлена." : result.error ?? "Не удалось отправить инструкцию.");
    } finally {
      setIsResetSubmitting(false);
    }
  }

  async function completePasswordReset() {
    if (password !== confirmPassword) return { ok: false, error: "Пароли не совпадают." };
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetToken, password })
    });
    const data = await response.json().catch(() => ({})) as ApiMessage;
    return response.ok ? { ok: true, message: data.message ?? "Пароль обновлён." } : { ok: false, error: data.error ?? "Не удалось обновить пароль." };
  }

  async function registerVerifiedEmail() {
    if (!verificationToken) return { ok: false, error: "Сначала отправьте код на почту." };
    if (!/^\d{6}$/.test(verificationCode)) return { ok: false, error: "Введите шестизначный код из письма." };
    const response = await fetch("/api/auth/register", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, website, verificationCode, verificationToken })
    });
    const data = await response.json().catch(() => ({})) as ApiMessage;
    return response.ok ? { ok: true } : { ok: false, error: data.error ?? "Не удалось создать аккаунт." };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setMessage("Проверяем данные...");
    try {
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
      if (mode === "register") {
        const result = await registerVerifiedEmail();
        setMessage(result.ok ? "Почта подтверждена. Аккаунт создан." : result.error ?? "Не удалось создать аккаунт.");
        if (result.ok) window.location.reload();
        return;
      }

      const result = await login(email, password);
      if (!result.ok && result.error === "Такого аккаунта не существует.") {
        setMessage("");
        setIsMissingAccountOpen(true);
        return;
      }

      setMessage(result.ok ? "Вы вошли в кабинет." : result.error ?? "Не удалось войти.");
      if (result.ok) setPassword("");
    } finally {
      setIsSubmitting(false);
    }
  }

  function openResetModal() {
    setResetMessage("");
    setPreviewResetUrl("");
    setIsResetModalOpen(true);
  }

  function closeResetModal() {
    if (isResetSubmitting) return;
    setIsResetModalOpen(false);
    setResetMessage("");
    setPreviewResetUrl("");
  }

  if (user) {
    return (
      <div className="account-layout hall-account-layout">
        <section className="account-card hall-account-hero">
          <div>
            <span className="eyebrow">Личный кабинет ХОЛЛ</span>
            <h1>Здравствуйте</h1>
            <p>Аккаунт <strong>{user.email}</strong> подтверждён. Здесь собраны квартиры, бронь, город и корзина мебели.</p>
          </div>
          <div className="account-location-card">
            <span>Ваш выбор</span>
            <strong>{selectedCity}</strong>
            <small>{selectedProject}</small>
            <button type="button" onClick={openChooser}>Изменить город и ЖК</button>
          </div>
          <div className="account-stats hall-account-stats">
            <div><strong>{favoriteApartments.length}</strong><span>в избранном</span></div>
            <div><strong>{reservedApartments.length}</strong><span>забронировано</span></div>
            <div><strong>{cartCount}</strong><span>товаров в корзине</span></div>
          </div>
          <div className="hero-actions">
            <Link className="button button-primary" href="/#apartments">Выбрать квартиру</Link>
            <button className="button button-ghost" type="button" onClick={openCart}>Открыть корзину</button>
            <button className="button button-ghost" type="button" onClick={() => void logout()}>Выйти</button>
          </div>
        </section>

        <section className="account-list-section">
          <div className="section-heading compact-heading"><span className="eyebrow">Бронь</span><h2>Забронированные квартиры</h2></div>
          {reservedApartments.length ? <div className="account-cards-grid">{reservedApartments.map((apartment) => <ApartmentCard apartment={apartment} key={apartment.id} />)}</div> : <p className="empty-account-text">Пока нет забронированных квартир.</p>}
        </section>

        <section className="account-list-section">
          <div className="section-heading compact-heading"><span className="eyebrow">Избранное</span><h2>Избранные квартиры</h2></div>
          {favoriteApartments.length ? <div className="account-cards-grid">{favoriteApartments.map((apartment) => <ApartmentCard apartment={apartment} key={apartment.id} />)}</div> : <p className="empty-account-text">Пока нет избранных квартир.</p>}
        </section>
      </div>
    );
  }

  const title = mode === "login" ? "Вход" : mode === "register" ? "Регистрация" : "Новый пароль";
  const description = mode === "register"
    ? "Мы отправим код на почту. Аккаунт создаётся только после подтверждения, поэтому случайный или несуществующий адрес использовать нельзя."
    : mode === "reset-password"
      ? "Придумайте новый пароль длиной не менее 10 символов."
      : "Войдите, чтобы сохранять квартиры, покупать и заказывать мебель с доставкой.";

  return (
    <>
      <section className="account-auth-section hall-auth-section">
        <div className="account-auth-aside">
          <span className="eyebrow">ХОЛЛ</span>
          <h2>Квартира, мебель и покупка — в одном кабинете</h2>
          <ul><li>Подтверждённая почта</li><li>Избранные квартиры</li><li>Бронь и заявка на покупку</li><li>Корзина и доставка мебели</li></ul>
        </div>
        <div className="account-card auth-card">
          <span className="eyebrow">Аккаунт покупателя</span>
          <h1>{title}</h1>
          <p>{description}</p>

          {mode === "login" || mode === "register" ? (
            <div className="auth-tabs">
              <button className={mode === "login" ? "is-active" : ""} type="button" onClick={() => chooseMode("login")}>Войти</button>
              <button className={mode === "register" ? "is-active" : ""} type="button" onClick={() => chooseMode("register")}>Регистрация</button>
            </div>
          ) : null}

          <form className="auth-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
            {mode !== "reset-password" ? (
              <label><span>Почта</span><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); if (mode === "register") { setVerificationToken(""); setVerificationCode(""); } }} placeholder="name@example.com" autoComplete="email" maxLength={254} required /></label>
            ) : null}

            {mode === "register" ? (
              <div className="email-verification-box">
                <button className="button button-ghost" type="button" onClick={requestVerificationCode} disabled={isSendingCode}>
                  {isSendingCode ? "Отправляем..." : verificationToken ? "Отправить новый код" : "Проверить почту и отправить код"}
                </button>
                {verificationToken ? <label><span>Код из письма</span><input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" required /></label> : null}
                {previewCode ? <small>Демо-код: <strong>{previewCode}</strong></small> : null}
              </div>
            ) : null}

            <label>
              <span>{mode === "reset-password" ? "Новый пароль" : "Пароль"}</span>
              <div className="password-field">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "login" ? "Введите пароль" : "Минимум 10 символов"} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? undefined : 10} maxLength={128} required />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-pressed={showPassword}>{showPassword ? "Скрыть" : "Показать"}</button>
              </div>
            </label>

            {mode === "reset-password" ? <label><span>Повторите пароль</span><input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={10} maxLength={128} required /></label> : null}
            {mode === "register" ? <label className="honeypot-field" aria-hidden="true"><span>Сайт</span><input type="text" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" /></label> : null}

            <button className="button button-primary" type="submit" disabled={isSubmitting || (mode === "register" && !verificationToken)}>
              {isSubmitting ? "Подождите..." : mode === "login" ? "Войти" : mode === "register" ? "Подтвердить код и создать аккаунт" : "Сохранить новый пароль"}
            </button>
          </form>

          {mode === "login" ? <button className="auth-secondary-action" type="button" onClick={openResetModal}>Забыли пароль?</button> : null}
          {mode === "reset-password" ? <button className="auth-secondary-action" type="button" onClick={() => chooseMode("login")}>Вернуться ко входу</button> : null}
          {message ? <p className="auth-message" aria-live="polite">{message}</p> : null}
        </div>
      </section>

      {isMissingAccountOpen ? (
        <div className="auth-dialog-backdrop">
          <section className="auth-dialog auth-dialog-status" role="alertdialog" aria-modal="true" aria-labelledby="missing-account-title">
            <span className="eyebrow">Вход в кабинет</span>
            <h2 id="missing-account-title">Такого аккаунта не существует</h2>
            <p>Через 2 секунды откроется регистрация. Введённая почта останется в форме.</p>
            <div className="auth-dialog-progress" aria-hidden="true" />
            <button className="button button-primary" type="button" onClick={() => { setIsMissingAccountOpen(false); chooseMode("register"); }}>Перейти к регистрации сейчас</button>
          </section>
        </div>
      ) : null}

      {isResetModalOpen ? (
        <div className="auth-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeResetModal(); }}>
          <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="password-reset-title">
            <button className="auth-dialog-close" type="button" aria-label="Закрыть восстановление пароля" onClick={closeResetModal}>×</button>
            <span className="eyebrow">Безопасность аккаунта</span>
            <h2 id="password-reset-title">Восстановление пароля</h2>
            <p>Укажите почту аккаунта. Если аккаунт существует, мы отправим ссылку, действующую 20 минут.</p>
            <form className="auth-form auth-dialog-form" onSubmit={handlePasswordResetRequest} aria-busy={isResetSubmitting}>
              <label><span>Почта аккаунта</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" maxLength={254} required autoFocus /></label>
              <button className="button button-primary" type="submit" disabled={isResetSubmitting}>{isResetSubmitting ? "Отправляем..." : "Отправить ссылку восстановления"}</button>
            </form>
            {resetMessage ? <p className="auth-message" aria-live="polite">{resetMessage}</p> : null}
            {previewResetUrl ? <p className="auth-message" role="note">Демо-ссылка: <Link href={previewResetUrl}>открыть восстановление пароля</Link></p> : null}
          </section>
        </div>
      ) : null}
    </>
  );
}

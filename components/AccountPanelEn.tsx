"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ApartmentCard } from "@/components/ApartmentCard";
import { useAuth } from "@/components/AuthProvider";
import { useCity } from "@/components/CityProvider";
import { useCart } from "@/components/CartProvider";
import { localizePath } from "@/lib/locale-path";
import type { Apartment } from "@/types/apartment";

type Mode = "login" | "register" | "reset-password";
type ApiMessage = { message?: string; error?: string; previewResetUrl?: string; previewCode?: string; verificationToken?: string };

function translateAuthError(error?: string) {
  if (!error) return "The request could not be completed.";
  const known: Record<string, string> = {
    "Такого аккаунта не существует.": "This account does not exist.",
    "Неверный пароль.": "Incorrect password.",
    "Почта или пароль указаны неверно.": "The email or password is incorrect.",
    "Сначала отправьте код на почту.": "Send a verification code first.",
    "Введите шестизначный код из письма.": "Enter the six-digit code from the email.",
    "Пароли не совпадают.": "The passwords do not match.",
    "Не удалось создать аккаунт.": "Could not create the account.",
    "Не удалось отправить код.": "Could not send the verification code.",
    "Не удалось обновить пароль.": "Could not update the password."
  };
  return known[error] ?? error;
}

export function AccountPanelEn({ apartments, resetToken = "" }: { apartments: Apartment[]; resetToken?: string }) {
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
      setMessage("Enter a valid email address first.");
      return;
    }
    setIsSendingCode(true);
    setMessage("Checking the email domain and sending a code...");
    try {
      const response = await fetch("/api/auth/request-email-verification", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json().catch(() => ({})) as ApiMessage;
      if (!response.ok || !data.verificationToken) throw new Error(translateAuthError(data.error));
      setVerificationToken(data.verificationToken);
      setPreviewCode(data.previewCode ?? "");
      setMessage("The verification code was sent to your email.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send the verification code.");
    } finally {
      setIsSendingCode(false);
    }
  }

  async function requestPasswordReset() {
    const response = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale: "en" })
    });
    const data = await response.json().catch(() => ({})) as ApiMessage;
    if (!response.ok) return { ok: false, error: translateAuthError(data.error) };
    setPreviewResetUrl(data.previewResetUrl ?? "");
    return { ok: true, message: "If the account exists, a password reset link has been sent. It remains valid for 20 minutes." };
  }

  async function handlePasswordResetRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isResetSubmitting) return;
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setResetMessage("Enter a valid account email address.");
      return;
    }
    setIsResetSubmitting(true);
    setResetMessage("Sending the password reset link...");
    try {
      const result = await requestPasswordReset();
      setResetMessage(result.ok ? result.message ?? "Instructions were sent." : result.error ?? "Could not send the instructions.");
    } finally {
      setIsResetSubmitting(false);
    }
  }

  async function completePasswordReset() {
    if (password !== confirmPassword) return { ok: false, error: "The passwords do not match." };
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetToken, password })
    });
    const data = await response.json().catch(() => ({})) as ApiMessage;
    return response.ok ? { ok: true, message: "Your password has been updated." } : { ok: false, error: translateAuthError(data.error) };
  }

  async function registerVerifiedEmail() {
    if (!verificationToken) return { ok: false, error: "Send a verification code first." };
    if (!/^\d{6}$/.test(verificationCode)) return { ok: false, error: "Enter the six-digit code from the email." };
    const response = await fetch("/api/auth/register", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, website, verificationCode, verificationToken })
    });
    const data = await response.json().catch(() => ({})) as ApiMessage;
    return response.ok ? { ok: true } : { ok: false, error: translateAuthError(data.error) };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setMessage("Checking your details...");
    try {
      if (mode === "reset-password") {
        const result = await completePasswordReset();
        setMessage(result.ok ? result.message ?? "Password updated." : result.error ?? "The action could not be completed.");
        if (result.ok) {
          setPassword("");
          setConfirmPassword("");
          window.history.replaceState({}, "", "/en/account");
          setMode("login");
        }
        return;
      }
      if (mode === "register") {
        const result = await registerVerifiedEmail();
        setMessage(result.ok ? "Email verified. Your account has been created." : result.error ?? "Could not create the account.");
        if (result.ok) window.location.reload();
        return;
      }

      const result = await login(email, password);
      if (!result.ok && result.error === "Такого аккаунта не существует.") {
        setMessage("");
        setIsMissingAccountOpen(true);
        return;
      }
      setMessage(result.ok ? "You are signed in." : translateAuthError(result.error));
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
            <span className="eyebrow">HALL account</span>
            <h1>Welcome</h1>
            <p>The email <strong>{user.email}</strong> is verified. Your apartments, reservations, selected city and furniture cart are available here.</p>
          </div>
          <div className="account-location-card">
            <span>Your selection</span>
            <strong>{selectedCity}</strong>
            <small>{selectedProject || "Any project"}</small>
            <button type="button" onClick={openChooser}>Change city and project</button>
          </div>
          <div className="account-stats hall-account-stats">
            <div><strong>{favoriteApartments.length}</strong><span>favorites</span></div>
            <div><strong>{reservedApartments.length}</strong><span>reserved</span></div>
            <div><strong>{cartCount}</strong><span>cart items</span></div>
          </div>
          <div className="hero-actions">
            <Link className="button button-primary" href="/en#apartments">Choose an apartment</Link>
            <button className="button button-ghost" type="button" onClick={openCart}>Open cart</button>
            <button className="button button-ghost" type="button" onClick={() => void logout()}>Sign out</button>
          </div>
        </section>

        <section className="account-list-section">
          <div className="section-heading compact-heading"><span className="eyebrow">Reservations</span><h2>Reserved apartments</h2></div>
          {reservedApartments.length ? <div className="account-cards-grid">{reservedApartments.map((apartment) => <ApartmentCard apartment={apartment} locale="en" key={apartment.id} />)}</div> : <p className="empty-account-text">You have no reserved apartments yet.</p>}
        </section>

        <section className="account-list-section">
          <div className="section-heading compact-heading"><span className="eyebrow">Favorites</span><h2>Favorite apartments</h2></div>
          {favoriteApartments.length ? <div className="account-cards-grid">{favoriteApartments.map((apartment) => <ApartmentCard apartment={apartment} locale="en" key={apartment.id} />)}</div> : <p className="empty-account-text">You have no favorite apartments yet.</p>}
        </section>
      </div>
    );
  }

  const title = mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "New password";
  const description = mode === "register"
    ? "We will send a code to your email. The account is created only after the address is verified."
    : mode === "reset-password"
      ? "Create a new password with at least 10 characters."
      : "Sign in to save apartments, submit purchase requests and order furniture with delivery.";

  return (
    <>
      <section className="account-auth-section hall-auth-section">
        <div className="account-auth-aside">
          <span className="eyebrow">HALL</span>
          <h2>Apartment, furniture and purchase requests in one account</h2>
          <ul><li>Verified email</li><li>Favorite apartments</li><li>Reservations and purchase requests</li><li>Furniture cart and delivery</li></ul>
        </div>
        <div className="account-card auth-card">
          <span className="eyebrow">Buyer account</span>
          <h1>{title}</h1>
          <p>{description}</p>

          {mode === "login" || mode === "register" ? (
            <div className="auth-tabs">
              <button className={mode === "login" ? "is-active" : ""} type="button" onClick={() => chooseMode("login")}>Sign in</button>
              <button className={mode === "register" ? "is-active" : ""} type="button" onClick={() => chooseMode("register")}>Register</button>
            </div>
          ) : null}

          <form className="auth-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
            {mode !== "reset-password" ? (
              <label><span>Email</span><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); if (mode === "register") { setVerificationToken(""); setVerificationCode(""); } }} placeholder="name@example.com" autoComplete="email" maxLength={254} required /></label>
            ) : null}

            {mode === "register" ? (
              <div className="email-verification-box">
                <button className="button button-ghost" type="button" onClick={requestVerificationCode} disabled={isSendingCode}>
                  {isSendingCode ? "Sending..." : verificationToken ? "Send a new code" : "Verify email and send code"}
                </button>
                {verificationToken ? <label><span>Code from the email</span><input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" required /></label> : null}
                {previewCode ? <small>Demo code: <strong>{previewCode}</strong></small> : null}
              </div>
            ) : null}

            <label>
              <span>{mode === "reset-password" ? "New password" : "Password"}</span>
              <div className="password-field">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "login" ? "Enter password" : "At least 10 characters"} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? undefined : 10} maxLength={128} required />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-pressed={showPassword}>{showPassword ? "Hide" : "Show"}</button>
              </div>
            </label>

            {mode === "reset-password" ? <label><span>Repeat password</span><input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={10} maxLength={128} required /></label> : null}
            {mode === "register" ? <label className="honeypot-field" aria-hidden="true"><span>Website</span><input type="text" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" /></label> : null}

            <button className="button button-primary" type="submit" disabled={isSubmitting || (mode === "register" && !verificationToken)}>
              {isSubmitting ? "Please wait..." : mode === "login" ? "Sign in" : mode === "register" ? "Verify code and create account" : "Save new password"}
            </button>
          </form>

          {mode === "login" ? <button className="auth-secondary-action" type="button" onClick={openResetModal}>Forgot password?</button> : null}
          {mode === "reset-password" ? <button className="auth-secondary-action" type="button" onClick={() => chooseMode("login")}>Back to sign in</button> : null}
          {message ? <p className="auth-message" aria-live="polite">{message}</p> : null}
        </div>
      </section>

      {isMissingAccountOpen ? (
        <div className="auth-dialog-backdrop">
          <section className="auth-dialog auth-dialog-status" role="alertdialog" aria-modal="true" aria-labelledby="missing-account-title-en">
            <span className="eyebrow">Account sign in</span>
            <h2 id="missing-account-title-en">This account does not exist</h2>
            <p>The registration form will open in 2 seconds. The entered email will remain in the form.</p>
            <div className="auth-dialog-progress" aria-hidden="true" />
            <button className="button button-primary" type="button" onClick={() => { setIsMissingAccountOpen(false); chooseMode("register"); }}>Register now</button>
          </section>
        </div>
      ) : null}

      {isResetModalOpen ? (
        <div className="auth-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeResetModal(); }}>
          <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="password-reset-title-en">
            <button className="auth-dialog-close" type="button" aria-label="Close password recovery" onClick={closeResetModal}>×</button>
            <span className="eyebrow">Account security</span>
            <h2 id="password-reset-title-en">Password recovery</h2>
            <p>Enter your account email. If the account exists, we will send a link that remains valid for 20 minutes.</p>
            <form className="auth-form auth-dialog-form" onSubmit={handlePasswordResetRequest} aria-busy={isResetSubmitting}>
              <label><span>Account email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" maxLength={254} required autoFocus /></label>
              <button className="button button-primary" type="submit" disabled={isResetSubmitting}>{isResetSubmitting ? "Sending..." : "Send password reset link"}</button>
            </form>
            {resetMessage ? <p className="auth-message" aria-live="polite">{resetMessage}</p> : null}
            {previewResetUrl ? <p className="auth-message" role="note">Demo link: <Link href={previewResetUrl.replace(/^\/account/, "/en/account")}>open password recovery</Link></p> : null}
          </section>
        </div>
      ) : null}
    </>
  );
}

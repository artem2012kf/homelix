"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { siteText, type Locale } from "@/lib/i18n";
import { localizePath } from "@/lib/locale-path";

export function AuthHeaderActions({ locale = "ru" }: { locale?: Locale }) {
  const { user, isReady, logout, favorites, reservations } = useAuth();
  const text = siteText[locale].auth;
  const accountHref = localizePath(locale, "/account");

  if (!isReady) return <Link href={accountHref}>{text.account}</Link>;
  if (!user) return <Link href={accountHref}>{text.login}</Link>;

  return (
    <div className="header-user-box">
      <Link href={accountHref} title={user.email}>
        {text.account}
        <small>
          {favorites.length} {text.favorites} · {reservations.length} {text.reservations}
        </small>
      </Link>
      <button type="button" onClick={() => void logout()}>
        {text.logout}
      </button>
    </div>
  );
}

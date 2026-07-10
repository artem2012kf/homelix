"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { siteText, type Locale } from "@/lib/i18n";

export function AuthHeaderActions({ locale = "ru" }: { locale?: Locale }) {
  const { user, isReady, logout, favorites, reservations } = useAuth();
  const text = siteText[locale].auth;

  if (!isReady) return <Link href="/account">{text.account}</Link>;
  if (!user) return <Link href="/account">{text.login}</Link>;

  return (
    <div className="header-user-box">
      <Link href="/account" title={user.email}>
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

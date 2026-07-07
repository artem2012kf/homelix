"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export function AuthHeaderActions() {
  const { user, isReady, logout, favorites, reservations } = useAuth();

  if (!isReady) {
    return <Link href="/account">Кабинет</Link>;
  }

  if (!user) {
    return <Link href="/account">Войти</Link>;
  }

  return (
    <div className="header-user-box">
      <Link href="/account" title={user.email}>
        Кабинет
        <small>{favorites.length} избранных · {reservations.length} броней</small>
      </Link>
      <button type="button" onClick={logout}>
        Выйти
      </button>
    </div>
  );
}

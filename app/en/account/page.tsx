import type { Metadata } from "next";
import { AccountPanelEn } from "@/components/AccountPanelEn";
import { apartments } from "@/lib/apartments";

export const metadata: Metadata = {
  title: "Buyer account — HALL",
  description: "Favorites, reservations, furniture cart, registration and password recovery."
};

export default async function EnglishAccountPage({
  searchParams
}: {
  searchParams: Promise<{ reset?: string | string[] }>;
}) {
  const params = await searchParams;
  const resetToken = Array.isArray(params.reset) ? params.reset[0] ?? "" : params.reset ?? "";

  return (
    <main>
      <AccountPanelEn apartments={apartments} resetToken={resetToken} />
    </main>
  );
}

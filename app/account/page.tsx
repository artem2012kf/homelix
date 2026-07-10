import { AccountPanel } from "@/components/AccountPanel";
import { apartments } from "@/lib/apartments";

export default async function AccountPage({
  searchParams
}: {
  searchParams: Promise<{ reset?: string | string[] }>;
}) {
  const params = await searchParams;
  const resetToken = Array.isArray(params.reset) ? params.reset[0] ?? "" : params.reset ?? "";

  return (
    <main>
      <AccountPanel apartments={apartments} resetToken={resetToken} />
    </main>
  );
}
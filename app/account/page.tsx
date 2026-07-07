import { AccountPanel } from "@/components/AccountPanel";
import { apartments } from "@/lib/apartments";

export default function AccountPage() {
  return (
    <main>
      <AccountPanel apartments={apartments} />
    </main>
  );
}

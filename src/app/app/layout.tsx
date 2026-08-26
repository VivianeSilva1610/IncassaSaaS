import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { signOut } from "@/app/app/actions";

const navItems = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/clienti", label: "Clienti" },
  { href: "/app/fatture", label: "Fatture" },
  { href: "/app/preventivi", label: "Preventivi" },
  { href: "/app/comunicazioni", label: "Comunicazioni" },
  { href: "/app/abbonamento", label: "Abbonamento" },
  { href: "/app/impostazioni", label: "Impostazioni" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <nav className="flex flex-wrap gap-4 text-sm font-medium text-stone-600">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-stone-900">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm text-stone-500">
            <span>{user?.email}</span>
            <form action={signOut}>
              <button type="submit" className="hover:text-stone-900">
                Esci
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 py-10">{children}</div>
    </div>
  );
}

import Link from "next/link";
import { requireDeliveryAdmin } from "@/lib/delivery/auth";
import { signOut } from "@/app/app/actions";

const navItems = [
  { href: "/delivery-admin", label: "Visão geral" },
  { href: "/delivery-admin/estoque", label: "Estoque" },
  { href: "/delivery-admin/vendas", label: "Vendas" },
  { href: "/delivery-admin/custos", label: "Custos" },
];

export default async function DeliveryAdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireDeliveryAdmin();

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-semibold text-stone-900">🍽️ Gestão interna</span>
            <nav className="flex flex-wrap gap-4 text-sm font-medium text-stone-600">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-stone-900">
                  {item.label}
                </Link>
              ))}
              <Link href="/app" className="hover:text-stone-900">
                ← INCASSA
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-stone-500">
            <span>{user.email}</span>
            <form action={signOut}>
              <button type="submit" className="hover:text-stone-900">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 py-10">{children}</div>
    </div>
  );
}

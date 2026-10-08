import Link from "next/link";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";

const LINKS: Record<RestauranteLocale, { href: string; label: string }[]> = {
  "pt-BR": [
    { href: "/restaurante/vendas", label: "Visão geral" },
    { href: "/restaurante/vendas/novo", label: "Novo pedido" },
    { href: "/restaurante/vendas/pedidos", label: "Pedidos" },
    { href: "/restaurante/vendas/mesas", label: "Mesas" },
  ],
  it: [
    { href: "/restaurante/vendas", label: "Panoramica" },
    { href: "/restaurante/vendas/novo", label: "Nuovo ordine" },
    { href: "/restaurante/vendas/pedidos", label: "Ordini" },
    { href: "/restaurante/vendas/mesas", label: "Tavoli" },
  ],
};

export default async function VendasLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await requireRestaurantSubscription("vendas");
  return (
    <div>
      <nav aria-label="Módulos de vendas" className="mb-6 flex flex-wrap gap-2 border-b border-stone-200 pb-4">
        {LINKS[locale].map((item) => (
          <Link key={item.href} href={item.href} className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:border-amber-300 hover:text-amber-800">
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}

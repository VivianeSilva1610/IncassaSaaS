import Link from "next/link";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";

const LINKS: Record<RestauranteLocale, { href: string; label: string }[]> = {
  "pt-BR": [
    { href: "/restaurante/cardapio/produtos", label: "Produtos online" },
    { href: "/restaurante/cardapio", label: "Monte seu Pranzo" },
  ],
  it: [
    { href: "/restaurante/cardapio/produtos", label: "Prodotti online" },
    { href: "/restaurante/cardapio", label: "Componi il Pranzo" },
  ],
};

export default async function CardapioLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await requireRestaurantSubscription("cardapio");
  return (
    <div>
      <nav aria-label="Módulos do menu do site" className="mb-6 flex flex-wrap gap-2 border-b border-stone-200 pb-4">
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

import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { signOut } from "@/app/app/actions";

const navItems = [
  { href: "/restaurante", label: "Visão geral" },
  { href: "/restaurante/estoque", label: "Estoque" },
  { href: "/restaurante/vendas", label: "Vendas" },
  { href: "/restaurante/cardapio", label: "Cardápio" },
  { href: "/restaurante/mesas", label: "Mesas" },
  { href: "/restaurante/cozinha", label: "Cozinha" },
  { href: "/restaurante/custos", label: "Custos" },
  { href: "/restaurante/caixa", label: "Caixa" },
];

export default async function RestauranteLayout({ children }: { children: React.ReactNode }) {
  const { user, supabase, restaurantOwnerId, isOwner } = await requireRestaurantSubscription();

  const { data: pricingConfig } = await supabase
    .from("del_pricing_config")
    .select("nome_negocio")
    .eq("owner_id", restaurantOwnerId)
    .maybeSingle();
  const nomeNegocio = pricingConfig?.nome_negocio || "Gestão do restaurante";

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-semibold text-stone-900">🍽️ {nomeNegocio}</span>
            <nav className="flex flex-wrap gap-4 text-sm font-medium text-stone-600">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-stone-900">
                  {item.label}
                </Link>
              ))}
              {isOwner && (
                <Link href="/restaurante/equipe" className="hover:text-stone-900">
                  Equipe
                </Link>
              )}
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

import Link from "next/link";
import { requireRestaurantSubscription, type ModuloRestaurante } from "@/lib/subscription";
import { signOut } from "@/lib/auth-actions";

const navItems: { href: string; label: string; modulo: ModuloRestaurante }[] = [
  { href: "/restaurante/estoque", label: "Estoque", modulo: "estoque" },
  { href: "/restaurante/vendas", label: "Vendas", modulo: "vendas" },
  { href: "/restaurante/cardapio/produtos", label: "Menu do site", modulo: "cardapio" },
  { href: "/restaurante/cozinha", label: "Cozinha", modulo: "cozinha" },
  { href: "/restaurante/custos", label: "Custos", modulo: "custos" },
  { href: "/restaurante/caixa", label: "Caixa", modulo: "caixa" },
  { href: "/restaurante/financeiro", label: "Financeiro", modulo: "financeiro" },
];

export default async function RestauranteLayout({ children }: { children: React.ReactNode }) {
  const { user, supabase, restaurantOwnerId, isOwner, modulosPermitidos } = await requireRestaurantSubscription();
  const itensVisiveis = isOwner ? navItems : navItems.filter((item) => modulosPermitidos.includes(item.modulo));

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
              <Link href="/restaurante" className="hover:text-stone-900">
                Visão geral
              </Link>
              {itensVisiveis.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-stone-900">
                  {item.label}
                </Link>
              ))}
              {isOwner && (
                <Link href="/restaurante/equipe" className="hover:text-stone-900">
                  Equipe
                </Link>
              )}
              {isOwner && (
                <Link href="/restaurante/fiscal" className="hover:text-stone-900">
                  Fiscal
                </Link>
              )}
              {isOwner && (
                <Link href="/restaurante/dominio" className="hover:text-stone-900">
                  Domínio
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

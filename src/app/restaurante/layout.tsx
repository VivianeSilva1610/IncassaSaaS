import Link from "next/link";
import { requireRestaurantSubscription, type ModuloRestaurante, type RestauranteLocale } from "@/lib/subscription";
import { signOut } from "@/lib/auth-actions";

const NAV_LABELS: Record<RestauranteLocale, Record<string, string>> = {
  "pt-BR": {
    compras: "Compras",
    estoque: "Estoque",
    vendas: "Vendas",
    cardapio: "Cardápio",
    menu_do_site: "Menu do site",
    cozinha: "Cozinha",
    producao: "Produção",
    custos: "Custos",
    caixa: "Caixa",
    financeiro: "Financeiro",
    gestao: "Gestão",
    visao_geral: "Visão geral",
    equipe: "Equipe",
    fiscal: "Fiscal",
    dominio: "Domínio",
    integracoes: "Integrações",
    sair: "Sair",
    nome_negocio_padrao: "Gestão do restaurante",
  },
  it: {
    compras: "Acquisti",
    estoque: "Magazzino",
    vendas: "Vendite",
    cardapio: "Menu",
    menu_do_site: "Menu del sito",
    cozinha: "Cucina",
    producao: "Produzione",
    custos: "Costi",
    caixa: "Cassa",
    financeiro: "Finanza",
    gestao: "Gestione",
    visao_geral: "Panoramica",
    equipe: "Team",
    fiscal: "Fiscale",
    dominio: "Dominio",
    integracoes: "Integrazioni",
    sair: "Esci",
    nome_negocio_padrao: "Gestione del ristorante",
  },
};

export default async function RestauranteLayout({ children }: { children: React.ReactNode }) {
  const { user, supabase, restaurantOwnerId, isOwner, modulosPermitidos, locale } = await requireRestaurantSubscription();
  const t = NAV_LABELS[locale];

  const navItems: { href: string; key: keyof typeof NAV_LABELS["pt-BR"]; modulo: ModuloRestaurante }[] = [
    { href: "/restaurante/compras", key: "compras", modulo: "compras" },
    { href: "/restaurante/estoque", key: "estoque", modulo: "estoque" },
    { href: "/restaurante/vendas", key: "vendas", modulo: "vendas" },
    { href: "/restaurante/cardapio", key: "cardapio", modulo: "cardapio" },
    { href: "/restaurante/cardapio/produtos", key: "menu_do_site", modulo: "cardapio" },
    { href: "/restaurante/cozinha", key: "cozinha", modulo: "cozinha" },
    { href: "/restaurante/producao", key: "producao", modulo: "producao" },
    { href: "/restaurante/custos", key: "custos", modulo: "custos" },
    { href: "/restaurante/caixa", key: "caixa", modulo: "caixa" },
    { href: "/restaurante/financeiro", key: "financeiro", modulo: "financeiro" },
    { href: "/restaurante/gestao", key: "gestao", modulo: "gestao" },
    { href: "/restaurante/fiscal", key: "fiscal", modulo: "fiscal" },
  ];
  const itensVisiveis = isOwner ? navItems : navItems.filter((item) => modulosPermitidos.includes(item.modulo));

  const [{ data: pricingConfig }, { data: restaurant }] = await Promise.all([
    supabase
      .from("del_pricing_config")
      .select("nome_negocio")
      .eq("owner_id", restaurantOwnerId)
      .maybeSingle(),
    supabase
      .from("restaurants")
      .select("id, name, country_code")
      .eq("owner_user_id", restaurantOwnerId)
      .maybeSingle(),
  ]);

  let nomeEstabelecimento = restaurant?.name || pricingConfig?.nome_negocio || t.nome_negocio_padrao;
  let documentoEstabelecimento: string | null = null;
  let rotuloDocumento: "CNPJ" | "Partita IVA" | null = null;

  if (restaurant?.country_code === "IT") {
    const { data: fiscalIt } = await supabase
      .from("restaurant_fiscal_it")
      .select("ragione_sociale, partita_iva")
      .eq("restaurant_id", restaurant.id)
      .maybeSingle();

    nomeEstabelecimento = fiscalIt?.ragione_sociale || nomeEstabelecimento;
    documentoEstabelecimento = fiscalIt?.partita_iva || null;
    rotuloDocumento = "Partita IVA";
  } else {
    const { data: fiscalBr } = await supabase
      .from("del_fiscal_config")
      .select("nome_fantasia, razao_social, cnpj")
      .eq("owner_id", restaurantOwnerId)
      .maybeSingle();

    nomeEstabelecimento = fiscalBr?.nome_fantasia || fiscalBr?.razao_social || nomeEstabelecimento;
    documentoEstabelecimento = fiscalBr?.cnpj || null;
    rotuloDocumento = "CNPJ";
  }

  const nomeNegocio = pricingConfig?.nome_negocio || nomeEstabelecimento;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-semibold text-stone-900">🍽️ {nomeNegocio}</span>
            <nav className="flex flex-wrap gap-4 text-sm font-medium text-stone-600">
              <Link href="/restaurante" className="hover:text-stone-900">
                {t.visao_geral}
              </Link>
              {itensVisiveis.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-stone-900">
                  {t[item.key]}
                </Link>
              ))}
              {isOwner && (
                <Link href="/restaurante/equipe" className="hover:text-stone-900">
                  {t.equipe}
                </Link>
              )}
              {isOwner && (
                <Link href="/restaurante/dominio" className="hover:text-stone-900">
                  {t.dominio}
                </Link>
              )}
              {isOwner && (
                <Link href="/restaurante/integracoes" className="hover:text-stone-900">
                  {t.integracoes}
                </Link>
              )}
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500">
            <div className="border-r border-stone-200 pr-3 text-right leading-tight">
              <p className="font-medium text-stone-800">{nomeEstabelecimento}</p>
              {documentoEstabelecimento && rotuloDocumento && (
                <p className="mt-0.5 text-xs text-stone-500">
                  {rotuloDocumento}: {documentoEstabelecimento}
                </p>
              )}
            </div>
            <span>{user.email}</span>
            <form action={signOut}>
              <button type="submit" className="hover:text-stone-900">
                {t.sair}
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 py-10">{children}</div>
    </div>
  );
}

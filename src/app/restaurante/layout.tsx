import { RestaurantAppShell, type RestaurantNavItem } from "@/components/RestaurantAppShell";
import { AbaSessionGate } from "@/components/restaurante/AbaSessionGate";
import { signOut } from "@/lib/auth-actions";
import { requireRestaurantSubscription, type ModuloRestaurante, type RestauranteLocale } from "@/lib/subscription";

const COPY = {
  "pt-BR": {
    overview: "Visão geral", sales: "Vendas", tables: "Mesas", kitchen: "Cozinha", production: "Produção",
    purchases: "Compras", stock: "Estoque", catalog: "Cardápio", siteMenu: "Menu do site", costs: "Custos",
    cash: "Caixa", finance: "Financeiro", management: "Gestão", fiscal: "Fiscal", team: "Equipe",
    domain: "Domínio", integrations: "Integrações", signOut: "Sair", defaultName: "Gestão do restaurante",
    main: "Principal", operations: "Operação", supplies: "Suprimentos", finances: "Finanças e gestão",
    settings: "Configurações", openMenu: "Abrir menu", closeMenu: "Fechar menu", workspace: "Espaço de trabalho",
    plan: "Meu plano",
  },
  it: {
    overview: "Panoramica", sales: "Vendite", tables: "Tavoli", kitchen: "Cucina", production: "Produzione",
    purchases: "Acquisti", stock: "Magazzino", catalog: "Menu", siteMenu: "Menu del sito", costs: "Costi",
    cash: "Cassa", finance: "Finanza", management: "Gestione", fiscal: "Fiscale", team: "Team",
    domain: "Dominio", integrations: "Integrazioni", signOut: "Esci", defaultName: "Gestione del ristorante",
    main: "Principale", operations: "Operazioni", supplies: "Forniture", finances: "Finanza e gestione",
    settings: "Impostazioni", openMenu: "Apri menu", closeMenu: "Chiudi menu", workspace: "Area di lavoro",
    plan: "Il mio piano",
  },
} satisfies Record<RestauranteLocale, Record<string, string>>;

export default async function RestauranteLayout({ children }: { children: React.ReactNode }) {
  const { user, supabase, restaurantOwnerId, isOwner, modulosPermitidos, locale } = await requireRestaurantSubscription();
  const t = COPY[locale];

  const modules: Array<RestaurantNavItem & { modulo: ModuloRestaurante }> = [
    { href: "/restaurante/vendas", label: t.sales, modulo: "vendas", icon: "sales", group: t.operations },
    { href: "/restaurante/mesas", label: t.tables, modulo: "vendas", icon: "tables", group: t.operations },
    { href: "/restaurante/cozinha", label: t.kitchen, modulo: "cozinha", icon: "kitchen", group: t.operations },
    { href: "/restaurante/producao", label: t.production, modulo: "producao", icon: "production", group: t.operations },
    { href: "/restaurante/compras", label: t.purchases, modulo: "compras", icon: "purchases", group: t.supplies },
    { href: "/restaurante/estoque", label: t.stock, modulo: "estoque", icon: "stock", group: t.supplies },
    { href: "/restaurante/cardapio", label: t.catalog, modulo: "cardapio", icon: "menu", group: t.supplies },
    { href: "/restaurante/cardapio/produtos", label: t.siteMenu, modulo: "cardapio", icon: "domain", group: t.supplies },
    { href: "/restaurante/custos", label: t.costs, modulo: "custos", icon: "costs", group: t.finances },
    { href: "/restaurante/caixa", label: t.cash, modulo: "caixa", icon: "cash", group: t.finances },
    { href: "/restaurante/financeiro", label: t.finance, modulo: "financeiro", icon: "finance", group: t.finances },
    { href: "/restaurante/gestao", label: t.management, modulo: "gestao", icon: "management", group: t.finances },
    { href: "/restaurante/fiscal", label: t.fiscal, modulo: "fiscal", icon: "fiscal", group: t.finances },
  ];

  const [{ data: pricingConfig }, { data: restaurant }] = await Promise.all([
    supabase.from("del_pricing_config").select("nome_negocio").eq("owner_id", restaurantOwnerId).maybeSingle(),
    supabase.from("restaurants").select("id, name, country_code").eq("owner_user_id", restaurantOwnerId).maybeSingle(),
  ]);

  let restaurantName = restaurant?.name || pricingConfig?.nome_negocio || t.defaultName;
  let documentValue: string | null = null;
  let documentLabel: "CNPJ" | "Partita IVA" | null = null;

  if (restaurant?.country_code === "IT") {
    const { data } = await supabase.from("restaurant_fiscal_it").select("ragione_sociale, partita_iva").eq("restaurant_id", restaurant.id).maybeSingle();
    restaurantName = data?.ragione_sociale || restaurantName;
    documentValue = data?.partita_iva || null;
    documentLabel = "Partita IVA";
  } else {
    const { data } = await supabase.from("del_fiscal_config").select("nome_fantasia, razao_social, cnpj").eq("owner_id", restaurantOwnerId).maybeSingle();
    restaurantName = data?.nome_fantasia || data?.razao_social || restaurantName;
    documentValue = data?.cnpj || null;
    documentLabel = "CNPJ";
  }

  const visibleModules = isOwner ? modules : modules.filter(item => modulosPermitidos.includes(item.modulo));
  const navItems: RestaurantNavItem[] = [
    { href: "/restaurante", label: t.overview, icon: "overview", group: t.main },
    ...visibleModules,
    ...(isOwner ? [
      { href: "/restaurante/equipe", label: t.team, icon: "team", group: t.settings },
      { href: "/restaurante/dominio", label: t.domain, icon: "domain", group: t.settings },
      { href: "/restaurante/integracoes", label: t.integrations, icon: "integrations", group: t.settings },
      { href: "/restaurante/plano", label: t.plan, icon: "plan", group: t.settings },
    ] : []),
  ];

  return <>
    <AbaSessionGate locale={locale} />
    <RestaurantAppShell
      navItems={navItems}
      restaurantName={restaurantName}
      businessName={pricingConfig?.nome_negocio || restaurantName}
      documentLabel={documentLabel}
      documentValue={documentValue}
      userEmail={user.email ?? ""}
      labels={{ menu: t.openMenu, closeMenu: t.closeMenu, workspace: t.workspace, signOut: t.signOut }}
      signOutAction={signOut}
    >{children}</RestaurantAppShell>
  </>;
}

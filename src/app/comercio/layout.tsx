import { RestaurantAppShell, type RestaurantNavItem } from "@/components/RestaurantAppShell";
import { signOut } from "@/lib/auth-actions";
import { requireCommerceAccess } from "@/lib/commerce-subscription";
import { CommerceAbaGate } from "@/components/comercio/CommerceAbaGate";

const nav: Array<RestaurantNavItem & { module?: string; ownerOnly?: boolean }> = [
  { href: "/comercio", label: "Visão geral", icon: "overview", group: "Principal" },
  { href: "/comercio/vendas", label: "Vendas", icon: "sales", group: "Operação", module: "vendas" },
  { href: "/comercio/vendas/orcamentos", label: "Orçamentos", icon: "sales", group: "Operação", module: "vendas" },
  { href: "/comercio/vendas/pedidos", label: "Pedidos de venda", icon: "purchases", group: "Operação", module: "vendas" },
  { href: "/comercio/produtos", label: "Produtos", icon: "menu", group: "Catálogo", module: "produtos" },
  { href: "/comercio/entradas", label: "Entradas", icon: "purchases", group: "Estoque", module: "compras" },
  { href: "/comercio/pedidos-compra", label: "Pedidos de compra", icon: "purchases", group: "Estoque", module: "compras" },
  { href: "/comercio/fornecedores", label: "Fornecedores", icon: "team", group: "Estoque", module: "compras" },
  { href: "/comercio/inventario", label: "Inventário", icon: "stock", group: "Estoque", module: "estoque" },
  { href: "/comercio/validade", label: "Lotes e validade", icon: "stock", group: "Estoque", module: "estoque" },
  { href: "/comercio/clientes", label: "Clientes", icon: "team", group: "Relacionamento", module: "clientes" },
  { href: "/comercio/caixa", label: "Caixa", icon: "cash", group: "Financeiro", module: "financeiro" },
  { href: "/comercio/financeiro", label: "Contas", icon: "finance", group: "Financeiro", module: "financeiro" },
  { href: "/comercio/gestao", label: "Gestão", icon: "management", group: "Financeiro", module: "financeiro" },
  { href: "/comercio/gestao/dre", label: "DRE gerencial", icon: "finance", group: "Financeiro", module: "financeiro" },
  { href: "/comercio/fiscal", label: "Fiscal", icon: "fiscal", group: "Fiscal", module: "fiscal" },
  { href: "/comercio/fiscal/emissoes", label: "Emissões", icon: "fiscal", group: "Fiscal", module: "fiscal" },
  { href: "/comercio/equipe", label: "Equipe", icon: "team", group: "Configurações", ownerOnly: true },
  { href: "/comercio/equipe/atividade", label: "Auditoria", icon: "management", group: "Configurações", ownerOnly: true },
  { href: "/comercio/plano", label: "Meu plano", icon: "costs", group: "Configurações", ownerOnly: true },
];

export default async function ComercioLayout({ children }: { children: React.ReactNode }) {
  const { user, business, isOwner, isAdmin, subscription, modulosAtivos, modulosPessoa } = await requireCommerceAccess();
  const allowed = isOwner ? modulosAtivos : modulosPessoa;
  const visibleNav = nav.filter(item => (!item.ownerOnly || isOwner) && (!item.module || isAdmin || subscription?.addon_modulos_ilimitados || allowed.includes(item.module as never)));
  return <RestaurantAppShell navItems={visibleNav} restaurantName={business?.nome_fantasia || business?.nome || "Nova empresa"} businessName="INCASSA Comércio" documentLabel={null} documentValue={null} userEmail={user.email ?? ""} labels={{ menu: "Abrir menu", closeMenu: "Fechar menu", workspace: "Comércio", signOut: "Sair" }} signOutAction={signOut}><CommerceAbaGate/>{children}</RestaurantAppShell>;
}

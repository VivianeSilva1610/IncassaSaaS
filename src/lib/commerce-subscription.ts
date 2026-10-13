import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { isAdminEmail } from "@/lib/subscription";

export const MODULOS_COMERCIO = ["vendas", "produtos", "estoque", "compras", "clientes", "financeiro", "fiscal"] as const;
export type ModuloComercio = (typeof MODULOS_COMERCIO)[number];

export async function requireCommerceAccess(moduloRequerido?: ModuloComercio) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: staff } = await supabase.from("commerce_staff").select("owner_id, gerente, modulos").ilike("email", user.email ?? "").maybeSingle();
  const ownerId = staff?.owner_id ?? user.id;
  const isOwner = !staff;
  const isAdmin = isAdminEmail(user.email);
  const { data: business } = await supabase
    .from("commerce_businesses")
    .select("id, nome, nome_fantasia, cnpj, inscricao_estadual, uf, status")
    .eq("owner_id", ownerId)
    .maybeSingle();

  const { data: storedSubscription } = await supabase.from("commerce_subscriptions").select("subscription_status, addon_modulos_ilimitados, addon_equipe_ilimitada, addon_abas_ilimitadas, modulos_ativos, trial_ends_at, current_period_ends_at, cancel_at_period_end").eq("user_id", ownerId).maybeSingle();
  const subscription = isAdmin
    ? {
        subscription_status: "active",
        addon_modulos_ilimitados: true,
        addon_equipe_ilimitada: true,
        addon_abas_ilimitadas: true,
        modulos_ativos: [...MODULOS_COMERCIO],
        trial_ends_at: null,
        current_period_ends_at: null,
        cancel_at_period_end: false,
      }
    : storedSubscription;
  const modulosAtivos = isAdmin
    ? [...MODULOS_COMERCIO]
    : ((subscription?.modulos_ativos as ModuloComercio[] | null) ?? []);
  const modulosPessoa = (staff?.modulos as ModuloComercio[] | null) ?? [];
  // A equipe herda o plano do proprietário; não pode manter acesso quando a
  // assinatura da empresa estiver suspensa ou cancelada.
  const active = isAdmin || (!!subscription && ["trialing", "active"].includes(subscription.subscription_status));
  if (!business && !active) redirect("/ativar-comercio");
  if (business && !active) redirect("/");
  if (moduloRequerido && !isAdmin && !subscription?.addon_modulos_ilimitados && !modulosAtivos.includes(moduloRequerido)) redirect(`/comercio/plano?bloqueado=${moduloRequerido}`);
  if (moduloRequerido && staff && !isAdmin && !modulosPessoa.includes(moduloRequerido)) redirect("/comercio");

  return { supabase, user, business, ownerId, isOwner, isAdmin, isGerente: isOwner || isAdmin || !!staff?.gerente, subscription, modulosAtivos, modulosPessoa };
}

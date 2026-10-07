import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

export async function requireActiveSubscription() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();

  const hasAccess =
    isAdminEmail(user.email) || (!!profile && ["trialing", "active"].includes(profile.subscription_status));

  if (!hasAccess) {
    // No INCASSA access — if they're a restaurant owner/staff member instead
    // (a different product, same login), send them there rather than to the
    // INCASSA paywall they were never trying to reach.
    const { data: staffRow } = await supabase.from("del_staff").select("id").eq("email", user.email).maybeSingle();
    const { data: ownRestaurantSub } = await supabase
      .from("restaurant_subscriptions")
      .select("subscription_status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (staffRow || (!!ownRestaurantSub && ["trialing", "active"].includes(ownRestaurantSub.subscription_status))) {
      redirect("/restaurante");
    }

    redirect("/app/abbonamento");
  }

  return { user, profile };
}

export const MODULOS_RESTAURANTE = ["estoque", "vendas", "cardapio", "cozinha", "custos", "caixa", "financeiro", "gestao"] as const;
export type ModuloRestaurante = (typeof MODULOS_RESTAURANTE)[number];

/**
 * `moduloRequerido`, quando informado, bloqueia o acesso de quem não é dono
 * (nem admin da plataforma) e não tem esse módulo na lista liberada pelo
 * dono — hierarquia por módulo (ex: responsável pelo caixa só acessa
 * Caixa+Vendas, chef só acessa Cozinha). Sem esse parâmetro, a checagem de
 * módulo é pulada (ex: /restaurante, a visão geral, é aberta a todo mundo).
 */
export async function requireRestaurantSubscription(moduloRequerido?: ModuloRestaurante) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // If this email is registered as someone else's staff, they act on that
  // restaurant's data (restaurantOwnerId), not their own — inserts must use
  // this value explicitly, since owner_id's column default (auth.uid())
  // would otherwise point at the staff member's own id.
  const { data: staffRow } = await supabase
    .from("del_staff")
    .select("owner_id, gerente, modulos")
    .eq("email", user.email)
    .maybeSingle();

  const restaurantOwnerId = staffRow?.owner_id ?? user.id;
  const isOwner = !staffRow;
  const isAdmin = isAdminEmail(user.email);
  // Gerente: dono sempre é, e-mail admin da plataforma também (mesmo
  // critério já usado em hasAccess), ou staff marcado como gerente.
  const isGerente = isOwner || isAdmin || !!staffRow?.gerente;
  const modulosPermitidos: ModuloRestaurante[] = (staffRow?.modulos as ModuloRestaurante[] | null) ?? [];

  const { data: subscription } = await supabase
    .from("restaurant_subscriptions")
    .select("subscription_status")
    .eq("user_id", restaurantOwnerId)
    .maybeSingle();

  const hasAccess =
    isAdmin ||
    !!staffRow ||
    (!!subscription && ["trialing", "active"].includes(subscription.subscription_status));

  if (!hasAccess) {
    redirect("/");
  }

  if (moduloRequerido && !isOwner && !isAdmin && !modulosPermitidos.includes(moduloRequerido)) {
    redirect("/restaurante");
  }

  return { user, supabase, restaurantOwnerId, isOwner, isGerente, modulosPermitidos, subscription };
}

import type { SupabaseClient } from "@supabase/supabase-js";

// FASE 2 — resolução de tenant por slug. Troca o antigo mecanismo de
// e-mail fixo (src/lib/pranzo.ts) por uma busca real na tabela
// restaurants — a mesma função serve a loja pública e o checkout, e
// nenhum dos dois aceita ownerId/restaurantId vindo do navegador sem
// essa resolução no servidor.
export type RestaurantPublic = {
  id: string;
  ownerUserId: string;
  name: string;
  slug: string;
  countryCode: string;
  currency: string;
  timezone: string;
  defaultLocale: string;
};

export async function getRestaurantBySlug(admin: SupabaseClient, slug: string): Promise<RestaurantPublic | null> {
  const { data } = await admin
    .from("restaurants")
    .select("id, owner_user_id, name, slug, country_code, currency, timezone, default_locale")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    ownerUserId: data.owner_user_id,
    name: data.name,
    slug: data.slug,
    countryCode: data.country_code,
    currency: data.currency,
    timezone: data.timezone,
    defaultLocale: data.default_locale,
  };
}

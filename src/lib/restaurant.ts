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
  logoUrl: string | null;
  capaUrl: string | null;
  corPrimaria: string | null;
};

export async function getRestaurantBySlug(admin: SupabaseClient, slug: string): Promise<RestaurantPublic | null> {
  const { data } = await admin
    .from("restaurants")
    .select("id, owner_user_id, name, slug, country_code, currency, timezone, default_locale, logo_url, capa_url, cor_primaria")
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
    logoUrl: data.logo_url,
    capaUrl: data.capa_url,
    corPrimaria: data.cor_primaria,
  };
}

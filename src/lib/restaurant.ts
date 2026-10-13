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
  contatoEmail: string | null;
  contatoWhatsapp: string | null;
};

export async function getRestaurantBySlug(admin: SupabaseClient, slug: string): Promise<RestaurantPublic | null> {
  const { data } = await admin
    .from("restaurants")
    .select("id, owner_user_id, name, slug, country_code, currency, timezone, default_locale, logo_url, capa_url, cor_primaria, contato_email, contato_whatsapp")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!data) return null;

  let contatoEmail = data.contato_email as string | null;
  // Nenhum contato próprio configurado ainda — cai no e-mail de login do
  // dono (sempre existe) em vez de deixar o botão "Fazer pedido" sem
  // destino nenhum, ou pior, apontando pro contato de outro restaurante.
  if (!contatoEmail) {
    const { data: ownerMember } = await admin
      .from("restaurant_members")
      .select("email")
      .eq("restaurant_id", data.id)
      .eq("role", "owner")
      .maybeSingle();
    contatoEmail = ownerMember?.email ?? null;
  }

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
    contatoEmail,
    contatoWhatsapp: data.contato_whatsapp,
  };
}

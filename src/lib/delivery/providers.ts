import type { SupabaseClient } from "@supabase/supabase-js";

// Lookup das credenciais de pagamento/e-mail PRÓPRIAS de cada restaurante
// (restaurant_payment_providers/restaurant_email_providers) — nunca cai de
// volta pra uma conta compartilhada: se o restaurante não configurou a
// própria, a funcionalidade fica indisponível pra ele (null), em vez de
// silenciosamente usar a conta de outro tenant.
export async function getAsaasApiKeyForRestaurant(
  supabase: SupabaseClient,
  restaurantId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("restaurant_payment_providers")
    .select("asaas_api_key, ativo")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (!data?.ativo || !data.asaas_api_key) return null;
  return data.asaas_api_key as string;
}

export type PaymentProviderConfig =
  | { provider: "asaas"; apiKey: string }
  | { provider: "stripe"; secretKey: string };

export async function getPaymentProviderForRestaurant(
  supabase: SupabaseClient,
  restaurantId: string,
): Promise<PaymentProviderConfig | null> {
  const { data } = await supabase
    .from("restaurant_payment_providers")
    .select("provedor, asaas_api_key, stripe_secret_key, ativo")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (!data?.ativo) return null;
  if (data.provedor === "stripe" && data.stripe_secret_key) {
    return { provider: "stripe", secretKey: data.stripe_secret_key as string };
  }
  if (data.provedor === "asaas" && data.asaas_api_key) {
    return { provider: "asaas", apiKey: data.asaas_api_key as string };
  }
  return null;
}

export async function getResendConfigForRestaurant(
  supabase: SupabaseClient,
  restaurantId: string,
): Promise<{ apiKey: string; fromEmail: string; fromName: string | null } | null> {
  const { data } = await supabase
    .from("restaurant_email_providers")
    .select("resend_api_key, from_email, from_name, ativo")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (!data?.ativo || !data.resend_api_key || !data.from_email) return null;
  return { apiKey: data.resend_api_key as string, fromEmail: data.from_email as string, fromName: (data.from_name as string | null) ?? null };
}

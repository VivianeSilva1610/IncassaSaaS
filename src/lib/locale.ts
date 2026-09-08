import type { SupabaseClient } from "@supabase/supabase-js";

export type Locale = "it" | "en";

export async function getUserLocale(supabase: SupabaseClient, userId: string): Promise<Locale> {
  const { data } = await supabase.from("profiles").select("locale").eq("id", userId).single();
  return (data?.locale as Locale | undefined) ?? "it";
}

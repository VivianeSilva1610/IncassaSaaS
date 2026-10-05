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
    redirect("/app/abbonamento");
  }

  return { user, profile };
}

export async function requireRestaurantSubscription() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: subscription } = await supabase
    .from("restaurant_subscriptions")
    .select("subscription_status")
    .eq("user_id", user.id)
    .maybeSingle();

  const hasAccess =
    isAdminEmail(user.email) ||
    (!!subscription && ["trialing", "active"].includes(subscription.subscription_status));

  if (!hasAccess) {
    redirect("/");
  }

  return { user, supabase, subscription };
}

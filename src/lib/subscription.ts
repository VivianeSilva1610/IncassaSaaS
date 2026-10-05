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

export async function requireRestaurantSubscription() {
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
    .select("owner_id")
    .eq("email", user.email)
    .maybeSingle();

  const restaurantOwnerId = staffRow?.owner_id ?? user.id;
  const isOwner = !staffRow;

  const { data: subscription } = await supabase
    .from("restaurant_subscriptions")
    .select("subscription_status")
    .eq("user_id", restaurantOwnerId)
    .maybeSingle();

  const hasAccess =
    isAdminEmail(user.email) ||
    !!staffRow ||
    (!!subscription && ["trialing", "active"].includes(subscription.subscription_status));

  if (!hasAccess) {
    redirect("/");
  }

  return { user, supabase, restaurantOwnerId, isOwner, subscription };
}

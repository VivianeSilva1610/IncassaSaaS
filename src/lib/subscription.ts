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

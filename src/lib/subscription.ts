import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

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

  if (!profile || !["trialing", "active"].includes(profile.subscription_status)) {
    redirect("/app/abbonamento");
  }

  return { user, profile };
}

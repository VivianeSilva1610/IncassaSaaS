import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export function isDeliveryAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const admin = (process.env.DELIVERY_ADMIN_EMAIL ?? "").trim().toLowerCase();
  return !!admin && admin === email.toLowerCase();
}

export async function requireDeliveryAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!isDeliveryAdminEmail(user.email)) redirect("/app");

  return { supabase, user };
}

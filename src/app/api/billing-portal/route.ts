import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase-server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "Nessun abbonamento trovato" }, { status: 404 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${siteUrl}/app/impostazioni`,
  });

  return NextResponse.json({ url: session.url });
}

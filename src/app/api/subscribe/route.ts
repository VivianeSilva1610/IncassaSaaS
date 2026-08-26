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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    client_reference_id: user.id,
    line_items: [
      {
        price: process.env.STRIPE_PRICE_INCASSA_SAAS!,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: 7,
      metadata: { user_id: user.id },
    },
    success_url: `${siteUrl}/app?subscribed=1`,
    cancel_url: `${siteUrl}/app/abbonamento?checkout=cancelled`,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Errore nella creazione della sessione" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}

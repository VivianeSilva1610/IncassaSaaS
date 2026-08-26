import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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
  const cookieStore = await cookies();

  const fbp = cookieStore.get("_fbp")?.value ?? "";
  const fbc = cookieStore.get("_fbc")?.value ?? "";

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
      // Duplicato qui (oltre che sulla Checkout Session) perché il webhook
      // customer.subscription.updated riceve l'oggetto Subscription, non la
      // Session originale — serve per l'evento Meta CAPI "Subscribe" quando
      // il trial si converte in abbonamento pagante, giorni dopo.
      metadata: { user_id: user.id, fbp, fbc },
    },
    success_url: `${siteUrl}/app?subscribed=1`,
    cancel_url: `${siteUrl}/app/abbonamento?checkout=cancelled`,
    metadata: { fbp, fbc },
  });

  if (!session.url) {
    return NextResponse.json({ error: "Errore nella creazione della sessione" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSubscriptionCheckout } from "@/lib/stripe";
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

  const session = await createSubscriptionCheckout({
    priceId: process.env.STRIPE_PRICE_RESTAURANTE_SAAS!,
    userId: user.id,
    email: user.email,
    successUrl: `${siteUrl}/restaurante?subscribed=1`,
    cancelUrl: `${siteUrl}/restaurante?checkout=cancelled`,
    product: "restaurante",
    trialPeriodDays: 7,
    fbp: cookieStore.get("_fbp")?.value ?? "",
    fbc: cookieStore.get("_fbc")?.value ?? "",
  });

  if (!session.url) {
    return NextResponse.json({ error: "Errore nella creazione della sessione" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getStripe } from "@/lib/stripe";
import type { Locale } from "@/lib/locale";

const termsMessage: Record<Locale, (siteUrl: string) => string> = {
  it: (siteUrl) =>
    `Accetto i [Termini e Condizioni](${siteUrl}/termini): richiedo l'accesso immediato al contenuto digitale e riconosco di perdere il diritto di recesso di 14 giorni.`,
  en: (siteUrl) =>
    `I accept the [Terms & Conditions](${siteUrl}/en/termini): I request immediate access to the digital content and acknowledge I lose the 14-day right of withdrawal.`,
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const locale: Locale = body.locale === "en" ? "en" : "it";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const cookieStore = await cookies();
  const homePath = locale === "en" ? "/en" : "/";

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_KIT_INCASSA!,
        quantity: 1,
      },
    ],
    success_url: `${siteUrl}/acesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}${homePath}?checkout=cancelled`,
    consent_collection: {
      terms_of_service: "required",
    },
    custom_text: {
      terms_of_service_acceptance: {
        message: termsMessage[locale](siteUrl),
      },
    },
    metadata: {
      fbp: cookieStore.get("_fbp")?.value ?? "",
      fbc: cookieStore.get("_fbc")?.value ?? "",
      locale,
    },
  });

  if (!session.url) {
    return NextResponse.json({ error: "Impossibile creare la sessione di pagamento" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}

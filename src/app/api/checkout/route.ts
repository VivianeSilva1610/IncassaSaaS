import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: "Kit Incassa — 37 messaggi pronti",
            description:
              "37 messaggi pronti per farti pagare senza rovinare il rapporto con il cliente.",
          },
          unit_amount: 900,
        },
        quantity: 1,
      },
    ],
    success_url: `${siteUrl}/acesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/?checkout=cancelled`,
    consent_collection: {
      terms_of_service: "required",
    },
    custom_text: {
      terms_of_service_acceptance: {
        message: `Accetto i [Termini e Condizioni](${siteUrl}/termini): richiedo l'accesso immediato al contenuto digitale e riconosco di perdere il diritto di recesso di 14 giorni.`,
      },
    },
  });

  if (!session.url) {
    return NextResponse.json({ error: "Impossibile creare la sessione di pagamento" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}

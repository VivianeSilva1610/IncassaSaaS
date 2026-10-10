import { NextResponse } from "next/server";
import { createSubscriptionCheckout } from "@/lib/stripe";
import { requireRestaurantSubscription } from "@/lib/subscription";

const ADDONS = {
  modulos: { envVar: "STRIPE_PRICE_ADDON_MODULOS_RESTAURANTE", product: "restaurante_addon_modulos" },
  equipe: { envVar: "STRIPE_PRICE_ADDON_EQUIPE_RESTAURANTE", product: "restaurante_addon_equipe" },
  abas: { envVar: "STRIPE_PRICE_ADDON_ABAS_RESTAURANTE", product: "restaurante_addon_abas" },
} as const;

export async function POST(req: Request) {
  const { user, isOwner } = await requireRestaurantSubscription();
  if (!isOwner) return NextResponse.json({ error: "Apenas o dono do restaurante pode contratar complementos." }, { status: 403 });

  const { tipo } = (await req.json()) as { tipo?: keyof typeof ADDONS };
  const addon = tipo ? ADDONS[tipo] : null;
  if (!addon) return NextResponse.json({ error: "Complemento inválido." }, { status: 400 });

  const priceId = process.env[addon.envVar];
  if (!priceId) {
    return NextResponse.json({ error: "Esse complemento ainda não está disponível para contratação — fale com o suporte." }, { status: 503 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const session = await createSubscriptionCheckout({
    priceId,
    userId: user.id,
    email: user.email,
    successUrl: `${siteUrl}/restaurante/plano?addon=${tipo}&sucesso=1`,
    cancelUrl: `${siteUrl}/restaurante/plano?checkout=cancelled`,
    product: addon.product,
    trialPeriodDays: 0,
  });

  if (!session.url) return NextResponse.json({ error: "Erro ao criar a sessão de pagamento." }, { status: 500 });
  return NextResponse.json({ url: session.url });
}

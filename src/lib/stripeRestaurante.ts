import Stripe from "stripe";

// Chave de cada restaurante, nunca a nossa (STRIPE_SECRET_KEY em src/lib/stripe.ts
// é só pra cobrança da própria plataforma — assinatura/add-ons). Uma
// instância por chamada, já que a chave muda por restaurante.
function stripeDoRestaurante(secretKey: string): Stripe {
  return new Stripe(secretKey);
}

export async function createRestaurantCheckoutSession(params: {
  stripeSecretKey: string;
  orderId: string;
  currency: "brl" | "eur";
  valueInCents: number;
  description: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; url: string }> {
  const session = await stripeDoRestaurante(params.stripeSecretKey).checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: params.currency,
          unit_amount: params.valueInCents,
          product_data: { name: params.description },
        },
        quantity: 1,
      },
    ],
    metadata: { order_id: params.orderId },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });
  if (!session.url) throw new Error("A Stripe não retornou a URL de pagamento.");
  return { id: session.id, url: session.url };
}

/**
 * Confirma o pagamento consultando a própria Stripe (sem depender de
 * webhook por restaurante, que exigiria guardar um signing secret por
 * tenant). Usado na volta do redirecionamento do Checkout — não cobre o
 * caso raro de o cliente pagar e fechar a aba antes de voltar; a Asaas tem
 * um webhook de verdade, esse caminho ainda não.
 */
export async function confirmarCheckoutSessionPaga(
  stripeSecretKey: string,
  sessionId: string,
): Promise<{ pago: boolean; orderId: string | null }> {
  const session = await stripeDoRestaurante(stripeSecretKey).checkout.sessions.retrieve(sessionId);
  return {
    pago: session.payment_status === "paid",
    orderId: typeof session.metadata?.order_id === "string" ? session.metadata.order_id : null,
  };
}

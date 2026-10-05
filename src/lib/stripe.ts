import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripeInstance;
}

export async function createSubscriptionCheckout(params: {
  priceId: string;
  userId: string;
  email: string | undefined;
  successUrl: string;
  cancelUrl: string;
  product: string;
  trialPeriodDays: number;
  fbp?: string;
  fbc?: string;
}) {
  return getStripe().checkout.sessions.create({
    mode: "subscription",
    customer_email: params.email,
    client_reference_id: params.userId,
    line_items: [{ price: params.priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: params.trialPeriodDays,
      // Duplicato qui (oltre che sulla Checkout Session) perché gli eventi
      // webhook customer.subscription.updated/deleted ricevono l'oggetto
      // Subscription, non la Session originale.
      metadata: { user_id: params.userId, product: params.product, fbp: params.fbp ?? "", fbc: params.fbc ?? "" },
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { product: params.product, fbp: params.fbp ?? "", fbc: params.fbc ?? "" },
  });
}

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendKitEmail } from "@/lib/email";
import { sendMetaEvent } from "@/lib/meta-capi";

async function handleKitIncassaCheckout(session: Stripe.Checkout.Session) {
  const email = session.customer_details?.email ?? session.customer_email;
  if (!email || session.payment_status !== "paid") return;

  const supabase = getSupabaseAdmin();

  const { data: purchase, error } = await supabase
    .from("purchases")
    .upsert(
      {
        stripe_session_id: session.id,
        email,
        product: "kit_incassa",
        status: "paid",
      },
      { onConflict: "stripe_session_id" },
    )
    .select()
    .single();

  if (!error && purchase && !purchase.email_sent_at) {
    const result = await sendKitEmail(email, session.id);
    if (result.ok) {
      await supabase.from("purchases").update({ email_sent_at: new Date().toISOString() }).eq("id", purchase.id);
    } else {
      console.error(`sendKitEmail failed for purchase ${purchase.id}:`, result.error);
    }
  }

  await sendMetaEvent({
    eventName: "Purchase",
    eventId: session.id,
    email,
    fbp: session.metadata?.fbp,
    fbc: session.metadata?.fbc,
    value: (session.amount_total ?? 0) / 100,
    currency: session.currency?.toUpperCase() ?? "EUR",
  });
}

async function handleSubscriptionCheckout(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  if (!userId) return;

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

  await getSupabaseAdmin()
    .from("profiles")
    .update({
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    })
    .eq("id", userId);

  await sendMetaEvent({
    eventName: "StartTrial",
    eventId: session.id,
    email: session.customer_details?.email ?? session.customer_email,
    fbp: session.metadata?.fbp,
    fbc: session.metadata?.fbc,
    value: 19.9,
    currency: "EUR",
  });
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  previousAttributes?: Partial<Stripe.Subscription>,
) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  const supabase = getSupabaseAdmin();

  await supabase
    .from("profiles")
    .update({
      subscription_status: subscription.status,
      trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    })
    .eq("id", userId);

  // Il trial è appena diventato un abbonamento pagante (prima addebito reale,
  // di solito 7 giorni dopo lo StartTrial) — è la conversione vera per Meta,
  // non il semplice inizio del trial.
  if (previousAttributes?.status === "trialing" && subscription.status === "active") {
    const { data: profile } = await supabase.from("profiles").select("email").eq("id", userId).single();

    await sendMetaEvent({
      eventName: "Subscribe",
      eventId: `${subscription.id}:converted`,
      email: profile?.email,
      fbp: subscription.metadata?.fbp,
      fbc: subscription.metadata?.fbc,
      value: 19.9,
      currency: "EUR",
    });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  await getSupabaseAdmin().from("profiles").update({ subscription_status: "canceled" }).eq("id", userId);
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode === "subscription") {
      await handleSubscriptionCheckout(session);
    } else {
      await handleKitIncassaCheckout(session);
    }
  } else if (event.type === "customer.subscription.updated") {
    const previousAttributes = (event.data as { previous_attributes?: Partial<Stripe.Subscription> })
      .previous_attributes;
    await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, previousAttributes);
  } else if (event.type === "customer.subscription.deleted") {
    await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
  }

  return NextResponse.json({ received: true });
}

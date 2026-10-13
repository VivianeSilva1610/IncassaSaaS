import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendKitEmail } from "@/lib/email";
import { sendMetaEvent } from "@/lib/meta-capi";
import type { Locale } from "@/lib/locale";
import { deduzirEstoquePorVenda } from "@/lib/delivery/stock";

function commerceSubscriptionStatus(status: Stripe.Subscription.Status) {
  return (["trialing", "active", "past_due", "canceled"] as const).find(value => value === status) ?? "inactive";
}

function commerceSubscriptionCycle(subscription: Stripe.Subscription) {
  const periodEnd = subscription.items.data.reduce<number | null>((latest, item) => {
    if (!item.current_period_end) return latest;
    return latest === null ? item.current_period_end : Math.max(latest, item.current_period_end);
  }, null);
  return {
    trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    current_period_ends_at: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  };
}

async function handleKitIncassaCheckout(session: Stripe.Checkout.Session) {
  const email = session.customer_details?.email ?? session.customer_email;
  if (!email || session.payment_status !== "paid") return;
  const locale: Locale = session.metadata?.locale === "en" ? "en" : "it";

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
    const result = await sendKitEmail(email, session.id, locale);
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

// Pix é um método de pagamento assíncrono: checkout.session.completed
// dispara antes de o cliente realmente pagar (payment_status ainda
// "unpaid"), e a confirmação real chega depois via
// checkout.session.async_payment_succeeded. Por isso esta função é
// chamada nos dois eventos, e só age quando payment_status === "paid".
async function handlePranzoPedidoCheckout(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return;

  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  const supabase = getSupabaseAdmin();

  const { data: order } = await supabase
    .from("del_orders")
    .select("id, owner_id, status")
    .eq("id", orderId)
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (!order || order.status !== "aguardando_pagamento") return;

  await supabase.from("del_orders").update({ status: "novo" }).eq("id", order.id);

  const { data: items } = await supabase
    .from("del_order_items")
    .select("product_id, quantidade")
    .eq("order_id", order.id);

  if (items && items.length > 0) {
    await deduzirEstoquePorVenda(supabase, {
      ownerId: order.owner_id,
      orderId: order.id,
      items: items.map((i) => ({ productId: i.product_id, quantidade: Number(i.quantidade) })),
    });
  }
}

// Complementos de plano do restaurante: cada um é uma assinatura Stripe
// própria (mesmo checkout genérico da assinatura principal), identificada
// pelo metadata.product. Mapeia pra coluna booleana em
// restaurant_subscriptions — essa tabela precisa já existir pro usuário
// (criada pela assinatura principal), por isso é update, não upsert.
const CONFIG_POR_ADDON: Record<string, { table: "restaurant_subscriptions" | "commerce_subscriptions"; column: string }> = {
  restaurante_addon_modulos: { table: "restaurant_subscriptions", column: "addon_modulos_ilimitados" },
  restaurante_addon_equipe: { table: "restaurant_subscriptions", column: "addon_equipe_ilimitada" },
  restaurante_addon_abas: { table: "restaurant_subscriptions", column: "addon_abas_ilimitadas" },
  comercio_addon_modulos: { table: "commerce_subscriptions", column: "addon_modulos_ilimitados" },
  comercio_addon_equipe: { table: "commerce_subscriptions", column: "addon_equipe_ilimitada" },
  comercio_addon_abas: { table: "commerce_subscriptions", column: "addon_abas_ilimitadas" },
};

async function handleAddonCheckout(userId: string, product: string) {
  const config = CONFIG_POR_ADDON[product];
  if (!config) return false;
  const supabase = getSupabaseAdmin();
  await supabase.from(config.table).update({ [config.column]: true }).eq("user_id", userId);
  return true;
}

async function handleAddonSubscriptionDeleted(userId: string, product: string) {
  const config = CONFIG_POR_ADDON[product];
  if (!config) return false;
  const supabase = getSupabaseAdmin();
  await supabase.from(config.table).update({ [config.column]: false }).eq("user_id", userId);
  return true;
}

async function handleSubscriptionCheckout(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  if (!userId) return;

  const productRaw = session.metadata?.product ?? "incassa";
  if (await handleAddonCheckout(userId, productRaw)) return;

  const product = productRaw === "restaurante" ? "restaurante" : productRaw === "comercio" ? "comercio" : "incassa";

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

  const supabase = getSupabaseAdmin();

  if (product === "restaurante") {
    await supabase.from("restaurant_subscriptions").upsert(
      {
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      },
      { onConflict: "user_id" },
    );
    return;
  }

  if (product === "comercio") {
    await supabase.from("commerce_subscriptions").upsert({
      user_id: userId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscription.id,
      subscription_status: commerceSubscriptionStatus(subscription.status),
      ...commerceSubscriptionCycle(subscription),
    }, { onConflict: "user_id" });
    return;
  }

  await supabase
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
  if (CONFIG_POR_ADDON[subscription.metadata?.product ?? ""]) return; // add-on é on/off, sem status próprio a sincronizar aqui

  const supabase = getSupabaseAdmin();
  const productRaw = subscription.metadata?.product;
  const product = productRaw === "restaurante" ? "restaurante" : productRaw === "comercio" ? "comercio" : "incassa";

  if (product === "restaurante") {
    await supabase
      .from("restaurant_subscriptions")
      .update({
        subscription_status: subscription.status,
        trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      })
      .eq("user_id", userId);
    return;
  }

  if (product === "comercio") {
    await supabase.from("commerce_subscriptions").update({
      subscription_status: commerceSubscriptionStatus(subscription.status),
      ...commerceSubscriptionCycle(subscription),
    }).eq("user_id", userId);
    return;
  }

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
  if (await handleAddonSubscriptionDeleted(userId, subscription.metadata?.product ?? "")) return;

  const productRaw = subscription.metadata?.product;
  const product = productRaw === "restaurante" ? "restaurante" : productRaw === "comercio" ? "comercio" : "incassa";
  const supabase = getSupabaseAdmin();

  if (product === "restaurante") {
    await supabase.from("restaurant_subscriptions").update({ subscription_status: "canceled" }).eq("user_id", userId);
    return;
  }


  if (product === "comercio") {
    await supabase.from("commerce_subscriptions").update({
      subscription_status: "canceled",
      cancel_at_period_end: false,
      current_period_ends_at: null,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);
    return;
  }

  await supabase.from("profiles").update({ subscription_status: "canceled" }).eq("id", userId);
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

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.product === "pranzo_pedido") {
      await handlePranzoPedidoCheckout(session);
    } else if (session.mode === "subscription") {
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

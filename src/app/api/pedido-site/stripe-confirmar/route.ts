import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getRestaurantBySlug } from "@/lib/restaurant";
import { getPaymentProviderForRestaurant } from "@/lib/delivery/providers";
import { confirmarCheckoutSessionPaga } from "@/lib/stripeRestaurante";
import { deduzirEstoquePorVenda } from "@/lib/delivery/stock";
import { confirmarPagamentoEEmitirNota } from "@/lib/fiscal/emitir";

// Volta do redirecionamento do Stripe Checkout (success_url) — confirma o
// pagamento consultando a própria Stripe do restaurante (não depende de
// webhook por tenant) e só então libera o pedido pra cozinha. Não cobre o
// caso raro de o cliente pagar e fechar a aba antes de voltar.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  const slug = url.searchParams.get("slug");

  if (!sessionId || !slug) {
    return NextResponse.redirect(new URL("/", url.origin));
  }

  const admin = getSupabaseAdmin();
  const destino = new URL(`/loja/${slug}`, url.origin);

  const restaurant = await getRestaurantBySlug(admin, slug);
  if (!restaurant) return NextResponse.redirect(destino);

  const providerConfig = await getPaymentProviderForRestaurant(admin, restaurant.id);
  if (!providerConfig || providerConfig.provider !== "stripe") return NextResponse.redirect(destino);

  const { pago, orderId } = await confirmarCheckoutSessionPaga(providerConfig.secretKey, sessionId);
  if (!pago || !orderId) return NextResponse.redirect(destino);

  const { data: order } = await admin
    .from("del_orders")
    .select("id, owner_id, status, pago, stripe_checkout_session_id")
    .eq("id", orderId)
    .eq("owner_id", restaurant.ownerUserId)
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (!order || order.pago) {
    // Já confirmado antes (cliente recarregou essa URL) ou pedido não bate
    // com esse restaurante/sessão — idempotente, não processa de novo.
    return NextResponse.redirect(destino);
  }

  if (order.status === "aguardando_pagamento") {
    const { data: confirmedOrder } = await admin
      .from("del_orders")
      .update({ status: "novo", chegou_cozinha_em: new Date().toISOString() })
      .eq("id", order.id)
      .eq("owner_id", order.owner_id)
      .eq("status", "aguardando_pagamento")
      .select("id")
      .maybeSingle();

    if (confirmedOrder) {
      const { data: items } = await admin
        .from("del_order_items")
        .select("product_id, quantidade")
        .eq("order_id", order.id);

      if (items && items.length > 0) {
        await deduzirEstoquePorVenda(admin, {
          ownerId: order.owner_id,
          orderId: order.id,
          items: items.map((i) => ({ productId: i.product_id, quantidade: Number(i.quantidade) })),
        });
      }

      await confirmarPagamentoEEmitirNota(admin, {
        ownerId: order.owner_id,
        orderId: order.id,
        formaPagamento: "cartao",
      });
    }
  }

  return NextResponse.redirect(destino);
}

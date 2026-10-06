import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { deduzirEstoquePorVenda } from "@/lib/delivery/stock";

const CONFIRMING_EVENTS = ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"];

export async function POST(req: Request) {
  const token = req.headers.get("asaas-access-token");
  if (!token || token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !CONFIRMING_EVENTS.includes(body.event)) {
    return NextResponse.json({ received: true });
  }

  const externalReference: string | undefined = body.payment?.externalReference;
  const paymentId: string | undefined = body.payment?.id;
  if (!externalReference) {
    return NextResponse.json({ received: true });
  }

  const admin = getSupabaseAdmin();

  const { data: order } = await admin
    .from("del_orders")
    .select("id, owner_id, status")
    .eq("id", externalReference)
    .maybeSingle();

  if (!order || order.status !== "aguardando_pagamento") {
    // Já confirmado antes (evento pode chegar mais de uma vez) ou pedido não encontrado.
    return NextResponse.json({ received: true });
  }

  await admin
    .from("del_orders")
    .update({ status: "novo", asaas_payment_id: paymentId ?? null })
    .eq("id", order.id);

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

  return NextResponse.json({ received: true });
}

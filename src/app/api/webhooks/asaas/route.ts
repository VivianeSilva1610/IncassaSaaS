import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { deduzirEstoquePorVenda, restaurarEstoquePorCancelamento } from "@/lib/delivery/stock";
import { confirmarPagamentoEEmitirNota } from "@/lib/fiscal/emitir";

const CONFIRMING_EVENTS = ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"];
const REFUND_EVENTS: Record<string, "em_processamento" | "confirmado" | "negado"> = {
  PAYMENT_REFUND_IN_PROGRESS: "em_processamento",
  PAYMENT_PARTIALLY_REFUNDED: "confirmado",
  PAYMENT_REFUNDED: "confirmado",
  PAYMENT_REFUND_DENIED: "negado",
  PAYMENT_RECEIVED_IN_CASH_UNDONE: "confirmado",
};

function asaasEventDate(value: unknown) {
  if (typeof value !== "string") return new Date().toISOString();
  const parsed = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}-03:00`);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export async function POST(req: Request) {
  const token = req.headers.get("asaas-access-token");
  if (!token || token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || (!CONFIRMING_EVENTS.includes(body.event) && !REFUND_EVENTS[body.event])) {
    return NextResponse.json({ received: true });
  }

  const admin = getSupabaseAdmin();
  const refundStatus = REFUND_EVENTS[body.event];
  if (refundStatus) {
    const eventId = typeof body.id === "string" ? body.id : null;
    const paymentId = typeof body.payment?.id === "string" ? body.payment.id : null;
    if (!eventId || !paymentId) return NextResponse.json({ received: true });

    const paymentValue = Number(body.payment?.value);
    const refundedValue = Number(body.payment?.refundedValue);
    const totalRefunded = Number.isFinite(refundedValue) && refundedValue > 0
      ? refundedValue
      : body.event === "PAYMENT_REFUNDED" || body.event === "PAYMENT_RECEIVED_IN_CASH_UNDONE"
        ? paymentValue
        : 0;
    if (!Number.isFinite(totalRefunded) || totalRefunded < 0) {
      return NextResponse.json({ received: true });
    }

    const { data: pedidoAntes } = await admin
      .from("del_orders")
      .select("id, owner_id, valor_pago, totale, valor_estornado")
      .eq("asaas_payment_id", paymentId)
      .maybeSingle();

    const { error } = await admin.rpc("del_registrar_estorno_asaas", {
      p_evento_id: eventId,
      p_pagamento_id: paymentId,
      p_tipo: body.event,
      p_status: refundStatus,
      p_valor_acumulado: totalRefunded,
      p_ocorrido_em: asaasEventDate(body.dateCreated),
    });
    if (error) return NextResponse.json({ error: "Falha ao registrar estorno." }, { status: 500 });

    // Estorno total vira cancelamento (mesma regra da RPC) — devolve ao
    // estoque os ingredientes que a venda tinha consumido, já que o dinheiro
    // voltou inteiro pro cliente. Idempotente: se o webhook repetir, não
    // devolve de novo (restaurarEstoquePorCancelamento resume de onde parou).
    if (refundStatus === "confirmado" && pedidoAntes) {
      const valorPago = Number(pedidoAntes.valor_pago ?? pedidoAntes.totale);
      const novoTotalEstornado = Math.max(Number(pedidoAntes.valor_estornado ?? 0), totalRefunded);
      if (novoTotalEstornado >= valorPago) {
        const { data: itens } = await admin
          .from("del_order_items")
          .select("product_id, quantidade")
          .eq("order_id", pedidoAntes.id);
        const itensValidos = (itens ?? [])
          .filter((item): item is { product_id: string; quantidade: number } => !!item.product_id)
          .map((item) => ({ productId: item.product_id, quantidade: Number(item.quantidade) }));
        if (itensValidos.length > 0) {
          await restaurarEstoquePorCancelamento(admin, {
            ownerId: pedidoAntes.owner_id,
            orderId: pedidoAntes.id,
            motivo: "Estorno total do pedido",
            items: itensValidos,
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  }

  const externalReference: string | undefined = body.payment?.externalReference;
  const paymentId: string | undefined = body.payment?.id;
  if (!externalReference) {
    return NextResponse.json({ received: true });
  }

  const { data: order } = await admin
    .from("del_orders")
    .select("id, owner_id, status, pago, asaas_payment_id")
    .eq("id", externalReference)
    .maybeSingle();

  if (!order || order.pago) {
    // Já concluído antes (evento pode chegar mais de uma vez) ou pedido não encontrado.
    return NextResponse.json({ received: true });
  }

  let podeProcessar = order.status === "novo" && order.asaas_payment_id === paymentId;
  if (order.status === "aguardando_pagamento") {
    const { data: confirmedOrder } = await admin
      .from("del_orders")
      .update({ status: "novo", asaas_payment_id: paymentId ?? null, chegou_cozinha_em: new Date().toISOString() })
      .eq("id", order.id)
      .eq("owner_id", order.owner_id)
      .eq("status", "aguardando_pagamento")
      .select("id")
      .maybeSingle();
    podeProcessar = !!confirmedOrder;
  }

  // Só uma entrega concorrente vence a transição. Se uma tentativa anterior
  // parou no meio, o mesmo pagamento pode retomar as etapas idempotentes.
  if (!podeProcessar) {
    return NextResponse.json({ received: true });
  }

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

  const valorPago = Number(body.payment?.value);
  await confirmarPagamentoEEmitirNota(admin, {
    ownerId: order.owner_id,
    orderId: order.id,
    formaPagamento: "pix",
    valorPago: Number.isFinite(valorPago) ? valorPago : undefined,
  });

  return NextResponse.json({ received: true });
}

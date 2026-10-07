import { requireRestaurantSubscription } from "@/lib/subscription";
import { deleteOrder, emitirNotaFiscal, marcarPedidoPago, updateOrderStatus } from "@/app/restaurante/actions";

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatHora(iso: string | null) {
  return iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }) : null;
}

const STATUSES = ["novo", "em preparo", "pronto", "entregue", "cancelado"];

export default async function PedidosPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();
  const { from, to } = await searchParams;
  const filtroAtivo = !!(from || to);
  let query = supabase
    .from("del_orders")
    .select("*, del_order_items(quantidade, preco_unitario, del_products(nome)), del_mesas(numero)")
    .eq("owner_id", restaurantOwnerId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (from) query = query.gte("created_at", `${from}T00:00:00-03:00`);
  if (to) query = query.lte("created_at", `${to}T23:59:59.999-03:00`);
  if (!filtroAtivo) {
    const doisDiasAtras = new Date();
    doisDiasAtras.setDate(doisDiasAtras.getDate() - 2);
    query = query.gte("created_at", doisDiasAtras.toISOString());
  }
  const { data: orders } = await query;
  const orderIds = (orders ?? []).map((order) => order.id);
  const { data: notas } = orderIds.length
    ? await supabase.from("del_notas_fiscais").select("order_id, status, erro_mensagem, created_at").eq("owner_id", restaurantOwnerId).in("order_id", orderIds).order("created_at", { ascending: false })
    : { data: [] };
  const notaPorPedido = new Map<string, { status: string; erro_mensagem: string | null }>();
  for (const nota of notas ?? []) if (!notaPorPedido.has(nota.order_id)) notaPorPedido.set(nota.order_id, nota);

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Pedidos</h1>
      <p className="mt-1 text-sm text-stone-600">Acompanhe vendas, pagamentos, preparo, entrega e situação fiscal.</p>
      <form method="get" className="mt-6 flex flex-wrap items-end gap-2 rounded-xl border border-stone-200 bg-white p-4">
        <div><label className="block text-xs text-stone-500">De</label><input name="from" type="date" defaultValue={from ?? ""} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" /></div>
        <div><label className="block text-xs text-stone-500">Até</label><input name="to" type="date" defaultValue={to ?? ""} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" /></div>
        <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">Filtrar</button>
        {filtroAtivo && <a href="/restaurante/vendas/pedidos" className="text-xs text-stone-500 hover:underline">Ver últimos 2 dias</a>}
      </form>

      <div className="mt-4 space-y-2">
        {(orders ?? []).map((o) => {
          const nota = notaPorPedido.get(o.id);
          return (
            <div key={o.id} className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-stone-900">
                    {o.del_mesas?.numero ? `Mesa ${o.del_mesas.numero}` : o.cliente_nome || "Cliente sem nome"}
                    {o.cliente_telefone && !o.del_mesas?.numero ? <span className="font-normal text-stone-500"> · {o.cliente_telefone}</span> : null}
                    {o.a_prazo && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">A prazo</span>}
                    {o.pago ? <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Pago {formatHora(o.pago_em)}</span> : <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">Pendente</span>}
                    {Number(o.valor_estornado ?? 0) > 0 && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">{o.estorno_status === "total" ? "Estorno total" : `Estornado ${formatReal(Number(o.valor_estornado))}`}</span>}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    {(o.del_order_items ?? []).map((item: { quantidade: number; del_products: { nome: string } | null }) => `${item.quantidade}x ${item.del_products?.nome ?? "?"}`).join(", ")}
                  </p>
                  {o.note && <p className="mt-1 text-xs italic text-stone-500">{o.note}</p>}
                  <p className="mt-1 flex flex-wrap gap-2 text-xs text-stone-400">
                    {formatHora(o.chegou_cozinha_em) && <span>Chegou {formatHora(o.chegou_cozinha_em)}</span>}
                    {formatHora(o.em_preparo_em) && <span>Preparo {formatHora(o.em_preparo_em)}</span>}
                    {formatHora(o.pronto_em) && <span>Pronto {formatHora(o.pronto_em)}</span>}
                    {formatHora(o.entregue_em) && <span>Entregue {formatHora(o.entregue_em)}</span>}
                  </p>
                </div>
                <div className="text-right"><p className="font-semibold text-stone-900">{formatReal(Number(o.totale))}</p><p className="text-xs text-stone-400">{o.canal}</p></div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3">
                <form action={async (formData: FormData) => { "use server"; await updateOrderStatus(o.id, String(formData.get("status"))); }} className="flex items-center gap-2">
                  <select name="status" defaultValue={o.status} className="rounded-md border border-stone-300 px-2 py-1 text-xs">{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
                  <button type="submit" className="text-xs text-amber-700 hover:underline">Atualizar</button>
                </form>
                <div className="flex flex-wrap items-center gap-3">
                  {!o.pago && o.canal !== "site" && (
                    <form action={marcarPedidoPago.bind(null, o.id)} className="flex items-center gap-2">
                      <select name="forma_pagamento" required className="rounded-md border border-stone-300 px-2 py-1 text-xs">
                        <option value="">Pagamento…</option><option value="pix">Pix</option><option value="dinheiro">Dinheiro</option><option value="cartao_debito">Cartão de débito</option><option value="cartao_credito">Cartão de crédito</option><option value="outro">Outro</option>
                      </select>
                      <button type="submit" className="text-xs text-emerald-700 hover:underline">Marcar como pago</button>
                    </form>
                  )}
                  {o.pago && (nota && nota.status !== "erro" ? <a href="/restaurante/fiscal/notas" className="text-xs text-stone-500 hover:underline">Ver nota fiscal</a> : <form action={emitirNotaFiscal.bind(null, o.id)}><button type="submit" className="text-xs text-amber-700 hover:underline">{nota?.status === "erro" ? "Tentar NFC-e novamente" : "Emitir NFC-e"}</button></form>)}
                  {!o.pago && !nota && <form action={deleteOrder.bind(null, o.id)}><button type="submit" className="text-xs text-red-600 hover:underline">Excluir</button></form>}
                </div>
              </div>
            </div>
          );
        })}
        {(orders ?? []).length === 0 && <p className="text-sm text-stone-500">Nenhum pedido neste período.</p>}
      </div>
    </div>
  );
}

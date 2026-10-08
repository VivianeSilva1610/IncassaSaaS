import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

const STATUS_LABEL: Record<string, string> = {
  em_processamento: "Em processamento",
  confirmado: "Confirmado",
  negado: "Negado",
};
const STATUS_CLASSE: Record<string, string> = {
  em_processamento: "bg-amber-100 text-amber-700",
  confirmado: "bg-red-100 text-red-700",
  negado: "bg-stone-200 text-stone-500",
};

export default async function EstornosPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription("financeiro");
  const { from, to } = await searchParams;

  let query = supabase
    .from("del_pagamento_eventos")
    .select("id, provedor, tipo, status, valor_movimento, valor_acumulado, ocorrido_em, order_id, del_orders(cliente_nome, totale, del_mesas(numero))")
    .eq("owner_id", restaurantOwnerId)
    .order("ocorrido_em", { ascending: false })
    .limit(200);
  if (from) query = query.gte("ocorrido_em", `${from}T00:00:00-03:00`);
  if (to) query = query.lte("ocorrido_em", `${to}T23:59:59.999-03:00`);
  const { data: eventos } = await query;

  const totalEstornado = (eventos ?? []).filter((e) => e.status === "confirmado").reduce((sum, e) => sum + Number(e.valor_movimento), 0);

  return (
    <div>
      <Link href="/restaurante/financeiro" className="text-sm text-amber-700 underline underline-offset-2">
        ← Financeiro
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">Estornos</h1>
      <p className="mt-1 text-sm text-stone-600">
        Histórico de todo estorno registrado — pelo painel (dinheiro/cartão/pix na mão) ou confirmado pela Asaas
        (Pix do site).
      </p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-2 rounded-xl border border-stone-200 bg-white p-4">
        <div><label className="block text-xs text-stone-500">De</label><input name="from" type="date" defaultValue={from ?? ""} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" /></div>
        <div><label className="block text-xs text-stone-500">Até</label><input name="to" type="date" defaultValue={to ?? ""} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" /></div>
        <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">Filtrar</button>
        {(from || to) && <a href="/restaurante/financeiro/estornos" className="text-xs text-stone-500 hover:underline">Limpar filtro</a>}
      </form>

      <p className="mt-4 text-sm font-medium text-stone-900">Total estornado confirmado no período: {formatReal(totalEstornado)}</p>

      <div className="mt-3 space-y-2">
        {(eventos ?? []).map((e) => {
          const pedido = Array.isArray(e.del_orders) ? e.del_orders[0] : e.del_orders;
          const mesa = pedido ? (Array.isArray(pedido.del_mesas) ? pedido.del_mesas[0] : pedido.del_mesas) : null;
          return (
            <div key={e.id} className="rounded-lg border border-stone-200 bg-white p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-stone-900">
                  {mesa?.numero ? `Mesa ${mesa.numero}` : pedido?.cliente_nome || "Cliente sem nome"}
                  <span className="ml-2 text-xs font-normal text-stone-400">{e.provedor === "asaas" ? "Pix (Asaas)" : "Manual"}</span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSE[e.status] ?? ""}`}>{STATUS_LABEL[e.status] ?? e.status}</span>
              </div>
              <p className="mt-1 text-stone-600">
                Estornado {formatReal(Number(e.valor_movimento))}
                {pedido?.totale != null && ` de um pedido de ${formatReal(Number(pedido.totale))}`}
                {" "}· acumulado no pedido: {formatReal(Number(e.valor_acumulado))}
              </p>
              <p className="mt-0.5 text-xs text-stone-400">{formatData(e.ocorrido_em)} · evento: {e.tipo}</p>
              {e.order_id && (
                <Link href="/restaurante/vendas/pedidos" className="mt-1 inline-block text-xs text-amber-700 hover:underline">
                  Ver pedido em Vendas → Pedidos
                </Link>
              )}
            </div>
          );
        })}
        {(eventos ?? []).length === 0 && <p className="text-sm text-stone-500">Nenhum estorno registrado{from || to ? " nesse período" : " ainda"}.</p>}
      </div>
    </div>
  );
}

import Link from "next/link";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { offsetParaData } from "@/lib/fiscal/fechamento";

const STATUS_LABEL: Record<RestauranteLocale, Record<string, string>> = {
  "pt-BR": { em_processamento: "Em processamento", confirmado: "Confirmado", negado: "Negado" },
  it: { em_processamento: "In elaborazione", confirmado: "Confermato", negado: "Rifiutato" },
};
const STATUS_CLASSE: Record<string, string> = {
  em_processamento: "bg-amber-100 text-amber-700",
  confirmado: "bg-red-100 text-red-700",
  negado: "bg-stone-200 text-stone-500",
};

const CONTEUDO: Record<RestauranteLocale, {
  voltar: string; titulo: string; descricao: string; de: string; ate: string; filtrar: string; limparFiltro: string;
  totalEstornado: (valor: string) => string; mesa: string; clienteSemNome: string; pixAsaas: string; manual: string;
  estornado: (valor: string) => string; dePedido: (valor: string) => string; acumulado: (valor: string) => string;
  evento: string; verPedido: string; nenhumEstorno: string; noPeriodo: string; ainda: string;
}> = {
  "pt-BR": {
    voltar: "← Financeiro", titulo: "Estornos",
    descricao: "Histórico de todo estorno registrado — pelo painel (dinheiro/cartão/pix na mão) ou confirmado pela Asaas (Pix do site).",
    de: "De", ate: "Até", filtrar: "Filtrar", limparFiltro: "Limpar filtro",
    totalEstornado: (valor) => `Total estornado confirmado no período: ${valor}`,
    mesa: "Mesa", clienteSemNome: "Cliente sem nome", pixAsaas: "Pix (Asaas)", manual: "Manual",
    estornado: (valor) => `Estornado ${valor}`, dePedido: (valor) => `de um pedido de ${valor}`,
    acumulado: (valor) => `acumulado no pedido: ${valor}`, evento: "evento",
    verPedido: "Ver pedido em Vendas → Pedidos", nenhumEstorno: "Nenhum estorno registrado",
    noPeriodo: " nesse período", ainda: " ainda",
  },
  it: {
    voltar: "← Finanza", titulo: "Storni",
    descricao: "Storico di ogni storno registrato — dal pannello (contanti/carta a mano) o confermato dal provider di pagamento (dal sito).",
    de: "Da", ate: "A", filtrar: "Filtra", limparFiltro: "Pulisci filtro",
    totalEstornado: (valor) => `Totale stornato confermato nel periodo: ${valor}`,
    mesa: "Tavolo", clienteSemNome: "Cliente senza nome", pixAsaas: "Online (Asaas)", manual: "Manuale",
    estornado: (valor) => `Stornato ${valor}`, dePedido: (valor) => `di un ordine di ${valor}`,
    acumulado: (valor) => `accumulato nell'ordine: ${valor}`, evento: "evento",
    verPedido: "Vedi l'ordine in Vendite → Ordini", nenhumEstorno: "Nessuno storno registrato",
    noPeriodo: " in questo periodo", ainda: " ancora",
  },
};

export default async function EstornosPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { supabase, restaurantOwnerId, locale } = await requireRestaurantSubscription("financeiro");
  const t = CONTEUDO[locale];
  const statusLabel = STATUS_LABEL[locale];
  const formatReal = (value: number) => (locale === "it"
    ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value));
  const intlLocale = locale === "it" ? "it-IT" : "pt-BR";
  const timezone = locale === "it" ? "Europe/Rome" : "America/Sao_Paulo";
  const formatData = (iso: string) => new Date(iso).toLocaleString(intlLocale, { timeZone: timezone });
  const { from, to } = await searchParams;

  let query = supabase
    .from("del_pagamento_eventos")
    .select("id, provedor, tipo, status, valor_movimento, valor_acumulado, ocorrido_em, order_id, del_orders(cliente_nome, totale, del_mesas(numero))")
    .eq("owner_id", restaurantOwnerId)
    .order("ocorrido_em", { ascending: false })
    .limit(200);
  if (from) query = query.gte("ocorrido_em", `${from}T00:00:00${offsetParaData(timezone, from)}`);
  if (to) query = query.lte("ocorrido_em", `${to}T23:59:59.999${offsetParaData(timezone, to)}`);
  const { data: eventos } = await query;

  const totalEstornado = (eventos ?? []).filter((e) => e.status === "confirmado").reduce((sum, e) => sum + Number(e.valor_movimento), 0);

  return (
    <div>
      <Link href="/restaurante/financeiro" className="text-sm text-amber-700 underline underline-offset-2">
        {t.voltar}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {t.descricao}
      </p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-2 rounded-xl border border-stone-200 bg-white p-4">
        <div><label className="block text-xs text-stone-500">{t.de}</label><input name="from" type="date" defaultValue={from ?? ""} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" /></div>
        <div><label className="block text-xs text-stone-500">{t.ate}</label><input name="to" type="date" defaultValue={to ?? ""} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" /></div>
        <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">{t.filtrar}</button>
        {(from || to) && <a href="/restaurante/financeiro/estornos" className="text-xs text-stone-500 hover:underline">{t.limparFiltro}</a>}
      </form>

      <p className="mt-4 text-sm font-medium text-stone-900">{t.totalEstornado(formatReal(totalEstornado))}</p>

      <div className="mt-3 space-y-2">
        {(eventos ?? []).map((e) => {
          const pedido = Array.isArray(e.del_orders) ? e.del_orders[0] : e.del_orders;
          const mesa = pedido ? (Array.isArray(pedido.del_mesas) ? pedido.del_mesas[0] : pedido.del_mesas) : null;
          return (
            <div key={e.id} className="rounded-lg border border-stone-200 bg-white p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-stone-900">
                  {mesa?.numero ? `${t.mesa} ${mesa.numero}` : pedido?.cliente_nome || t.clienteSemNome}
                  <span className="ml-2 text-xs font-normal text-stone-400">{e.provedor === "asaas" ? t.pixAsaas : t.manual}</span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSE[e.status] ?? ""}`}>{statusLabel[e.status] ?? e.status}</span>
              </div>
              <p className="mt-1 text-stone-600">
                {t.estornado(formatReal(Number(e.valor_movimento)))}
                {pedido?.totale != null && ` ${t.dePedido(formatReal(Number(pedido.totale)))}`}
                {" "}· {t.acumulado(formatReal(Number(e.valor_acumulado)))}
              </p>
              <p className="mt-0.5 text-xs text-stone-400">{formatData(e.ocorrido_em)} · {t.evento}: {e.tipo}</p>
              {e.order_id && (
                <Link href="/restaurante/vendas/pedidos" className="mt-1 inline-block text-xs text-amber-700 hover:underline">
                  {t.verPedido}
                </Link>
              )}
            </div>
          );
        })}
        {(eventos ?? []).length === 0 && <p className="text-sm text-stone-500">{t.nenhumEstorno}{from || to ? t.noPeriodo : t.ainda}.</p>}
      </div>
    </div>
  );
}

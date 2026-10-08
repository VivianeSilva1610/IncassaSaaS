import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { offsetParaData } from "@/lib/fiscal/fechamento";
import { deleteOrder, marcarPedidoPago, updateOrderStatus, removerItemPedido, estornarPedido } from "@/app/restaurante/actions";

function formatMoney(value: number, locale: RestauranteLocale) {
  return locale === "it"
    ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatHora(iso: string | null, timeZone: string, intlLocale: string) {
  return iso ? new Date(iso).toLocaleTimeString(intlLocale, { hour: "2-digit", minute: "2-digit", timeZone }) : null;
}

const STATUS_VALUES = ["novo", "em preparo", "pronto", "entregue", "cancelado"];
const STATUS_LABEL: Record<RestauranteLocale, Record<string, string>> = {
  "pt-BR": { novo: "novo", "em preparo": "em preparo", pronto: "pronto", entregue: "entregue", cancelado: "cancelado" },
  it: { novo: "nuovo", "em preparo": "in preparazione", pronto: "pronto", entregue: "consegnato", cancelado: "annullato" },
};
const FORMAS_PAGAMENTO: Record<RestauranteLocale, { value: string; label: string }[]> = {
  "pt-BR": [
    { value: "pix", label: "Pix" }, { value: "dinheiro", label: "Dinheiro" },
    { value: "cartao_debito", label: "Cartão de débito" }, { value: "cartao_credito", label: "Cartão de crédito" },
    { value: "outro", label: "Outro" },
  ],
  it: [
    { value: "contanti", label: "Contanti" }, { value: "carta_debito", label: "Carta di debito" },
    { value: "carta_credito", label: "Carta di credito" }, { value: "altro", label: "Altro" },
  ],
};

const CONTEUDO: Record<RestauranteLocale, {
  titulo: string; descricao: string; de: string; ate: string; filtrar: string; ultimosDias: string;
  mesa: string; clienteSemNome: string; aPrazo: string; pagoEm: (hora: string) => string; pendente: string;
  estornoAndamento: string; estornoTotal: string; estornadoValor: (valor: string) => string; remover: string;
  chegou: string; preparo: string; pronto: string; entregue: string; atualizar: string; cancelarPedido: string;
  pagamentoPlaceholder: string; marcarPago: string; documentoEmitido: string; documentoCancelado: string;
  fiscalPendente: string; erroFiscal: string; fiscalNaoEmitida: string; excluir: string;
  valorEstornar: (max: string) => string; motivoOpcional: string; solicitarEstornoPix: string; registrarEstorno: string;
  nenhumPedido: string;
}> = {
  "pt-BR": {
    titulo: "Pedidos", descricao: "Acompanhe vendas, pagamentos, preparo, entrega e situação fiscal.",
    de: "De", ate: "Até", filtrar: "Filtrar", ultimosDias: "Ver últimos 2 dias",
    mesa: "Mesa", clienteSemNome: "Cliente sem nome", aPrazo: "A prazo",
    pagoEm: (hora) => `Pago ${hora}`, pendente: "Pendente",
    estornoAndamento: "Estorno em andamento", estornoTotal: "Estorno total",
    estornadoValor: (valor) => `Estornado ${valor}`, remover: "remover",
    chegou: "Chegou", preparo: "Preparo", pronto: "Pronto", entregue: "Entregue",
    atualizar: "Atualizar", cancelarPedido: "Cancelar pedido inteiro", pagamentoPlaceholder: "Pagamento…",
    marcarPago: "Marcar como pago", documentoEmitido: "NFC-e emitida · visualizar", documentoCancelado: "NFC-e cancelada · visualizar",
    fiscalPendente: "Fiscal pendente", erroFiscal: "Erro fiscal · resolver", fiscalNaoEmitida: "Fiscal não emitida",
    excluir: "Excluir", valorEstornar: (max) => `Valor a estornar (até ${max})`, motivoOpcional: "Motivo (opcional)",
    solicitarEstornoPix: "Solicitar estorno (Pix)", registrarEstorno: "Registrar estorno",
    nenhumPedido: "Nenhum pedido neste período.",
  },
  it: {
    titulo: "Ordini", descricao: "Monitora vendite, pagamenti, preparazione, consegna e stato fiscale.",
    de: "Da", ate: "A", filtrar: "Filtra", ultimosDias: "Vedi ultimi 2 giorni",
    mesa: "Tavolo", clienteSemNome: "Cliente senza nome", aPrazo: "A credito",
    pagoEm: (hora) => `Pagato ${hora}`, pendente: "In sospeso",
    estornoAndamento: "Storno in corso", estornoTotal: "Storno totale",
    estornadoValor: (valor) => `Stornato ${valor}`, remover: "rimuovi",
    chegou: "Arrivato", preparo: "Preparazione", pronto: "Pronto", entregue: "Consegnato",
    atualizar: "Aggiorna", cancelarPedido: "Annulla intero ordine", pagamentoPlaceholder: "Pagamento…",
    marcarPago: "Segna come pagato", documentoEmitido: "Documento emesso · visualizza", documentoCancelado: "Documento annullato · visualizza",
    fiscalPendente: "Fiscale pendente", erroFiscal: "Errore fiscale · risolvi", fiscalNaoEmitida: "Documento non emesso",
    excluir: "Elimina", valorEstornar: (max) => `Importo da stornare (fino a ${max})`, motivoOpcional: "Motivo (opzionale)",
    solicitarEstornoPix: "Richiedi storno", registrarEstorno: "Registra storno",
    nenhumPedido: "Nessun ordine in questo periodo.",
  },
};

export default async function PedidosPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const { supabase, restaurantOwnerId, locale } = await requireRestaurantSubscription("vendas");
  const t = CONTEUDO[locale];
  const statusLabel = STATUS_LABEL[locale];
  const formasPagamento = FORMAS_PAGAMENTO[locale];
  const intlLocale = locale === "it" ? "it-IT" : "pt-BR";
  const timezone = locale === "it" ? "Europe/Rome" : "America/Sao_Paulo";
  const { data: restaurant } = await supabase.from("restaurants").select("id, country_code").eq("owner_user_id", restaurantOwnerId).maybeSingle();
  const country: "BR" | "IT" = restaurant?.country_code === "IT" ? "IT" : "BR";
  const { from, to } = await searchParams;
  const filtroAtivo = !!(from || to);
  let query = supabase
    .from("del_orders")
    .select("*, del_order_items(id, quantidade, preco_unitario, del_products(nome)), del_mesas(numero)")
    .eq("owner_id", restaurantOwnerId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (from) query = query.gte("created_at", `${from}T00:00:00${offsetParaData(timezone, from)}`);
  if (to) query = query.lte("created_at", `${to}T23:59:59.999${offsetParaData(timezone, to)}`);
  if (!filtroAtivo) {
    const doisDiasAtras = new Date();
    doisDiasAtras.setDate(doisDiasAtras.getDate() - 2);
    query = query.gte("created_at", doisDiasAtras.toISOString());
  }
  const { data: orders } = await query;
  const orderIds = (orders ?? []).map((order) => order.id);
  const notaPorPedido = new Map<string, { id: string; status: string }>();
  if (country === "IT") {
    const { data: documentos } = orderIds.length
      ? await supabase.from("fiscal_documents").select("id, order_id, status, created_at").eq("restaurant_id", restaurant?.id ?? "00000000-0000-0000-0000-000000000000").in("order_id", orderIds).order("created_at", { ascending: false })
      : { data: [] };
    for (const documento of documentos ?? []) if (!notaPorPedido.has(documento.order_id)) notaPorPedido.set(documento.order_id, { id: documento.id, status: documento.status === "emitido" ? "emitida" : documento.status === "cancelado" ? "cancelada" : documento.status });
  } else {
    const { data: notas } = orderIds.length
      ? await supabase.from("del_notas_fiscais").select("id, order_id, status, erro_mensagem, created_at").eq("owner_id", restaurantOwnerId).in("order_id", orderIds).order("created_at", { ascending: false })
      : { data: [] };
    for (const nota of notas ?? []) if (!notaPorPedido.has(nota.order_id)) notaPorPedido.set(nota.order_id, nota);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">{t.descricao}</p>
      <form method="get" className="mt-6 flex flex-wrap items-end gap-2 rounded-xl border border-stone-200 bg-white p-4">
        <div><label className="block text-xs text-stone-500">{t.de}</label><input name="from" type="date" defaultValue={from ?? ""} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" /></div>
        <div><label className="block text-xs text-stone-500">{t.ate}</label><input name="to" type="date" defaultValue={to ?? ""} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" /></div>
        <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">{t.filtrar}</button>
        {filtroAtivo && <a href="/restaurante/vendas/pedidos" className="text-xs text-stone-500 hover:underline">{t.ultimosDias}</a>}
      </form>

      <div className="mt-4 space-y-2">
        {(orders ?? []).map((o) => {
          const nota = notaPorPedido.get(o.id);
          const podeRemoverItem = !o.pago && o.status !== "cancelado" && o.status !== "entregue";
          return (
            <div key={o.id} className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-stone-900">
                    {o.del_mesas?.numero ? `${t.mesa} ${o.del_mesas.numero}` : o.cliente_nome || t.clienteSemNome}
                    {o.cliente_telefone && !o.del_mesas?.numero ? <span className="font-normal text-stone-500"> · {o.cliente_telefone}</span> : null}
                    {o.a_prazo && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">{t.aPrazo}</span>}
                    {o.pago ? <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">{t.pagoEm(formatHora(o.pago_em, timezone, intlLocale) ?? "")}</span> : <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">{t.pendente}</span>}
                    {o.estorno_status === "em_processamento" && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">{t.estornoAndamento}</span>}
                    {Number(o.valor_estornado ?? 0) > 0 && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">{o.estorno_status === "total" ? t.estornoTotal : t.estornadoValor(formatMoney(Number(o.valor_estornado), locale))}</span>}
                  </p>
                  <ul className="mt-1 space-y-0.5 text-sm text-stone-500">
                    {(o.del_order_items ?? []).map((item: { id: string; quantidade: number; del_products: { nome: string } | null }) => (
                      <li key={item.id} className="flex items-center gap-2">
                        <span>{item.quantidade}x {item.del_products?.nome ?? "?"}</span>
                        {podeRemoverItem && (
                          <form action={removerItemPedido.bind(null, o.id, item.id)}>
                            <button type="submit" className="text-xs text-red-600 hover:underline">
                              {t.remover}
                            </button>
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>
                  {o.note && <p className="mt-1 text-xs italic text-stone-500">{o.note}</p>}
                  <p className="mt-1 flex flex-wrap gap-2 text-xs text-stone-400">
                    {formatHora(o.chegou_cozinha_em, timezone, intlLocale) && <span>{t.chegou} {formatHora(o.chegou_cozinha_em, timezone, intlLocale)}</span>}
                    {formatHora(o.em_preparo_em, timezone, intlLocale) && <span>{t.preparo} {formatHora(o.em_preparo_em, timezone, intlLocale)}</span>}
                    {formatHora(o.pronto_em, timezone, intlLocale) && <span>{t.pronto} {formatHora(o.pronto_em, timezone, intlLocale)}</span>}
                    {formatHora(o.entregue_em, timezone, intlLocale) && <span>{t.entregue} {formatHora(o.entregue_em, timezone, intlLocale)}</span>}
                  </p>
                </div>
                <div className="text-right"><p className="font-semibold text-stone-900">{formatMoney(Number(o.totale), locale)}</p><p className="text-xs text-stone-400">{o.canal}</p></div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3">
                <div className="flex items-center gap-3">
                  <form action={async (formData: FormData) => { "use server"; await updateOrderStatus(o.id, String(formData.get("status"))); }} className="flex items-center gap-2">
                    <select name="status" defaultValue={o.status} className="rounded-md border border-stone-300 px-2 py-1 text-xs">{STATUS_VALUES.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}</select>
                    <button type="submit" className="text-xs text-amber-700 hover:underline">{t.atualizar}</button>
                  </form>
                  {o.status !== "cancelado" && o.status !== "entregue" && (
                    <form action={updateOrderStatus.bind(null, o.id, "cancelado")}>
                      <button type="submit" className="text-xs text-red-600 hover:underline">{t.cancelarPedido}</button>
                    </form>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {!o.pago && o.canal !== "site" && (
                    <form action={marcarPedidoPago.bind(null, o.id)} className="flex items-center gap-2">
                      <select name="forma_pagamento" required className="rounded-md border border-stone-300 px-2 py-1 text-xs">
                        <option value="">{t.pagamentoPlaceholder}</option>
                        {formasPagamento.map((forma) => <option key={forma.value} value={forma.value}>{forma.label}</option>)}
                      </select>
                      <button type="submit" className="text-xs text-emerald-700 hover:underline">{t.marcarPago}</button>
                    </form>
                  )}
                  {o.pago && nota?.status === "emitida" && <a href={`/restaurante/fiscal/notas/${nota.id}/imprimir`} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-700 hover:underline">{t.documentoEmitido}</a>}
                  {o.pago && nota?.status === "cancelada" && <a href={`/restaurante/fiscal/notas/${nota.id}/imprimir`} target="_blank" rel="noopener noreferrer" className="text-xs text-stone-500 hover:underline">{t.documentoCancelado}</a>}
                  {o.pago && nota?.status === "pendente" && <a href="/restaurante/fiscal/emissoes" className="text-xs text-amber-700 hover:underline">{t.fiscalPendente}</a>}
                  {o.pago && nota?.status === "erro" && <a href="/restaurante/fiscal/emissoes" className="text-xs text-red-600 hover:underline">{t.erroFiscal}</a>}
                  {o.pago && !nota && <a href="/restaurante/fiscal/emissoes" className="text-xs text-stone-500 hover:underline">{t.fiscalNaoEmitida}</a>}
                  {!o.pago && !nota && <form action={deleteOrder.bind(null, o.id)}><button type="submit" className="text-xs text-red-600 hover:underline">{t.excluir}</button></form>}
                </div>
              </div>
              {o.pago && o.estorno_status !== "total" && (
                <form action={estornarPedido.bind(null, o.id)} className="mt-3 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
                  <input
                    name="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    max={Math.max(0, Number(o.valor_pago ?? o.totale) - Number(o.valor_estornado ?? 0))}
                    placeholder={t.valorEstornar(formatMoney(Math.max(0, Number(o.valor_pago ?? o.totale) - Number(o.valor_estornado ?? 0)), locale))}
                    className="w-56 rounded-md border border-stone-300 px-2 py-1 text-xs"
                  />
                  <input name="motivo" placeholder={t.motivoOpcional} className="flex-1 rounded-md border border-stone-300 px-2 py-1 text-xs" />
                  <button type="submit" className="text-xs text-red-600 hover:underline">
                    {o.asaas_payment_id ? t.solicitarEstornoPix : t.registrarEstorno}
                  </button>
                </form>
              )}
            </div>
          );
        })}
        {(orders ?? []).length === 0 && <p className="text-sm text-stone-500">{t.nenhumPedido}</p>}
      </div>
    </div>
  );
}

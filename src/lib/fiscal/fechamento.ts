import type { SupabaseClient } from "@supabase/supabase-js";

export type FechamentoNota = {
  id: string;
  numero: number | null;
  status: string;
  provedor: string | null;
  ambiente: string;
  data: string;
  cliente: string;
  total: number;
};

export type FechamentoDados = {
  competencia: number;
  recebimentosBrutos: number;
  estornos: number;
  recebimentosLiquidos: number;
  aReceber: number;
  entradasManuais: number;
  saidasManuais: number;
  saldoCaixa: number;
  porForma: Array<{ forma: string; total: number }>;
  pedidosCompetencia: number;
  pedidosRecebidos: number;
  notas: FechamentoNota[];
  notasEmitidas: number;
  notasCanceladas: number;
  notasComErro: number;
  notasPendentes: number;
  pedidosPagosSemNota: number;
};

export async function carregarFechamento(
  supabase: SupabaseClient,
  ownerId: string,
  inicioIso: string,
  fimIso: string,
  dataInicial: string,
  dataFinal: string,
): Promise<FechamentoDados> {
  const [competenciaResult, recebimentosResult, estornosResult, movimentosResult, notasResult] = await Promise.all([
    supabase.from("del_orders").select("id, totale").eq("owner_id", ownerId).neq("status", "cancelado").gte("competencia_em", inicioIso).lte("competencia_em", fimIso),
    supabase.from("del_orders").select("id, totale, valor_pago, valor_estornado, forma_pagamento").eq("owner_id", ownerId).eq("pago", true).gte("pago_em", inicioIso).lte("pago_em", fimIso),
    supabase.from("del_pagamento_eventos").select("valor_movimento").eq("owner_id", ownerId).eq("status", "confirmado").gte("ocorrido_em", inicioIso).lte("ocorrido_em", fimIso),
    supabase.from("del_caixa_movimentos").select("tipo, valor").eq("owner_id", ownerId).gte("data", dataInicial).lte("data", dataFinal),
    supabase.from("del_notas_fiscais").select("id, numero, status, provedor, ambiente, created_at, emitida_em, del_orders(cliente_nome, totale)").eq("owner_id", ownerId).gte("created_at", inicioIso).lte("created_at", fimIso).order("created_at", { ascending: true }),
  ]);
  const falha = [competenciaResult, recebimentosResult, estornosResult, movimentosResult, notasResult].find((resultado) => resultado.error)?.error;
  if (falha) throw new Error(`Não foi possível calcular o fechamento: ${falha.message}`);

  const competenciaPedidos = competenciaResult.data ?? [];
  const recebimentos = recebimentosResult.data ?? [];
  const estornos = (estornosResult.data ?? []).reduce((total, evento) => total + Number(evento.valor_movimento), 0);
  const movimentos = movimentosResult.data ?? [];
  const notasRaw = notasResult.data ?? [];
  const orderIds = recebimentos.map((pedido) => pedido.id);
  const { data: notasDosRecebimentos } = orderIds.length
    ? await supabase.from("del_notas_fiscais").select("order_id, status, created_at").eq("owner_id", ownerId).in("order_id", orderIds).order("created_at", { ascending: false })
    : { data: [] };
  const pedidosComNota = new Set((notasDosRecebimentos ?? []).filter((nota) => nota.status !== "erro").map((nota) => nota.order_id));

  const competencia = competenciaPedidos.reduce((total, pedido) => total + Number(pedido.totale), 0);
  const recebimentosBrutos = recebimentos.reduce((total, pedido) => total + Number(pedido.valor_pago ?? pedido.totale), 0);
  const entradasManuais = movimentos.filter((movimento) => movimento.tipo === "entrada").reduce((total, movimento) => total + Number(movimento.valor), 0);
  const saidasManuais = movimentos.filter((movimento) => movimento.tipo === "saida").reduce((total, movimento) => total + Number(movimento.valor), 0);
  const totaisPorForma = new Map<string, number>();
  for (const pedido of recebimentos) {
    const forma = pedido.forma_pagamento || "não informada";
    totaisPorForma.set(forma, (totaisPorForma.get(forma) ?? 0) + Number(pedido.valor_pago ?? pedido.totale));
  }

  const { data: aReceberRows, error: aReceberError } = await supabase
    .from("del_orders")
    .select("totale")
    .eq("owner_id", ownerId)
    .eq("pago", false)
    .neq("status", "cancelado")
    .gte("competencia_em", inicioIso)
    .lte("competencia_em", fimIso);
  if (aReceberError) throw new Error(`Não foi possível calcular os valores a receber: ${aReceberError.message}`);

  const notas: FechamentoNota[] = notasRaw.map((nota) => {
    const pedido = Array.isArray(nota.del_orders) ? nota.del_orders[0] : nota.del_orders;
    return {
      id: nota.id,
      numero: nota.numero,
      status: nota.status,
      provedor: nota.provedor,
      ambiente: nota.ambiente,
      data: nota.emitida_em ?? nota.created_at,
      cliente: pedido?.cliente_nome || "Consumidor não identificado",
      total: Number(pedido?.totale ?? 0),
    };
  });

  const recebimentosLiquidos = recebimentosBrutos - estornos;
  return {
    competencia,
    recebimentosBrutos,
    estornos,
    recebimentosLiquidos,
    aReceber: (aReceberRows ?? []).reduce((total, pedido) => total + Number(pedido.totale), 0),
    entradasManuais,
    saidasManuais,
    saldoCaixa: recebimentosLiquidos + entradasManuais - saidasManuais,
    porForma: [...totaisPorForma.entries()].map(([forma, total]) => ({ forma, total })).sort((a, b) => b.total - a.total),
    pedidosCompetencia: competenciaPedidos.length,
    pedidosRecebidos: recebimentos.length,
    notas,
    notasEmitidas: notas.filter((nota) => nota.status === "emitida").length,
    notasCanceladas: notas.filter((nota) => nota.status === "cancelada").length,
    notasComErro: notas.filter((nota) => nota.status === "erro").length,
    notasPendentes: notas.filter((nota) => nota.status === "pendente").length,
    pedidosPagosSemNota: recebimentos.filter((pedido) => !pedidosComNota.has(pedido.id)).length,
  };
}

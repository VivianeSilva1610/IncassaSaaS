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

type OpcoesFechamento = { restaurantId: string; country: "BR" | "IT" };

// Offset UTC vigente num fuso IANA numa data específica — necessário porque
// Europe/Rome tem horário de verão (CET/CEST) e um deslocamento fixo tipo
// "+01:00" ficaria errado metade do ano. America/Sao_Paulo não tem mais
// horário de verão, mas o mesmo cálculo serve pros dois países.
export function offsetParaData(timeZone: string, dataIso: string): string {
  const referencia = new Date(`${dataIso}T12:00:00Z`);
  const partes = new Intl.DateTimeFormat("en", { timeZone, timeZoneName: "shortOffset" }).formatToParts(referencia);
  const bruto = partes.find((parte) => parte.type === "timeZoneName")?.value ?? "GMT+0";
  const match = bruto.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return "+00:00";
  const [, sinal, horas, minutos = "00"] = match;
  return `${sinal}${horas.padStart(2, "0")}:${minutos}`;
}

type DocumentoFiscalItRaw = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  totale: number;
  del_orders: { cliente_nome: string | null } | { cliente_nome: string | null }[] | null;
};

type NotaFiscalBrRaw = {
  id: string;
  numero: number | null;
  status: string;
  provedor: string | null;
  ambiente: string;
  created_at: string;
  emitida_em: string | null;
  del_orders: { cliente_nome: string | null; totale: number } | { cliente_nome: string | null; totale: number }[] | null;
};

export async function carregarFechamento(
  supabase: SupabaseClient,
  ownerId: string,
  inicioIso: string,
  fimIso: string,
  dataInicial: string,
  dataFinal: string,
  opcoes: OpcoesFechamento | null = null,
): Promise<FechamentoDados> {
  const country = opcoes?.country ?? "BR";
  const restaurantId = opcoes?.restaurantId ?? null;

  const notasQuery = country === "IT"
    ? supabase
        .from("fiscal_documents")
        .select("id, status, created_at, updated_at, totale, del_orders(cliente_nome)")
        .eq("restaurant_id", restaurantId ?? "00000000-0000-0000-0000-000000000000")
        .gte("created_at", inicioIso)
        .lte("created_at", fimIso)
        .order("created_at", { ascending: true })
    : supabase
        .from("del_notas_fiscais")
        .select("id, numero, status, provedor, ambiente, created_at, emitida_em, del_orders(cliente_nome, totale)")
        .eq("owner_id", ownerId)
        .gte("created_at", inicioIso)
        .lte("created_at", fimIso)
        .order("created_at", { ascending: true });

  const [competenciaResult, recebimentosResult, estornosResult, movimentosResult, notasResult] = await Promise.all([
    supabase.from("del_orders").select("id, totale").eq("owner_id", ownerId).neq("status", "cancelado").gte("competencia_em", inicioIso).lte("competencia_em", fimIso),
    supabase.from("del_orders").select("id, totale, valor_pago, valor_estornado, forma_pagamento").eq("owner_id", ownerId).eq("pago", true).gte("pago_em", inicioIso).lte("pago_em", fimIso),
    supabase.from("del_pagamento_eventos").select("valor_movimento").eq("owner_id", ownerId).eq("status", "confirmado").gte("ocorrido_em", inicioIso).lte("ocorrido_em", fimIso),
    supabase.from("del_caixa_movimentos").select("tipo, valor").eq("owner_id", ownerId).gte("data", dataInicial).lte("data", dataFinal),
    notasQuery,
  ]);
  const falha = [competenciaResult, recebimentosResult, estornosResult, movimentosResult, notasResult].find((resultado) => resultado.error)?.error;
  if (falha) throw new Error(`Não foi possível calcular o fechamento: ${falha.message}`);

  const competenciaPedidos = competenciaResult.data ?? [];
  const recebimentos = recebimentosResult.data ?? [];
  const estornos = (estornosResult.data ?? []).reduce((total, evento) => total + Number(evento.valor_movimento), 0);
  const movimentos = movimentosResult.data ?? [];
  const notasRaw = notasResult.data ?? [];
  const orderIds = recebimentos.map((pedido) => pedido.id);

  const pedidosComNotaQuery = orderIds.length
    ? country === "IT"
      ? supabase.from("fiscal_documents").select("order_id, status, created_at").eq("restaurant_id", restaurantId ?? "00000000-0000-0000-0000-000000000000").in("order_id", orderIds).order("created_at", { ascending: false })
      : supabase.from("del_notas_fiscais").select("order_id, status, created_at").eq("owner_id", ownerId).in("order_id", orderIds).order("created_at", { ascending: false })
    : null;
  const { data: notasDosRecebimentos } = pedidosComNotaQuery ? await pedidosComNotaQuery : { data: [] };
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

  const notas: FechamentoNota[] = country === "IT"
    ? (notasRaw as unknown as DocumentoFiscalItRaw[]).map((documento) => {
        const pedido = Array.isArray(documento.del_orders) ? documento.del_orders[0] : documento.del_orders;
        const status = documento.status === "emitido" ? "emitida" : documento.status === "cancelado" ? "cancelada" : documento.status;
        return {
          id: documento.id,
          numero: null,
          status,
          provedor: "simulado",
          ambiente: "homologacao",
          data: documento.updated_at ?? documento.created_at,
          cliente: pedido?.cliente_nome || "",
          total: Number(documento.totale ?? 0),
        };
      })
    : (notasRaw as unknown as NotaFiscalBrRaw[]).map((nota) => {
        const pedido = Array.isArray(nota.del_orders) ? nota.del_orders[0] : nota.del_orders;
        return {
          id: nota.id,
          numero: nota.numero,
          status: nota.status,
          provedor: nota.provedor,
          ambiente: nota.ambiente,
          data: nota.emitida_em ?? nota.created_at,
          cliente: pedido?.cliente_nome || "",
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

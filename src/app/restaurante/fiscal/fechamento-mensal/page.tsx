import { FechamentoFiscalReport } from "@/components/delivery/FechamentoFiscalReport";
import { carregarFechamento, offsetParaData } from "@/lib/fiscal/fechamento";
import type { FechamentoDados } from "@/lib/fiscal/fechamento";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";

function mesNoFuso(timeZone: string) {
  const partes = new Intl.DateTimeFormat("en", { timeZone, year: "numeric", month: "2-digit" }).formatToParts(new Date());
  const valor = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((parte) => parte.type === tipo)!.value;
  return `${valor("year")}-${valor("month")}`;
}

const CONTEUDO: Record<RestauranteLocale, {
  labelMes: string; consultar: string;
  tudoFechado: (dias: number) => string; semMovimento: string;
  provisorioPrefixo: string; tituloDefinitivo: string; tituloPrevia: string;
}> = {
  "pt-BR": {
    labelMes: "Mês do fechamento", consultar: "Consultar",
    tudoFechado: (dias) => `Todos os ${dias} dia(s) com movimento estão fechados. O relatório usa os snapshots diários congelados.`,
    semMovimento: "não há movimento registrado no mês",
    provisorioPrefixo: "Relatório provisório. Feche os caixas pendentes:",
    tituloDefinitivo: "Fechamento mensal definitivo", tituloPrevia: "Prévia do fechamento mensal",
  },
  it: {
    labelMes: "Mese di chiusura", consultar: "Consulta",
    tudoFechado: (dias) => `Tutti i ${dias} giorno/i con movimento sono chiusi. Il report usa gli snapshot giornalieri congelati.`,
    semMovimento: "nessun movimento registrato nel mese",
    provisorioPrefixo: "Report provvisorio. Chiudi le casse pendenti:",
    tituloDefinitivo: "Chiusura mensile definitiva", tituloPrevia: "Anteprima chiusura mensile",
  },
};

export default async function FechamentoMensalPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { supabase, restaurantOwnerId, locale } = await requireRestaurantSubscription("fiscal");
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, country_code, timezone")
    .eq("owner_user_id", restaurantOwnerId)
    .maybeSingle();
  const timezone = restaurant?.timezone || (locale === "it" ? "Europe/Rome" : "America/Sao_Paulo");
  const country: "BR" | "IT" = restaurant?.country_code === "IT" ? "IT" : "BR";
  const t = CONTEUDO[locale];
  const intlLocale = locale === "it" ? "it-IT" : "pt-BR";

  const { mes: param } = await searchParams;
  const mes = /^\d{4}-\d{2}$/.test(param ?? "") ? param! : mesNoFuso(timezone);
  const [ano, numeroMes] = mes.split("-").map(Number);
  const ultimoDia = new Date(Date.UTC(ano, numeroMes, 0)).getUTCDate();
  const inicio = `${mes}-01`;
  const fim = `${mes}-${String(ultimoDia).padStart(2, "0")}`;
  const offsetInicio = offsetParaData(timezone, inicio);
  const offsetFim = offsetParaData(timezone, fim);

  const dados = await carregarFechamento(
    supabase, restaurantOwnerId,
    `${inicio}T00:00:00${offsetInicio}`, `${fim}T23:59:59.999${offsetFim}`, inicio, fim,
    restaurant?.id ? { restaurantId: restaurant.id, country } : null,
  );
  const [{ data: atividades }, { data: movimentos }, { data: caixasFechados }] = await Promise.all([
    supabase.from("del_orders").select("pago_em, competencia_em").eq("owner_id", restaurantOwnerId).or(`and(pago_em.gte.${inicio}T00:00:00${offsetInicio},pago_em.lte.${fim}T23:59:59.999${offsetFim}),and(competencia_em.gte.${inicio}T00:00:00${offsetInicio},competencia_em.lte.${fim}T23:59:59.999${offsetFim})`),
    supabase.from("del_caixa_movimentos").select("data").eq("owner_id", restaurantOwnerId).gte("data", inicio).lte("data", fim),
    supabase.from("del_caixa_fechamentos").select("data, snapshot").eq("owner_id", restaurantOwnerId).gte("data", inicio).lte("data", fim),
  ]);
  const dataLocal = (iso: string) => {
    const partes = new Intl.DateTimeFormat("en", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(iso));
    const valor = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((parte) => parte.type === tipo)!.value;
    return `${valor("year")}-${valor("month")}-${valor("day")}`;
  };
  const diasComMovimento = new Set<string>();
  for (const atividade of atividades ?? []) {
    if (atividade.pago_em) diasComMovimento.add(dataLocal(atividade.pago_em));
    if (atividade.competencia_em) diasComMovimento.add(dataLocal(atividade.competencia_em));
  }
  for (const movimento of movimentos ?? []) diasComMovimento.add(movimento.data);
  const diasFechados = new Set((caixasFechados ?? []).map((caixa) => caixa.data));
  const diasPendentes = [...diasComMovimento].filter((data) => !diasFechados.has(data)).sort();
  const finalizado = diasComMovimento.size > 0 && diasPendentes.length === 0;
  const snapshots = (caixasFechados ?? []).filter((caixa) => diasComMovimento.has(caixa.data)).map((caixa) => caixa.snapshot as unknown as FechamentoDados);
  const dadosDefinitivos = finalizado
    ? snapshots.reduce<FechamentoDados>((total, dia) => {
        const formas = new Map(total.porForma.map((item) => [item.forma, item.total]));
        for (const item of dia.porForma) formas.set(item.forma, (formas.get(item.forma) ?? 0) + item.total);
        return {
          competencia: total.competencia + dia.competencia, recebimentosBrutos: total.recebimentosBrutos + dia.recebimentosBrutos,
          estornos: total.estornos + dia.estornos, recebimentosLiquidos: total.recebimentosLiquidos + dia.recebimentosLiquidos,
          aReceber: total.aReceber + dia.aReceber, entradasManuais: total.entradasManuais + dia.entradasManuais,
          saidasManuais: total.saidasManuais + dia.saidasManuais, saldoCaixa: total.saldoCaixa + dia.saldoCaixa,
          porForma: [...formas].map(([forma, valor]) => ({ forma, total: valor })),
          pedidosCompetencia: total.pedidosCompetencia + dia.pedidosCompetencia, pedidosRecebidos: total.pedidosRecebidos + dia.pedidosRecebidos,
          notas: [...total.notas, ...dia.notas], notasEmitidas: total.notasEmitidas + dia.notasEmitidas,
          notasCanceladas: total.notasCanceladas + dia.notasCanceladas, notasComErro: total.notasComErro + dia.notasComErro,
          notasPendentes: total.notasPendentes + dia.notasPendentes, pedidosPagosSemNota: total.pedidosPagosSemNota + dia.pedidosPagosSemNota,
        };
      }, { competencia: 0, recebimentosBrutos: 0, estornos: 0, recebimentosLiquidos: 0, aReceber: 0, entradasManuais: 0, saidasManuais: 0, saldoCaixa: 0, porForma: [], pedidosCompetencia: 0, pedidosRecebidos: 0, notas: [], notasEmitidas: 0, notasCanceladas: 0, notasComErro: 0, notasPendentes: 0, pedidosPagosSemNota: 0 })
    : dados;
  const periodo = new Date(`${inicio}T12:00:00${offsetInicio}`).toLocaleDateString(intlLocale, { month: "long", year: "numeric", timeZone: timezone });

  return (
    <div>
      <form className="mb-6 flex items-end gap-2 print:hidden">
        <div>
          <label className="block text-xs text-stone-500">{t.labelMes}</label>
          <input name="mes" type="month" defaultValue={mes} className="rounded-md border px-3 py-2 text-sm" />
        </div>
        <button className="rounded-md bg-stone-900 px-4 py-2 text-sm text-white">{t.consultar}</button>
      </form>
      {finalizado ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{t.tudoFechado(diasComMovimento.size)}</p>
      ) : (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {t.provisorioPrefixo} {diasPendentes.length ? diasPendentes.map((dia) => dia.split("-").reverse().join("/")).join(", ") : t.semMovimento}.
        </p>
      )}
      <FechamentoFiscalReport titulo={finalizado ? t.tituloDefinitivo : t.tituloPrevia} periodo={periodo} dados={dadosDefinitivos} finalizado={finalizado} locale={locale} />
    </div>
  );
}

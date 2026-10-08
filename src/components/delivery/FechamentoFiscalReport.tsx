import Link from "next/link";
import { PrintFiscalDocumentButton } from "./PrintFiscalDocumentButton";
import type { FechamentoDados } from "@/lib/fiscal/fechamento";
import type { RestauranteLocale } from "@/lib/subscription";

function real(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
function euro(value: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
}
function dataHoraBrasil(value: string) {
  return new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}
function dataHoraItalia(value: string) {
  return new Date(value).toLocaleString("it-IT", { timeZone: "Europe/Rome" });
}

const STATUS_LABEL: Record<RestauranteLocale, Record<string, string>> = {
  "pt-BR": { pendente: "pendente", emitida: "emitida", erro: "erro", cancelada: "cancelada" },
  it: { pendente: "pendente", emitida: "emesso", erro: "errore", cancelada: "annullato" },
};

const CONTEUDO: Record<RestauranteLocale, {
  periodo: string; pendencias: (semNota: number, pendente: number, erro: number) => string;
  vendasCompetencia: string; vendaConcluida: string; recebimentosBrutos: string; pagamento: string;
  estornos: string; recebimentoLiquido: string; saldoCaixa: string; incluiManuais: string;
  recebimentosPorForma: string; nenhumRecebimento: string; conciliacao: string;
  contasAReceber: string; outrasEntradas: string; saidasRetiradas: string; diferenca: string;
  documentosFiscais: string; emitidas: string; canceladas: string; pendentes: string; erros: string;
  colData: string; colNumero: string; colCliente: string; colValor: string; colStatus: string; colDocumento: string;
  teste: string; nenhumDocumento: string; visualizar: string; clienteNaoIdentificado: string;
  finalizadoMsg: string; provisorioMsg: string; rodape: string;
}> = {
  "pt-BR": {
    periodo: "Período",
    pendencias: (semNota, pendente, erro) => `Existem pendências fiscais: ${semNota} venda(s) paga(s) sem nota, ${pendente} pendente(s) e ${erro} com erro.`,
    vendasCompetencia: "Vendas por competência", vendaConcluida: "venda(s) concluída(s)",
    recebimentosBrutos: "Recebimentos brutos", pagamento: "pagamento(s)",
    estornos: "Estornos", recebimentoLiquido: "Recebimento líquido",
    saldoCaixa: "Saldo de caixa", incluiManuais: "Inclui movimentos manuais",
    recebimentosPorForma: "Recebimentos por forma", nenhumRecebimento: "Nenhum recebimento.",
    conciliacao: "Conciliação", contasAReceber: "Contas a receber do período",
    outrasEntradas: "Outras entradas", saidasRetiradas: "Saídas/retiradas",
    diferenca: "Diferença caixa × competência",
    documentosFiscais: "Relação de documentos fiscais", emitidas: "Emitidas", canceladas: "Canceladas",
    pendentes: "Pendentes", erros: "Erros",
    colData: "Data", colNumero: "Número", colCliente: "Cliente", colValor: "Valor", colStatus: "Status", colDocumento: "Documento",
    teste: " · teste", nenhumDocumento: "Nenhum documento fiscal neste período.", visualizar: "Visualizar",
    clienteNaoIdentificado: "Consumidor não identificado",
    finalizadoMsg: "Relatório interno fechado para conferência.",
    provisorioMsg: "Prévia não finalizada: feche o caixa antes de imprimir ou enviar ao contador.",
    rodape: "Não substitui XML, DANFE autorizado, escrituração fiscal ou orientação do contador.",
  },
  it: {
    periodo: "Periodo",
    pendencias: (semNota, pendente, erro) => `Ci sono pendenze fiscali: ${semNota} vendita/e pagata/e senza documento, ${pendente} pendente/i e ${erro} con errore.`,
    vendasCompetencia: "Vendite per competenza", vendaConcluida: "vendita/e conclusa/e",
    recebimentosBrutos: "Incassi lordi", pagamento: "pagamento/i",
    estornos: "Storni", recebimentoLiquido: "Incasso netto",
    saldoCaixa: "Saldo di cassa", incluiManuais: "Include movimenti manuali",
    recebimentosPorForma: "Incassi per modalità", nenhumRecebimento: "Nessun incasso.",
    conciliacao: "Riconciliazione", contasAReceber: "Crediti del periodo",
    outrasEntradas: "Altre entrate", saidasRetiradas: "Uscite/prelievi",
    diferenca: "Differenza cassa × competenza",
    documentosFiscais: "Elenco documenti fiscali", emitidas: "Emessi", canceladas: "Annullati",
    pendentes: "Pendenti", erros: "Errori",
    colData: "Data", colNumero: "Numero", colCliente: "Cliente", colValor: "Valore", colStatus: "Stato", colDocumento: "Documento",
    teste: " · test", nenhumDocumento: "Nessun documento fiscale in questo periodo.", visualizar: "Visualizza",
    clienteNaoIdentificado: "Cliente non identificato",
    finalizadoMsg: "Report interno chiuso per verifica.",
    provisorioMsg: "Anteprima non definitiva: chiudi la cassa prima di stampare o inviare al commercialista.",
    rodape: "Non sostituisce fattura elettronica trasmessa allo SdI, registri IVA o il parere del commercialista.",
  },
};

export function FechamentoFiscalReport({
  titulo, periodo, dados, finalizado = true, locale = "pt-BR",
}: { titulo: string; periodo: string; dados: FechamentoDados; finalizado?: boolean; locale?: RestauranteLocale }) {
  const t = CONTEUDO[locale];
  const fmt = locale === "it" ? euro : real;
  const dataHora = locale === "it" ? dataHoraItalia : dataHoraBrasil;
  const status = STATUS_LABEL[locale];
  const alerta = dados.notasComErro + dados.notasPendentes + dados.pedidosPagosSemNota;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-stone-900">{titulo}</h1><p className="mt-1 text-sm text-stone-600">{t.periodo}: {periodo}</p></div>
        {finalizado && <PrintFiscalDocumentButton />}
      </div>

      {alerta > 0 && <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{t.pendencias(dados.pedidosPagosSemNota, dados.notasPendentes, dados.notasComErro)}</p>}

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4"><p className="text-xs text-stone-500">{t.vendasCompetencia}</p><p className="mt-1 text-xl font-bold">{fmt(dados.competencia)}</p><p className="text-xs text-stone-400">{dados.pedidosCompetencia} {t.vendaConcluida}</p></div>
        <div className="rounded-xl border bg-white p-4"><p className="text-xs text-stone-500">{t.recebimentosBrutos}</p><p className="mt-1 text-xl font-bold text-emerald-700">{fmt(dados.recebimentosBrutos)}</p><p className="text-xs text-stone-400">{dados.pedidosRecebidos} {t.pagamento}</p></div>
        <div className="rounded-xl border bg-white p-4"><p className="text-xs text-stone-500">{t.estornos}</p><p className="mt-1 text-xl font-bold text-red-600">{fmt(dados.estornos)}</p><p className="text-xs text-stone-400">{t.recebimentoLiquido}: {fmt(dados.recebimentosLiquidos)}</p></div>
        <div className="rounded-xl border bg-white p-4"><p className="text-xs text-stone-500">{t.saldoCaixa}</p><p className="mt-1 text-xl font-bold">{fmt(dados.saldoCaixa)}</p><p className="text-xs text-stone-400">{t.incluiManuais}</p></div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-4"><h2 className="font-semibold">{t.recebimentosPorForma}</h2><div className="mt-3 space-y-2">{dados.porForma.map((item) => <div key={item.forma} className="flex justify-between text-sm"><span className="capitalize">{item.forma.replaceAll("_", " ")}</span><strong>{fmt(item.total)}</strong></div>)}{dados.porForma.length === 0 && <p className="text-sm text-stone-500">{t.nenhumRecebimento}</p>}</div></div>
        <div className="rounded-xl border bg-white p-4"><h2 className="font-semibold">{t.conciliacao}</h2><div className="mt-3 space-y-2 text-sm"><div className="flex justify-between"><span>{t.contasAReceber}</span><strong>{fmt(dados.aReceber)}</strong></div><div className="flex justify-between"><span>{t.outrasEntradas}</span><strong>{fmt(dados.entradasManuais)}</strong></div><div className="flex justify-between"><span>{t.saidasRetiradas}</span><strong>{fmt(dados.saidasManuais)}</strong></div><div className="flex justify-between border-t pt-2"><span>{t.diferenca}</span><strong>{fmt(dados.recebimentosLiquidos - dados.competencia)}</strong></div></div></div>
      </section>

      <section className="mt-8"><h2 className="font-semibold">{t.documentosFiscais}</h2><p className="mt-1 text-xs text-stone-500">{t.emitidas} {dados.notasEmitidas} · {t.canceladas} {dados.notasCanceladas} · {t.pendentes} {dados.notasPendentes} · {t.erros} {dados.notasComErro}</p><div className="mt-3 overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-xs"><thead className="border-b bg-stone-50"><tr><th className="p-3">{t.colData}</th><th className="p-3">{t.colNumero}</th><th className="p-3">{t.colCliente}</th><th className="p-3">{t.colValor}</th><th className="p-3">{t.colStatus}</th><th className="p-3 print:hidden">{t.colDocumento}</th></tr></thead><tbody>{dados.notas.map((nota) => <tr key={nota.id} className="border-b last:border-0"><td className="p-3">{dataHora(nota.data)}</td><td className="p-3">{nota.numero ?? "—"}{nota.provedor === "simulado" ? t.teste : ""}</td><td className="p-3">{nota.cliente || t.clienteNaoIdentificado}</td><td className="p-3">{fmt(nota.total)}</td><td className="p-3 capitalize">{status[nota.status] ?? nota.status}</td><td className="p-3 print:hidden"><Link href={`/restaurante/fiscal/notas/${nota.id}/imprimir`} target="_blank" className="text-amber-700 hover:underline">{t.visualizar}</Link></td></tr>)}{dados.notas.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-stone-500">{t.nenhumDocumento}</td></tr>}</tbody></table></div></section>

      <p className="mt-6 text-xs text-stone-500">{finalizado ? t.finalizadoMsg : t.provisorioMsg} {t.rodape}</p>
    </div>
  );
}

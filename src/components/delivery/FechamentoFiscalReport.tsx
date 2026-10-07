import Link from "next/link";
import { PrintFiscalDocumentButton } from "./PrintFiscalDocumentButton";
import type { FechamentoDados } from "@/lib/fiscal/fechamento";

function real(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function dataHora(value: string) {
  return new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function FechamentoFiscalReport({ titulo, periodo, dados }: { titulo: string; periodo: string; dados: FechamentoDados }) {
  const alerta = dados.notasComErro + dados.notasPendentes + dados.pedidosPagosSemNota;
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-stone-900">{titulo}</h1><p className="mt-1 text-sm text-stone-600">Período: {periodo} · horário de Brasília</p></div>
        <PrintFiscalDocumentButton />
      </div>

      {alerta > 0 && <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Existem pendências fiscais: {dados.pedidosPagosSemNota} venda(s) paga(s) sem nota, {dados.notasPendentes} pendente(s) e {dados.notasComErro} com erro.</p>}

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4"><p className="text-xs text-stone-500">Vendas por competência</p><p className="mt-1 text-xl font-bold">{real(dados.competencia)}</p><p className="text-xs text-stone-400">{dados.pedidosCompetencia} venda(s) concluída(s)</p></div>
        <div className="rounded-xl border bg-white p-4"><p className="text-xs text-stone-500">Recebimentos brutos</p><p className="mt-1 text-xl font-bold text-emerald-700">{real(dados.recebimentosBrutos)}</p><p className="text-xs text-stone-400">{dados.pedidosRecebidos} pagamento(s)</p></div>
        <div className="rounded-xl border bg-white p-4"><p className="text-xs text-stone-500">Estornos</p><p className="mt-1 text-xl font-bold text-red-600">{real(dados.estornos)}</p><p className="text-xs text-stone-400">Recebimento líquido: {real(dados.recebimentosLiquidos)}</p></div>
        <div className="rounded-xl border bg-white p-4"><p className="text-xs text-stone-500">Saldo de caixa</p><p className="mt-1 text-xl font-bold">{real(dados.saldoCaixa)}</p><p className="text-xs text-stone-400">Inclui movimentos manuais</p></div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-4"><h2 className="font-semibold">Recebimentos por forma</h2><div className="mt-3 space-y-2">{dados.porForma.map((item) => <div key={item.forma} className="flex justify-between text-sm"><span className="capitalize">{item.forma.replaceAll("_", " ")}</span><strong>{real(item.total)}</strong></div>)}{dados.porForma.length === 0 && <p className="text-sm text-stone-500">Nenhum recebimento.</p>}</div></div>
        <div className="rounded-xl border bg-white p-4"><h2 className="font-semibold">Conciliação</h2><div className="mt-3 space-y-2 text-sm"><div className="flex justify-between"><span>Contas a receber do período</span><strong>{real(dados.aReceber)}</strong></div><div className="flex justify-between"><span>Outras entradas</span><strong>{real(dados.entradasManuais)}</strong></div><div className="flex justify-between"><span>Saídas/retiradas</span><strong>{real(dados.saidasManuais)}</strong></div><div className="flex justify-between border-t pt-2"><span>Diferença caixa × competência</span><strong>{real(dados.recebimentosLiquidos - dados.competencia)}</strong></div></div></div>
      </section>

      <section className="mt-8"><h2 className="font-semibold">Relação de documentos fiscais</h2><p className="mt-1 text-xs text-stone-500">Emitidas {dados.notasEmitidas} · Canceladas {dados.notasCanceladas} · Pendentes {dados.notasPendentes} · Erros {dados.notasComErro}</p><div className="mt-3 overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-xs"><thead className="border-b bg-stone-50"><tr><th className="p-3">Data</th><th className="p-3">Número</th><th className="p-3">Cliente</th><th className="p-3">Valor</th><th className="p-3">Status</th><th className="p-3 print:hidden">Documento</th></tr></thead><tbody>{dados.notas.map((nota) => <tr key={nota.id} className="border-b last:border-0"><td className="p-3">{dataHora(nota.data)}</td><td className="p-3">{nota.numero ?? "—"}{nota.provedor === "simulado" ? " · teste" : ""}</td><td className="p-3">{nota.cliente}</td><td className="p-3">{real(nota.total)}</td><td className="p-3 capitalize">{nota.status}</td><td className="p-3 print:hidden"><Link href={`/restaurante/fiscal/notas/${nota.id}/imprimir`} target="_blank" className="text-amber-700 hover:underline">Visualizar</Link></td></tr>)}{dados.notas.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-stone-500">Nenhum documento fiscal neste período.</td></tr>}</tbody></table></div></section>

      <p className="mt-6 text-xs text-stone-500">Relatório interno de conferência. Não substitui XML, DANFE autorizado, escrituração fiscal ou orientação do contador.</p>
    </div>
  );
}

import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";

const CONTEUDO: Record<
  RestauranteLocale,
  {
    titulo: string; subtitulo: string; criterio: string; competencia: string; caixa: string;
    dataInicial: string; dataFinal: string; baixarResumo: string; baixarItens: string;
    resumoLabel: string; resumoDesc: string; itensLabel: string; itensDesc: string; camposAusentes: string;
  }
> = {
  "pt-BR": {
    titulo: "Exportar para o contador",
    subtitulo: "Gere o arquivo de conferência por competência ou caixa. A exportação inclui pagamentos, estornos e situação fiscal.",
    criterio: "Critério do relatório",
    competencia: "Competência — data da entrega",
    caixa: "Caixa — data do pagamento",
    dataInicial: "Data inicial",
    dataFinal: "Data final",
    baixarResumo: "Baixar resumo de vendas",
    baixarItens: "Baixar itens vendidos",
    resumoLabel: "Resumo:",
    resumoDesc: "uma linha por venda, com pagamento, estorno e documento fiscal.",
    itensLabel: "Itens vendidos:",
    itensDesc: "uma linha por produto, incluindo quantidade, valores, NCM, CFOP, CEST, origem e vínculo com a NFC-e.",
    camposAusentes: "Campos fiscais ausentes são marcados como classificação incompleta para revisão do contador.",
  },
  it: {
    titulo: "Esporta per il commercialista",
    subtitulo: "Genera il file di verifica per competenza o cassa. L'esportazione include pagamenti, storni e situazione fiscale.",
    criterio: "Criterio del report",
    competencia: "Competenza — data di consegna",
    caixa: "Cassa — data di pagamento",
    dataInicial: "Data iniziale",
    dataFinal: "Data finale",
    baixarResumo: "Scarica riepilogo vendite",
    baixarItens: "Scarica articoli venduti",
    resumoLabel: "Riepilogo:",
    resumoDesc: "una riga per vendita, con pagamento, storno e documento fiscale.",
    itensLabel: "Articoli venduti:",
    itensDesc: "una riga per prodotto, con quantità e valori.",
    camposAusentes: "I campi fiscali brasiliani (NCM/CFOP/CEST) non si applicano qui e restano vuoti.",
  },
};

export default async function ExportacaoFiscalPage() {
  const { locale } = await requireRestaurantSubscription();
  const t = CONTEUDO[locale];

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">{t.subtitulo}</p>

      <form action="/api/restaurante/export-vendas" method="get" className="mt-6 grid gap-4 rounded-xl border border-stone-200 bg-white p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-stone-600">{t.criterio}</label>
          <select name="criterio" defaultValue="competencia" className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm">
            <option value="competencia">{t.competencia}</option>
            <option value="caixa">{t.caixa}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600">{t.dataInicial}</label>
          <input type="date" name="from" className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600">{t.dataFinal}</label>
          <input type="date" name="to" className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
        </div>
        <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
          <button type="submit" name="arquivo" value="resumo" className="rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white">{t.baixarResumo}</button>
          <button type="submit" name="arquivo" value="itens" className="rounded-md bg-amber-700 px-4 py-2.5 text-sm font-medium text-white">{t.baixarItens}</button>
        </div>
      </form>
      <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4 text-xs text-stone-600">
        <p><strong>{t.resumoLabel}</strong> {t.resumoDesc}</p>
        <p className="mt-1"><strong>{t.itensLabel}</strong> {t.itensDesc}</p>
        <p className="mt-1">{t.camposAusentes}</p>
      </div>
    </div>
  );
}

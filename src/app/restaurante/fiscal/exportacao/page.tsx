import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";

const CONTEUDO: Record<
  RestauranteLocale,
  {
    titulo: string; subtitulo: string; criterio: string; competencia: string; caixa: string;
    dataInicial: string; dataFinal: string; baixarResumo: string; baixarItens: string;
    resumoLabel: string; resumoDesc: string; itensLabel: string; itensDesc: string; camposAusentes: string;
    regimeForfettario: string; regimeOrdinario: string; regimeAusente: string;
    spedTitulo: string; spedMei: string; spedDescricao: string; spedBaixar: string;
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
    regimeForfettario: "", regimeOrdinario: "", regimeAusente: "",
    spedTitulo: "SPED Fiscal (EFD-ICMS/IPI)",
    spedMei: "Regime MEI: dispensado de SPED e SINTEGRA por lei — esta seção não se aplica ao seu cadastro.",
    spedDescricao: "Gera o arquivo no leiaute do SPED Fiscal com os documentos emitidos/cancelados no período. É um rascunho estrutural: confira com seu contador antes de transmitir — a versão do leiaute (COD_VER) e a classificação fiscal (CST/CSOSN/alíquota) de cada produto precisam estar corretas e atualizadas.",
    spedBaixar: "Baixar arquivo SPED",
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
    regimeForfettario: "Regime forfettario: le vendite non applicano IVA. Questa esportazione serve come base per l'imposta sostitutiva e gli altri adempimenti — l'importo finale va sempre confermato con il commercialista.",
    regimeOrdinario: "Regime ordinario: questa esportazione riporta le vendite riconciliate del periodo. Per la liquidazione IVA mancano ancora i dati IVA sugli acquisti (non tracciati in questo sistema) — il commercialista dovrà integrarli, e l'aliquota applicabile va confermata con lui.",
    regimeAusente: "Regime fiscale non ancora confermato. Completa i dati fiscali per sapere quale adempimento si applica.",
    spedTitulo: "", spedMei: "", spedDescricao: "", spedBaixar: "",
  },
};

export default async function ExportacaoFiscalPage() {
  const { supabase, restaurantOwnerId, locale } = await requireRestaurantSubscription("fiscal");
  const t = CONTEUDO[locale];

  let avisoRegime: string | null = null;
  let regimeBr: string | null = null;
  if (locale === "it") {
    const { data: restaurant } = await supabase.from("restaurants").select("id").eq("owner_user_id", restaurantOwnerId).maybeSingle();
    const { data: configIt } = restaurant
      ? await supabase.from("restaurant_fiscal_it").select("regime_fiscale").eq("restaurant_id", restaurant.id).maybeSingle()
      : { data: null };
    avisoRegime = configIt?.regime_fiscale === "RF19" ? t.regimeForfettario : configIt?.regime_fiscale === "RF01" ? t.regimeOrdinario : t.regimeAusente;
  } else {
    const { data: configBr } = await supabase.from("del_fiscal_config").select("regime_tributario").eq("owner_id", restaurantOwnerId).maybeSingle();
    regimeBr = configBr?.regime_tributario ?? "mei";
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">{t.subtitulo}</p>
      {avisoRegime && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{avisoRegime}</p>}

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

      {locale !== "it" && (
        <section className="mt-8">
          <h2 className="font-semibold text-stone-900">{t.spedTitulo}</h2>
          {regimeBr === "mei" ? (
            <p className="mt-2 rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">{t.spedMei}</p>
          ) : (
            <>
              <p className="mt-1 text-xs text-stone-600">{t.spedDescricao}</p>
              <form action="/api/restaurante/export-sped" method="get" className="mt-3 grid gap-3 rounded-xl border border-stone-200 bg-white p-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-stone-600">{t.dataInicial}</label>
                  <input type="date" name="de" required className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600">{t.dataFinal}</label>
                  <input type="date" name="ate" required className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
                </div>
                <button type="submit" className="rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white sm:col-span-2">{t.spedBaixar}</button>
              </form>
            </>
          )}
        </section>
      )}
    </div>
  );
}

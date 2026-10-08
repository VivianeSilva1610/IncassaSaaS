import Link from "next/link";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { calcularMetricasPeriodo } from "@/lib/delivery/gestao";
import { offsetParaData } from "@/lib/fiscal/fechamento";

function hojeNoFuso(timeZone: string): string {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return `${partes.find((p) => p.type === "year")!.value}-${partes.find((p) => p.type === "month")!.value}-${partes.find((p) => p.type === "day")!.value}`;
}

function inicioMesNoFuso(timeZone: string): string {
  return `${hojeNoFuso(timeZone).slice(0, 7)}-01`;
}

function Linha({ label, value, destaque, negativo, formatReal }: { label: string; value: number; destaque?: boolean; negativo?: boolean; formatReal: (v: number) => string }) {
  return (
    <div className={`flex items-center justify-between py-2 ${destaque ? "border-t border-stone-300 pt-3" : ""}`}>
      <span className={destaque ? "font-semibold text-stone-900" : "text-stone-600"}>{label}</span>
      <span className={`${destaque ? "text-lg font-bold" : ""} ${negativo ? "text-red-600" : destaque ? (value >= 0 ? "text-emerald-700" : "text-red-600") : "text-stone-900"}`}>
        {negativo && value > 0 ? "− " : ""}
        {formatReal(Math.abs(value))}
      </span>
    </div>
  );
}

const CONTEUDO: Record<RestauranteLocale, {
  voltar: string; titulo: string; descricao: string; de: string; ate: string; atualizar: string;
  cmvParcial: string; receitaBruta: string; estornos: string; receitaLiquida: string; cmv: string;
  margemContribuicao: string; custosFixos: string; resultadoEstimado: string; rodape: string;
}> = {
  "pt-BR": {
    voltar: "← Financeiro", titulo: "DRE gerencial",
    descricao: "Demonstração de resultado estimada, por competência (data de entrega do pedido). Não é um documento contábil ou fiscal — é uma leitura gerencial pra acompanhar se o restaurante está dando lucro.",
    de: "De", ate: "Até", atualizar: "Atualizar",
    cmvParcial: "Algum produto vendido não tem ficha técnica completa — o CMV abaixo não inclui esses itens, então o resultado real tende a ser um pouco pior do que o mostrado aqui.",
    receitaBruta: "Receita bruta de vendas", estornos: "(−) Estornos", receitaLiquida: "= Receita líquida",
    cmv: "(−) CMV (custo da mercadoria vendida)", margemContribuicao: "= Margem de contribuição",
    custosFixos: "(−) Custos fixos (rateio do período)", resultadoEstimado: "= Resultado estimado",
    rodape: "Custos fixos vêm do cadastro em Custos, rateados pelos dias do período selecionado. Não inclui impostos nem despesas avulsas pagas via Contas a pagar que não sejam fixas — pra isso, veja Contas a pagar e Caixa.",
  },
  it: {
    voltar: "← Finanza", titulo: "Conto economico gestionale",
    descricao: "Risultato stimato, per competenza (data di consegna dell'ordine). Non è un documento contabile o fiscale — è una lettura gestionale per monitorare se il ristorante genera profitto.",
    de: "Da", ate: "A", atualizar: "Aggiorna",
    cmvParcial: "Qualche prodotto venduto non ha la scheda tecnica completa — il costo del venduto sotto non include quegli articoli, quindi il risultato reale tende a essere un po' peggiore di quello mostrato qui.",
    receitaBruta: "Ricavi lordi di vendita", estornos: "(−) Storni", receitaLiquida: "= Ricavi netti",
    cmv: "(−) Costo del venduto", margemContribuicao: "= Margine di contribuzione",
    custosFixos: "(−) Costi fissi (ripartiti sul periodo)", resultadoEstimado: "= Risultato stimato",
    rodape: "I costi fissi vengono dall'anagrafica in Costi, ripartiti sui giorni del periodo selezionato. Non include tasse né spese occasionali pagate tramite Debiti che non siano fisse — per quello, vedi Debiti e Cassa.",
  },
};

export default async function DrePage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string }>;
}) {
  const { supabase, restaurantOwnerId, locale } = await requireRestaurantSubscription("financeiro");
  const t = CONTEUDO[locale];
  const formatReal = (value: number) => (locale === "it"
    ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value));
  const timezone = locale === "it" ? "Europe/Rome" : "America/Sao_Paulo";
  const params = await searchParams;
  const hoje = hojeNoFuso(timezone);
  const de = /^\d{4}-\d{2}-\d{2}$/.test(params.de ?? "") ? params.de! : inicioMesNoFuso(timezone);
  const ate = /^\d{4}-\d{2}-\d{2}$/.test(params.ate ?? "") ? params.ate! : hoje;

  const m = await calcularMetricasPeriodo(supabase, restaurantOwnerId, `${de}T00:00:00${offsetParaData(timezone, de)}`, `${ate}T23:59:59.999${offsetParaData(timezone, ate)}`);

  return (
    <div>
      <Link href="/restaurante/financeiro" className="text-sm text-amber-700 underline underline-offset-2">
        {t.voltar}
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {t.descricao}
      </p>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-white p-4">
        <label className="text-sm text-stone-600">
          <span className="mb-1 block text-xs text-stone-500">{t.de}</span>
          <input name="de" type="date" defaultValue={de} max={hoje} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm text-stone-600">
          <span className="mb-1 block text-xs text-stone-500">{t.ate}</span>
          <input name="ate" type="date" defaultValue={ate} max={hoje} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        </label>
        <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
          {t.atualizar}
        </button>
      </form>

      {m.cmvComDadosParciais && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          {t.cmvParcial}
        </p>
      )}

      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
        <Linha label={t.receitaBruta} value={m.receita} formatReal={formatReal} />
        <Linha label={t.estornos} value={m.estornos} negativo formatReal={formatReal} />
        <Linha label={t.receitaLiquida} value={m.receitaLiquida} destaque formatReal={formatReal} />

        <Linha label={t.cmv} value={m.cmv} negativo formatReal={formatReal} />
        <Linha label={t.margemContribuicao} value={m.margem} destaque formatReal={formatReal} />

        <Linha label={t.custosFixos} value={m.custosFixosNoPeriodo} negativo formatReal={formatReal} />
        <Linha label={t.resultadoEstimado} value={m.lucroEstimado} destaque formatReal={formatReal} />
      </div>

      <p className="mt-4 text-xs text-stone-500">
        {t.rodape}
      </p>
    </div>
  );
}

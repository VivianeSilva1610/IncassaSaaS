import Link from "next/link";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { calcularMetricasPeriodo } from "@/lib/delivery/gestao";
import { offsetParaData } from "@/lib/fiscal/fechamento";

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function hojeNoFuso(timeZone: string): string {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return `${partes.find((p) => p.type === "year")!.value}-${partes.find((p) => p.type === "month")!.value}-${partes.find((p) => p.type === "day")!.value}`;
}

function inicioMesNoFuso(timeZone: string): string {
  return `${hojeNoFuso(timeZone).slice(0, 7)}-01`;
}

const CONTEUDO: Record<RestauranteLocale, {
  voltar: string; titulo: string; descricao: string; de: string; ate: string; atualizar: string;
  cmvParcial: string; receita: string; cmv: string; margem: string; lucroEstimado: string;
  margemMenosCustos: (valor: string) => string; margemPorPrato: string; receitaLabel: (valor: string) => string;
  cmvMargem: (cmv: string, margem: string, pct: string) => string; semFichaTecnica: string; nenhumaVenda: string;
}> = {
  "pt-BR": {
    voltar: "← Gestão", titulo: "Margem e CMV",
    descricao: "CMV calculado pela ficha técnica de cada prato, usando o custo do ingrediente vigente na data de cada venda (não o custo de hoje).",
    de: "De", ate: "Até", atualizar: "Atualizar",
    cmvParcial: "Algum produto vendido não tem ficha técnica completa (ingrediente sem custo cadastrado) — o CMV e o lucro estimado abaixo não incluem esses itens, então ficam um pouco menores do que a realidade.",
    receita: "Receita", cmv: "CMV", margem: "Margem (receita − CMV)", lucroEstimado: "Lucro estimado",
    margemMenosCustos: (valor) => `Margem − ${valor} de custos fixos rateados`,
    margemPorPrato: "Margem por prato", receitaLabel: (valor) => `Receita ${valor}`,
    cmvMargem: (cmv, margem, pct) => `CMV ${cmv} · Margem ${margem} (${pct})`,
    semFichaTecnica: "Sem ficha técnica completa", nenhumaVenda: "Nenhuma venda no período.",
  },
  it: {
    voltar: "← Gestione", titulo: "Margine e costo del venduto",
    descricao: "Costo del venduto calcolato dalla scheda tecnica di ogni piatto, usando il costo dell'ingrediente vigente alla data di ogni vendita (non il costo di oggi).",
    de: "Da", ate: "A", atualizar: "Aggiorna",
    cmvParcial: "Qualche prodotto venduto non ha la scheda tecnica completa (ingrediente senza costo registrato) — il costo del venduto e il profitto stimato sotto non includono quegli articoli, quindi risultano un po' inferiori alla realtà.",
    receita: "Ricavi", cmv: "Costo del venduto", margem: "Margine (ricavi − costo del venduto)", lucroEstimado: "Profitto stimato",
    margemMenosCustos: (valor) => `Margine − ${valor} di costi fissi ripartiti`,
    margemPorPrato: "Margine per piatto", receitaLabel: (valor) => `Ricavi ${valor}`,
    cmvMargem: (cmv, margem, pct) => `Costo ${cmv} · Margine ${margem} (${pct})`,
    semFichaTecnica: "Senza scheda tecnica completa", nenhumaVenda: "Nessuna vendita nel periodo.",
  },
};

export default async function GestaoMargemPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string }>;
}) {
  const { supabase, restaurantOwnerId, locale } = await requireRestaurantSubscription("gestao");
  const t = CONTEUDO[locale];
  const formatReal = (value: number) => (locale === "it"
    ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value));
  const timezone = locale === "it" ? "Europe/Rome" : "America/Sao_Paulo";
  const params = await searchParams;
  const hoje = hojeNoFuso(timezone);
  const de = /^\d{4}-\d{2}-\d{2}$/.test(params.de ?? "") ? params.de! : inicioMesNoFuso(timezone);
  const ate = /^\d{4}-\d{2}-\d{2}$/.test(params.ate ?? "") ? params.ate! : hoje;

  const metricas = await calcularMetricasPeriodo(supabase, restaurantOwnerId, `${de}T00:00:00${offsetParaData(timezone, de)}`, `${ate}T23:59:59.999${offsetParaData(timezone, ate)}`);
  const produtosOrdenados = [...metricas.produtos].sort((a, b) => (b.margem ?? -Infinity) - (a.margem ?? -Infinity));

  return (
    <div>
      <Link href="/restaurante/gestao" className="text-sm text-amber-700 underline underline-offset-2">
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

      {metricas.cmvComDadosParciais && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          {t.cmvParcial}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">{t.receita}</p>
          <p className="mt-1 text-xl font-bold text-stone-900">{formatReal(metricas.receita)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">{t.cmv}</p>
          <p className="mt-1 text-xl font-bold text-red-600">{formatReal(metricas.cmv)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">{t.margem}</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{formatReal(metricas.margem)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-stone-900 p-4">
          <p className="text-sm text-stone-300">{t.lucroEstimado}</p>
          <p className={`mt-1 text-xl font-bold ${metricas.lucroEstimado >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {formatReal(metricas.lucroEstimado)}
          </p>
          <p className="mt-1 text-xs text-stone-400">{t.margemMenosCustos(formatReal(metricas.custosFixosNoPeriodo))}</p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="font-semibold text-stone-900">{t.margemPorPrato}</h2>
        <div className="mt-2 space-y-2">
          {produtosOrdenados.map((p) => (
            <div key={p.productId} className="rounded-lg border border-stone-200 bg-white p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-stone-900">{p.nome}</span>
                <span className="text-stone-500">{p.quantidade}x</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-stone-500">
                <span>{t.receitaLabel(formatReal(p.receita))}</span>
                {p.cmv != null ? (
                  <span>
                    {t.cmvMargem(formatReal(p.cmv), formatReal(p.margem!), formatPercent(p.margemPercentual!))}
                  </span>
                ) : (
                  <span className="text-amber-700">{t.semFichaTecnica}</span>
                )}
              </div>
            </div>
          ))}
          {produtosOrdenados.length === 0 && <p className="text-sm text-stone-500">{t.nenhumaVenda}</p>}
        </div>
      </div>
    </div>
  );
}

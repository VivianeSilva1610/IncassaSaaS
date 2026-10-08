import Link from "next/link";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { calcularDesperdicio } from "@/lib/delivery/gestao";
import { offsetParaData } from "@/lib/fiscal/fechamento";

function hojeNoFuso(timeZone: string): string {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return `${partes.find((p) => p.type === "year")!.value}-${partes.find((p) => p.type === "month")!.value}-${partes.find((p) => p.type === "day")!.value}`;
}

function inicioMesNoFuso(timeZone: string): string {
  return `${hojeNoFuso(timeZone).slice(0, 7)}-01`;
}

const CONTEUDO: Record<RestauranteLocale, {
  voltar: string; titulo: string; descricao: string; de: string; ate: string; atualizar: string;
  valorParcial: string; valorEstimadoPerdido: string; registrosPerda: string; nenhumaPerda: string;
}> = {
  "pt-BR": {
    voltar: "← Gestão", titulo: "Desperdício",
    descricao: "Baseado nos movimentos de estoque marcados como \"Perda/desperdício\" — lançados direto em Produtos ou gerados pelo Inventário quando a contagem física dá menos do que o sistema esperava.",
    de: "De", ate: "Até", atualizar: "Atualizar",
    valorParcial: "Algum ingrediente perdido não tinha custo cadastrado na data — o valor estimado abaixo fica menor do que a perda real.",
    valorEstimadoPerdido: "Valor estimado perdido", registrosPerda: "Registros de perda no período",
    nenhumaPerda: "Nenhuma perda registrada no período.",
  },
  it: {
    voltar: "← Gestione", titulo: "Spreco",
    descricao: "Basato sui movimenti di magazzino segnati come \"Perdita/spreco\" — registrati direttamente in Prodotti o generati dall'Inventario quando il conteggio fisico risulta inferiore a quanto previsto dal sistema.",
    de: "Da", ate: "A", atualizar: "Aggiorna",
    valorParcial: "Qualche ingrediente perso non aveva un costo registrato in quella data — il valore stimato sotto risulta inferiore alla perdita reale.",
    valorEstimadoPerdido: "Valore stimato perso", registrosPerda: "Registrazioni di perdita nel periodo",
    nenhumaPerda: "Nessuna perdita registrata nel periodo.",
  },
};

export default async function GestaoDesperdicioPage({
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

  const desperdicio = await calcularDesperdicio(supabase, restaurantOwnerId, `${de}T00:00:00${offsetParaData(timezone, de)}`, `${ate}T23:59:59.999${offsetParaData(timezone, ate)}`);

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

      {desperdicio.valorComDadosParciais && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          {t.valorParcial}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">{t.valorEstimadoPerdido}</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{formatReal(desperdicio.valorTotalEstimado)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">{t.registrosPerda}</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{desperdicio.quantidadeDeMovimentos}</p>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {desperdicio.porIngrediente.map((item) => (
          <div key={item.ingredientId} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3 text-sm">
            <span className="font-medium text-stone-900">
              <span className="text-stone-400">{item.codigo}</span> {item.nome}
            </span>
            <span className="text-stone-500">
              {item.quantidade} {item.unidade}
              {item.valorEstimado != null && ` · ${formatReal(item.valorEstimado)}`}
            </span>
          </div>
        ))}
        {desperdicio.porIngrediente.length === 0 && <p className="text-sm text-stone-500">{t.nenhumaPerda}</p>}
      </div>
    </div>
  );
}

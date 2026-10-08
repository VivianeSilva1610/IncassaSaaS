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

const LABEL_CANAL: Record<RestauranteLocale, Record<string, string>> = {
  "pt-BR": { site: "Loja online", mesa: "Mesa", pdv: "Balcão", telefone: "Telefone" },
  it: { site: "Negozio online", mesa: "Tavolo", pdv: "Banco", telefone: "Telefono" },
};

const CONTEUDO: Record<RestauranteLocale, {
  voltar: string; titulo: string; descricao: string; de: string; ate: string; atualizar: string;
  receitaPeriodo: string; pedidos: string; ticketMedio: string; vendasPorCanal: string;
  pedido: (n: number) => string; nenhumaVenda: string; produtosMaisVendidos: string;
}> = {
  "pt-BR": {
    voltar: "← Gestão", titulo: "Vendas", descricao: "Por competência (data de entrega do pedido).",
    de: "De", ate: "Até", atualizar: "Atualizar", receitaPeriodo: "Receita no período", pedidos: "Pedidos",
    ticketMedio: "Ticket médio", vendasPorCanal: "Vendas por canal",
    pedido: (n) => `${n} pedido${n === 1 ? "" : "s"}`, nenhumaVenda: "Nenhuma venda no período.",
    produtosMaisVendidos: "Produtos mais vendidos",
  },
  it: {
    voltar: "← Gestione", titulo: "Vendite", descricao: "Per competenza (data di consegna dell'ordine).",
    de: "Da", ate: "A", atualizar: "Aggiorna", receitaPeriodo: "Ricavi nel periodo", pedidos: "Ordini",
    ticketMedio: "Scontrino medio", vendasPorCanal: "Vendite per canale",
    pedido: (n) => `${n} ordine/i`, nenhumaVenda: "Nessuna vendita nel periodo.",
    produtosMaisVendidos: "Prodotti più venduti",
  },
};

export default async function GestaoVendasPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string }>;
}) {
  const { supabase, restaurantOwnerId, locale } = await requireRestaurantSubscription("gestao");
  const t = CONTEUDO[locale];
  const labelCanal = LABEL_CANAL[locale];
  const formatReal = (value: number) => (locale === "it"
    ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value));
  const timezone = locale === "it" ? "Europe/Rome" : "America/Sao_Paulo";
  const params = await searchParams;
  const hoje = hojeNoFuso(timezone);
  const de = /^\d{4}-\d{2}-\d{2}$/.test(params.de ?? "") ? params.de! : inicioMesNoFuso(timezone);
  const ate = /^\d{4}-\d{2}-\d{2}$/.test(params.ate ?? "") ? params.ate! : hoje;

  const metricas = await calcularMetricasPeriodo(supabase, restaurantOwnerId, `${de}T00:00:00${offsetParaData(timezone, de)}`, `${ate}T23:59:59.999${offsetParaData(timezone, ate)}`);
  const maisVendidos = [...metricas.produtos].slice(0, 15);

  return (
    <div>
      <Link href="/restaurante/gestao" className="text-sm text-amber-700 underline underline-offset-2">
        {t.voltar}
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">{t.descricao}</p>

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

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">{t.receitaPeriodo}</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{formatReal(metricas.receita)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">{t.pedidos}</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{metricas.pedidos}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">{t.ticketMedio}</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{formatReal(metricas.ticketMedio)}</p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="font-semibold text-stone-900">{t.vendasPorCanal}</h2>
        <div className="mt-2 space-y-2">
          {metricas.vendasPorCanal.map((c) => (
            <div key={c.canal} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3 text-sm">
              <span className="font-medium text-stone-900">{labelCanal[c.canal] ?? c.canal}</span>
              <span className="text-stone-500">
                {formatReal(c.receita)} · {t.pedido(c.pedidos)}
              </span>
            </div>
          ))}
          {metricas.vendasPorCanal.length === 0 && <p className="text-sm text-stone-500">{t.nenhumaVenda}</p>}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="font-semibold text-stone-900">{t.produtosMaisVendidos}</h2>
        <div className="mt-2 space-y-2">
          {maisVendidos.map((p) => (
            <div key={p.productId} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3 text-sm">
              <div>
                <p className="font-medium text-stone-900">{p.nome}</p>
                {p.categoria && <p className="text-xs text-stone-400">{p.categoria}</p>}
              </div>
              <span className="text-stone-500">
                {p.quantidade}x · {formatReal(p.receita)}
              </span>
            </div>
          ))}
          {maisVendidos.length === 0 && <p className="text-sm text-stone-500">{t.nenhumaVenda}</p>}
        </div>
      </div>
    </div>
  );
}

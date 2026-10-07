import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { calcularMetricasPeriodo } from "@/lib/delivery/gestao";

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function hojeSP(): string {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return `${partes.find((p) => p.type === "year")!.value}-${partes.find((p) => p.type === "month")!.value}-${partes.find((p) => p.type === "day")!.value}`;
}

function inicioMesSP(): string {
  return `${hojeSP().slice(0, 7)}-01`;
}

export default async function GestaoMargemPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string }>;
}) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription("gestao");
  const params = await searchParams;
  const de = /^\d{4}-\d{2}-\d{2}$/.test(params.de ?? "") ? params.de! : inicioMesSP();
  const ate = /^\d{4}-\d{2}-\d{2}$/.test(params.ate ?? "") ? params.ate! : hojeSP();

  const metricas = await calcularMetricasPeriodo(supabase, restaurantOwnerId, `${de}T00:00:00-03:00`, `${ate}T23:59:59.999-03:00`);
  const produtosOrdenados = [...metricas.produtos].sort((a, b) => (b.margem ?? -Infinity) - (a.margem ?? -Infinity));

  return (
    <div>
      <Link href="/restaurante/gestao" className="text-sm text-amber-700 underline underline-offset-2">
        ← Gestão
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-stone-900">Margem e CMV</h1>
      <p className="mt-1 text-sm text-stone-600">
        CMV calculado pela ficha técnica de cada prato, usando o custo do ingrediente vigente na data de cada
        venda (não o custo de hoje).
      </p>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-white p-4">
        <label className="text-sm text-stone-600">
          <span className="mb-1 block text-xs text-stone-500">De</span>
          <input name="de" type="date" defaultValue={de} max={hojeSP()} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm text-stone-600">
          <span className="mb-1 block text-xs text-stone-500">Até</span>
          <input name="ate" type="date" defaultValue={ate} max={hojeSP()} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        </label>
        <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
          Atualizar
        </button>
      </form>

      {metricas.cmvComDadosParciais && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Algum produto vendido não tem ficha técnica completa (ingrediente sem custo cadastrado) — o CMV e o
          lucro estimado abaixo não incluem esses itens, então ficam um pouco menores do que a realidade.
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Receita</p>
          <p className="mt-1 text-xl font-bold text-stone-900">{formatReal(metricas.receita)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">CMV</p>
          <p className="mt-1 text-xl font-bold text-red-600">{formatReal(metricas.cmv)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Margem (receita − CMV)</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{formatReal(metricas.margem)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-stone-900 p-4">
          <p className="text-sm text-stone-300">Lucro estimado</p>
          <p className={`mt-1 text-xl font-bold ${metricas.lucroEstimado >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {formatReal(metricas.lucroEstimado)}
          </p>
          <p className="mt-1 text-xs text-stone-400">Margem − {formatReal(metricas.custosFixosNoPeriodo)} de custos fixos rateados</p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="font-semibold text-stone-900">Margem por prato</h2>
        <div className="mt-2 space-y-2">
          {produtosOrdenados.map((p) => (
            <div key={p.productId} className="rounded-lg border border-stone-200 bg-white p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-stone-900">{p.nome}</span>
                <span className="text-stone-500">{p.quantidade}x</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-stone-500">
                <span>Receita {formatReal(p.receita)}</span>
                {p.cmv != null ? (
                  <span>
                    CMV {formatReal(p.cmv)} · Margem {formatReal(p.margem!)} ({formatPercent(p.margemPercentual!)})
                  </span>
                ) : (
                  <span className="text-amber-700">Sem ficha técnica completa</span>
                )}
              </div>
            </div>
          ))}
          {produtosOrdenados.length === 0 && <p className="text-sm text-stone-500">Nenhuma venda no período.</p>}
        </div>
      </div>
    </div>
  );
}

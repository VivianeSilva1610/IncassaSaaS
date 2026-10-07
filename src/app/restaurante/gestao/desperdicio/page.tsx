import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { calcularDesperdicio } from "@/lib/delivery/gestao";

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function hojeSP(): string {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return `${partes.find((p) => p.type === "year")!.value}-${partes.find((p) => p.type === "month")!.value}-${partes.find((p) => p.type === "day")!.value}`;
}

function inicioMesSP(): string {
  return `${hojeSP().slice(0, 7)}-01`;
}

export default async function GestaoDesperdicioPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string }>;
}) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription("gestao");
  const params = await searchParams;
  const de = /^\d{4}-\d{2}-\d{2}$/.test(params.de ?? "") ? params.de! : inicioMesSP();
  const ate = /^\d{4}-\d{2}-\d{2}$/.test(params.ate ?? "") ? params.ate! : hojeSP();

  const desperdicio = await calcularDesperdicio(supabase, restaurantOwnerId, `${de}T00:00:00-03:00`, `${ate}T23:59:59.999-03:00`);

  return (
    <div>
      <Link href="/restaurante/gestao" className="text-sm text-amber-700 underline underline-offset-2">
        ← Gestão
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-stone-900">Desperdício</h1>
      <p className="mt-1 text-sm text-stone-600">
        Baseado nos movimentos de estoque marcados como &quot;Perda/desperdício&quot; — lançados direto em
        Produtos ou gerados pelo Inventário quando a contagem física dá menos do que o sistema esperava.
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

      {desperdicio.valorComDadosParciais && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Algum ingrediente perdido não tinha custo cadastrado na data — o valor estimado abaixo fica menor
          do que a perda real.
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Valor estimado perdido</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{formatReal(desperdicio.valorTotalEstimado)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Registros de perda no período</p>
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
        {desperdicio.porIngrediente.length === 0 && <p className="text-sm text-stone-500">Nenhuma perda registrada no período.</p>}
      </div>
    </div>
  );
}

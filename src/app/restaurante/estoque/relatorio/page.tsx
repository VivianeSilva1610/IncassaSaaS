import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";

export default async function EstoqueRelatorioPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; qtd?: string }>;
}) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();
  const { count } = await supabase
    .from("del_ingredients")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", restaurantOwnerId);

  const params = await searchParams;
  const periodo = params.periodo === "anual" ? "anual" : "mensal";
  const qtd = Number(params.qtd) || (periodo === "anual" ? 5 : 12);

  return (
    <div>
      <Link href="/restaurante/estoque" className="text-sm text-amber-700 underline underline-offset-2">
        ← Estoque
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-stone-900">Relatório de estoque</h1>
      <p className="mt-1 text-sm text-stone-600">
        Quantidade final de cada um dos {count ?? 0} produtos ao fim de cada período, mais entradas, saídas e
        ajustes registrados nele. Reconstruído a partir do histórico de movimentos — não é um snapshot salvo, é
        calculado na hora.
      </p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-white p-4">
        <label className="text-sm text-stone-600">
          <span className="mb-1 block text-xs text-stone-500">Período</span>
          <select name="periodo" defaultValue={periodo} className="rounded-md border border-stone-300 px-3 py-2 text-sm">
            <option value="mensal">Mensal</option>
            <option value="anual">Anual</option>
          </select>
        </label>
        <label className="text-sm text-stone-600">
          <span className="mb-1 block text-xs text-stone-500">Quantos períodos (até hoje)</span>
          <input
            name="qtd"
            type="number"
            min="1"
            max={periodo === "anual" ? 20 : 60}
            defaultValue={qtd}
            className="w-24 rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
          Atualizar
        </button>
      </form>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={`/api/restaurante/export-estoque?formato=csv&periodo=${periodo}&qtd=${qtd}`}
          className="rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98]"
        >
          Baixar CSV
        </a>
        <a
          href={`/api/restaurante/export-estoque?formato=excel&periodo=${periodo}&qtd=${qtd}`}
          className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition-transform hover:bg-emerald-600 active:scale-[0.98]"
        >
          Baixar Excel (.xlsx)
        </a>
      </div>

      <p className="mt-4 text-xs text-stone-500">
        O custo unitário usado pra calcular o valor em estoque é o atual — não guardamos o custo histórico de cada
        período.
      </p>
    </div>
  );
}

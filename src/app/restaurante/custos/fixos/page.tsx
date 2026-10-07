import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { addFixedCost, deleteFixedCost } from "@/app/restaurante/actions";

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function CustosFixosPage() {
  const { supabase } = await requireRestaurantSubscription("custos");

  const { data: fixedCosts } = await supabase.from("del_fixed_costs").select("*").order("created_at");
  const totalCustosFixos = (fixedCosts ?? []).reduce((sum, c) => sum + Number(c.valor_mensal), 0);

  return (
    <div>
      <Link href="/restaurante/custos" className="text-sm text-amber-700 underline underline-offset-2">
        ← Custos
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">Custos fixos mensais</h1>
      <p className="mt-1 text-sm text-stone-600">Aluguel, contas, internet, MEI, etc. — some tudo por mês.</p>

      <form action={addFixedCost} className="mt-4 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
        <input name="descricao" required placeholder="Descrição (ex: Aluguel)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="valor_mensal" type="number" step="0.01" min="0" required placeholder="Valor mensal (R$)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-2">
          Adicionar custo fixo
        </button>
      </form>

      <div className="mt-3 space-y-1.5">
        {(fixedCosts ?? []).map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
            <span>{c.descricao} — {formatReal(Number(c.valor_mensal))}</span>
            <form action={deleteFixedCost.bind(null, c.id)}>
              <button type="submit" className="text-xs text-red-600 hover:underline">Excluir</button>
            </form>
          </div>
        ))}
        {(fixedCosts ?? []).length === 0 && <p className="text-sm text-stone-500">Nenhum custo fixo cadastrado ainda.</p>}
      </div>
      <p className="mt-2 text-sm font-medium text-stone-900">Total de custos fixos por mês: {formatReal(totalCustosFixos)}</p>
    </div>
  );
}

import { requireRestaurantSubscription } from "@/lib/subscription";
import { addContaAPagar, updateContaAPagar, marcarContaAPagarPaga, deleteContaAPagar } from "@/app/restaurante/actions";
import { getUrgency, urgencyEmoji } from "@/lib/urgency";

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function ContasAPagarPage() {
  const { supabase, restaurantOwnerId, isGerente } = await requireRestaurantSubscription("financeiro");

  const { data: contas } = await supabase
    .from("del_contas_a_pagar")
    .select("*")
    .eq("owner_id", restaurantOwnerId)
    .order("data_vencimento");

  const anoMesAtual = new Date().toISOString().slice(0, 7);
  const totalMes = (contas ?? [])
    .filter((c) => c.status === "a_pagar" && c.data_vencimento.startsWith(anoMesAtual))
    .reduce((sum, c) => sum + Number(c.valor), 0);
  const totalAberto = (contas ?? [])
    .filter((c) => c.status === "a_pagar")
    .reduce((sum, c) => sum + Number(c.valor), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Contas a pagar</h1>
      <p className="mt-1 text-sm text-stone-600">
        Fornecedores e outras contas que você ainda precisa pagar — pra saber quanto realmente vai sobrar no fim do
        mês. É uma estimativa que você mesmo lança; não substitui o contador.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Total a pagar este mês</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{formatReal(totalMes)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Total em aberto (todos os vencimentos)</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{formatReal(totalAberto)}</p>
        </div>
      </div>

      {isGerente && (
        <form action={addContaAPagar} className="mt-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
          <input name="fornecedor" required placeholder="Fornecedor" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="descricao" placeholder="Descrição (opcional)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="valor" type="number" step="0.01" min="0" required placeholder="Valor (R$)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <label className="text-sm text-stone-600">
            <span className="mb-1 block text-xs text-stone-500">Vencimento</span>
            <input name="data_vencimento" type="date" required className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
          </label>
          <button
            type="submit"
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-2"
          >
            Lançar conta
          </button>
        </form>
      )}

      <div className="mt-6 space-y-2">
        {(contas ?? []).map((c) => (
          <div key={c.id} className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-stone-900">
                  {c.status === "a_pagar" && urgencyEmoji[getUrgency(c.data_vencimento)]} {c.fornecedor}
                  {c.status === "paga" && " ✅"}
                  {c.descricao && <span className="font-normal text-stone-400"> — {c.descricao}</span>}
                </p>
                <p className="text-sm text-stone-500">
                  {formatReal(Number(c.valor))} · vence {c.data_vencimento}
                </p>
              </div>
              {isGerente && (
                <div className="flex items-center gap-3">
                  <details className="relative">
                    <summary className="cursor-pointer list-none text-xs text-amber-700 hover:underline">Editar</summary>
                    <form
                      action={updateContaAPagar.bind(null, c.id)}
                      className="absolute right-0 z-10 mt-2 grid w-72 gap-2 rounded-lg border border-stone-200 bg-white p-3 shadow-lg"
                    >
                      <input name="fornecedor" required defaultValue={c.fornecedor} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                      <input name="descricao" defaultValue={c.descricao ?? ""} placeholder="Descrição (opcional)" className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                      <input name="valor" type="number" step="0.01" min="0" required defaultValue={c.valor} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                      <label className="text-xs text-stone-500">
                        Vencimento
                        <input name="data_vencimento" type="date" required defaultValue={c.data_vencimento} className="mt-1 w-full rounded-md border border-stone-300 px-2 py-1.5 text-sm text-stone-900" />
                      </label>
                      <button type="submit" className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-700">
                        Salvar
                      </button>
                    </form>
                  </details>
                  {c.status === "a_pagar" && (
                    <form action={marcarContaAPagarPaga.bind(null, c.id)}>
                      <button type="submit" className="text-xs text-emerald-700 hover:underline">Marcar paga</button>
                    </form>
                  )}
                  <form action={deleteContaAPagar.bind(null, c.id)}>
                    <button type="submit" className="text-xs text-red-600 hover:underline">Excluir</button>
                  </form>
                </div>
              )}
            </div>
          </div>
        ))}
        {(contas ?? []).length === 0 && <p className="text-sm text-stone-500">Nenhuma conta lançada ainda.</p>}
      </div>
    </div>
  );
}

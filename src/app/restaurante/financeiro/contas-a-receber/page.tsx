import { requireRestaurantSubscription } from "@/lib/subscription";
import { addContaAReceber, updateContaAReceber, marcarContaAReceberPaga, deleteContaAReceber } from "@/app/restaurante/actions";
import { SollecitaButtonRestaurante } from "@/components/SollecitaButtonRestaurante";
import { getUrgency, urgencyEmoji } from "@/lib/urgency";

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function ContasAReceberPage() {
  const { supabase, restaurantOwnerId, isGerente } = await requireRestaurantSubscription();

  const { data: contas } = await supabase
    .from("del_contas_a_receber")
    .select("*")
    .eq("owner_id", restaurantOwnerId)
    .order("data_vencimento");

  const totalAberto = (contas ?? [])
    .filter((c) => c.status === "aberta")
    .reduce((sum, c) => sum + Number(c.valor), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Contas a receber</h1>
      <p className="mt-1 text-sm text-stone-600">
        Pedidos vendidos a prazo. Pedidos lançados em Vendas com &quot;a prazo&quot; marcado caem aqui
        automaticamente — você também pode lançar um na mão.
      </p>

      <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4">
        <p className="text-sm text-stone-500">Total em aberto</p>
        <p className="mt-1 text-2xl font-bold text-stone-900">{formatReal(totalAberto)}</p>
      </div>

      {isGerente && (
        <form action={addContaAReceber} className="mt-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
          <input name="cliente_nome" required placeholder="Cliente" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="cliente_telefone" placeholder="Telefone (opcional)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
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
                  {c.status === "aberta" && urgencyEmoji[getUrgency(c.data_vencimento)]} {c.cliente_nome}
                  {c.status === "paga" && " ✅"}
                </p>
                <p className="text-sm text-stone-500">
                  {formatReal(Number(c.valor))} · vence {c.data_vencimento}
                  {c.cliente_telefone && ` · ${c.cliente_telefone}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {c.status === "aberta" && <SollecitaButtonRestaurante contaId={c.id} />}
                {isGerente && (
                  <>
                    <details className="relative">
                      <summary className="cursor-pointer list-none text-xs text-amber-700 hover:underline">Editar</summary>
                      <form
                        action={updateContaAReceber.bind(null, c.id)}
                        className="absolute right-0 z-10 mt-2 grid w-72 gap-2 rounded-lg border border-stone-200 bg-white p-3 shadow-lg"
                      >
                        <input name="cliente_nome" required defaultValue={c.cliente_nome} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                        <input name="cliente_telefone" defaultValue={c.cliente_telefone ?? ""} placeholder="Telefone (opcional)" className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
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
                    {c.status === "aberta" && (
                      <form action={marcarContaAReceberPaga.bind(null, c.id)}>
                        <button type="submit" className="text-xs text-emerald-700 hover:underline">Marcar paga</button>
                      </form>
                    )}
                    <form action={deleteContaAReceber.bind(null, c.id)}>
                      <button type="submit" className="text-xs text-red-600 hover:underline">Excluir</button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {(contas ?? []).length === 0 && <p className="text-sm text-stone-500">Nenhuma conta lançada ainda.</p>}
      </div>
    </div>
  );
}

import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { realizarInventario } from "@/app/restaurante/actions";

export default async function InventarioPage() {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription("estoque");

  const [{ data: ingredientes }, { data: inventariosAnteriores }] = await Promise.all([
    supabase.from("del_ingredients").select("id, codigo, nome, unidade, quantidade_atual").eq("owner_id", restaurantOwnerId).order("nome"),
    supabase.from("del_inventarios").select("id, created_at, realizado_por_email, observacao").eq("owner_id", restaurantOwnerId).order("created_at", { ascending: false }).limit(10),
  ]);

  return (
    <div>
      <Link href="/restaurante/estoque" className="text-sm text-amber-700 underline underline-offset-2">
        ← Estoque
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-stone-900">Inventário</h1>
      <p className="mt-1 text-sm text-stone-600">
        Conte o que tem fisicamente de cada produto. Deixe em branco o que não quer conferir agora — só os
        preenchidos entram na contagem. Diferença pra menos vira perda/desperdício; pra mais vira ajuste.
      </p>

      <form action={realizarInventario} className="mt-6">
        <input name="observacao" placeholder="Observação (opcional)" className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs text-stone-500">
                <th className="py-2 pr-3">Produto</th>
                <th className="py-2 pr-3">No sistema</th>
                <th className="py-2 pr-3">Contagem física</th>
              </tr>
            </thead>
            <tbody>
              {(ingredientes ?? []).map((i) => (
                <tr key={i.id} className="border-b border-stone-100">
                  <td className="py-2 pr-3">
                    <span className="text-stone-400">{i.codigo}</span> {i.nome}
                  </td>
                  <td className="py-2 pr-3 text-stone-600">
                    {Number(i.quantidade_atual)} {i.unidade}
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      name={`contagem_${i.id}`}
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="—"
                      className="w-28 rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                    />
                  </td>
                </tr>
              ))}
              {(ingredientes ?? []).length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-stone-500">
                    Nenhum produto cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <button type="submit" className="mt-4 rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98]">
          Registrar contagem
        </button>
      </form>

      {(inventariosAnteriores ?? []).length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold text-stone-900">Inventários anteriores</h2>
          <div className="mt-2 space-y-2">
            {(inventariosAnteriores ?? []).map((inv) => (
              <Link
                key={inv.id}
                href={`/restaurante/estoque/inventario/${inv.id}`}
                className="block rounded-lg border border-stone-200 bg-white p-3 text-sm hover:border-amber-300"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-stone-900">{new Date(inv.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span>
                  <span className="text-xs text-stone-400">{inv.realizado_por_email}</span>
                </div>
                {inv.observacao && <p className="mt-0.5 text-xs text-stone-500">{inv.observacao}</p>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { requireRestaurantSubscription } from "@/lib/subscription";
import { addIngredient, deleteIngredient, addStockMovement, registrarCompraFornecedor } from "@/app/restaurante/actions";

export default async function EstoquePage() {
  const { supabase } = await requireRestaurantSubscription();

  const { data: ingredients } = await supabase
    .from("del_ingredients")
    .select("*")
    .order("nome");

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Estoque</h1>
      <p className="mt-1 text-sm text-stone-600">
        Ingredientes e matérias-primas. Registre cada entrada ou saída para manter a quantidade atualizada.
      </p>

      <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h2 className="font-semibold text-stone-900">Compra de fornecedor</h2>
        <p className="mt-1 text-xs text-stone-600">
          Escolha o produto já cadastrado para só somar ao estoque, ou deixe em &quot;Produto novo&quot; para cadastrar
          com um código novo automaticamente.
        </p>
        <form action={registrarCompraFornecedor} className="mt-3 grid gap-2 sm:grid-cols-2">
          <select name="ingredient_id" className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2">
            <option value="">➕ Produto novo (gera código automático)</option>
            {(ingredients ?? []).map((i) => (
              <option key={i.id} value={i.id}>
                {i.codigo} — {i.nome} ({Number(i.quantidade_atual)} {i.unidade} em estoque)
              </option>
            ))}
          </select>
          <input name="nome" placeholder="Nome (só se for produto novo)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <select name="unidade" className="rounded-md border border-stone-300 px-3 py-2 text-sm">
            <option value="kg">kg</option>
            <option value="l">l</option>
            <option value="un">unidade</option>
          </select>
          <input
            name="quantidade"
            type="number"
            step="0.001"
            min="0"
            required
            placeholder="Quantidade comprada"
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
          <input
            name="custo_unitario"
            type="number"
            step="0.01"
            min="0"
            placeholder="Custo por unidade R$ (opcional)"
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
          <input
            name="fornecedor"
            placeholder="Fornecedor (opcional)"
            className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <button
            type="submit"
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-amber-700 active:scale-[0.98] sm:col-span-2"
          >
            Registrar compra
          </button>
        </form>
      </section>

      <form action={addIngredient} className="mt-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
        <input name="nome" required placeholder="Nome do ingrediente" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <select name="unidade" className="rounded-md border border-stone-300 px-3 py-2 text-sm">
          <option value="kg">kg</option>
          <option value="l">l</option>
          <option value="un">unidade</option>
        </select>
        <input
          name="quantidade_atual"
          type="number"
          step="0.001"
          min="0"
          placeholder="Quantidade inicial"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <input
          name="estoque_minimo"
          type="number"
          step="0.001"
          min="0"
          placeholder="Estoque mínimo (opcional)"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <input
          name="custo_unitario"
          type="number"
          step="0.01"
          min="0"
          placeholder="Custo por unidade R$ (opcional)"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2"
        />
        <button
          type="submit"
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-2"
        >
          Adicionar ingrediente
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {(ingredients ?? []).map((i) => {
          const emFalta = i.estoque_minimo != null && Number(i.quantidade_atual) <= Number(i.estoque_minimo);
          return (
            <div key={i.id} className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-stone-900">
                    {emFalta && "⚠️ "}
                    <span className="text-stone-400">{i.codigo}</span> {i.nome}
                  </p>
                  <p className="text-sm text-stone-500">
                    {Number(i.quantidade_atual)} {i.unidade}
                    {i.estoque_minimo != null && ` · mínimo ${Number(i.estoque_minimo)} ${i.unidade}`}
                    {i.custo_unitario != null && ` · R$${Number(i.custo_unitario).toFixed(2)}/${i.unidade}`}
                  </p>
                </div>
                <form action={deleteIngredient.bind(null, i.id)}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">
                    Excluir
                  </button>
                </form>
              </div>

              <form action={addStockMovement} className="mt-3 flex flex-wrap items-end gap-2 border-t border-stone-100 pt-3">
                <input type="hidden" name="ingredient_id" value={i.id} />
                <select name="tipo" className="rounded-md border border-stone-300 px-2 py-1.5 text-xs">
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                  <option value="ajuste">Ajuste</option>
                </select>
                <input
                  name="quantidade"
                  type="number"
                  step="0.001"
                  min="0"
                  required
                  placeholder="Quantidade"
                  className="w-24 rounded-md border border-stone-300 px-2 py-1.5 text-xs"
                />
                <input
                  name="motivo"
                  placeholder="Motivo (opcional)"
                  className="rounded-md border border-stone-300 px-2 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  className="rounded-md bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-200"
                >
                  Registrar movimento
                </button>
              </form>
            </div>
          );
        })}
        {(ingredients ?? []).length === 0 && <p className="text-sm text-stone-500">Nenhum ingrediente ainda.</p>}
      </div>
    </div>
  );
}

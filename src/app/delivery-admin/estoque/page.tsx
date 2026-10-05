import { requireDeliveryAdmin } from "@/lib/delivery/auth";
import { addIngredient, deleteIngredient, addStockMovement } from "@/app/delivery-admin/actions";

export default async function EstoquePage() {
  const { supabase } = await requireDeliveryAdmin();

  const { data: ingredients } = await supabase
    .from("del_ingredients")
    .select("*")
    .order("nome");

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Magazzino</h1>
      <p className="mt-1 text-sm text-stone-600">
        Ingredienti e materie prime. Registra ogni entrata o uscita per mantenere la quantità aggiornata.
      </p>

      <form action={addIngredient} className="mt-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
        <input name="nome" required placeholder="Nome ingrediente" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <select name="unidade" className="rounded-md border border-stone-300 px-3 py-2 text-sm">
          <option value="kg">kg</option>
          <option value="l">l</option>
          <option value="un">unità</option>
        </select>
        <input
          name="quantidade_atual"
          type="number"
          step="0.001"
          min="0"
          placeholder="Quantità iniziale"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <input
          name="estoque_minimo"
          type="number"
          step="0.001"
          min="0"
          placeholder="Scorta minima (opzionale)"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-2"
        >
          Aggiungi ingrediente
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {(ingredients ?? []).map((i) => {
          const scarso = i.estoque_minimo != null && Number(i.quantidade_atual) <= Number(i.estoque_minimo);
          return (
            <div key={i.id} className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-stone-900">
                    {scarso && "⚠️ "}
                    {i.nome}
                  </p>
                  <p className="text-sm text-stone-500">
                    {Number(i.quantidade_atual)} {i.unidade}
                    {i.estoque_minimo != null && ` · minimo ${Number(i.estoque_minimo)} ${i.unidade}`}
                  </p>
                </div>
                <form action={deleteIngredient.bind(null, i.id)}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">
                    Elimina
                  </button>
                </form>
              </div>

              <form action={addStockMovement} className="mt-3 flex flex-wrap items-end gap-2 border-t border-stone-100 pt-3">
                <input type="hidden" name="ingredient_id" value={i.id} />
                <select name="tipo" className="rounded-md border border-stone-300 px-2 py-1.5 text-xs">
                  <option value="entrada">Entrata</option>
                  <option value="saida">Uscita</option>
                  <option value="ajuste">Aggiustamento</option>
                </select>
                <input
                  name="quantidade"
                  type="number"
                  step="0.001"
                  min="0"
                  required
                  placeholder="Quantità"
                  className="w-24 rounded-md border border-stone-300 px-2 py-1.5 text-xs"
                />
                <input
                  name="motivo"
                  placeholder="Motivo (opzionale)"
                  className="rounded-md border border-stone-300 px-2 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  className="rounded-md bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-200"
                >
                  Registra movimento
                </button>
              </form>
            </div>
          );
        })}
        {(ingredients ?? []).length === 0 && <p className="text-sm text-stone-500">Nessun ingrediente ancora.</p>}
      </div>
    </div>
  );
}

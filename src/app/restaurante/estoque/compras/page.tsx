import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { registrarCompraFornecedor } from "@/app/restaurante/actions";

export default async function EstoqueComprasPage() {
  const { supabase } = await requireRestaurantSubscription();
  const { data: todosIngredientes } = await supabase.from("del_ingredients").select("*").order("nome");

  return (
    <div>
      <Link href="/restaurante/estoque" className="text-sm text-amber-700 underline underline-offset-2">
        ← Estoque
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-stone-900">Compra de fornecedor</h1>
      <p className="mt-1 text-sm text-stone-600">
        Escolha o produto já cadastrado para só somar ao estoque, ou deixe em &quot;Produto novo&quot; para cadastrar
        com um código novo automaticamente.
      </p>

      <form action={registrarCompraFornecedor} className="mt-6 grid gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:grid-cols-2">
        <select name="ingredient_id" className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2">
          <option value="">➕ Produto novo (gera código automático)</option>
          {(todosIngredientes ?? []).map((i) => (
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

      <p className="mt-4 text-xs text-stone-500">
        Pra importar uma NF-e real de fornecedor (XML), use{" "}
        <Link href="/restaurante/estoque/compras-nfe" className="text-amber-700 underline underline-offset-2">
          Compras e fornecedores
        </Link>
        .
      </p>
    </div>
  );
}

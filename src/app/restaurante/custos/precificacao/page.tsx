import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { updatePricingConfig, addProductIngredient, deleteProductIngredient } from "@/app/restaurante/actions";
import { calculateProductCost } from "@/lib/delivery/pricing";
import { IngredientePicker } from "./ingrediente-picker";

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function CustosPrecificacaoPage() {
  const { supabase } = await requireRestaurantSubscription("custos");

  const [{ data: fixedCosts }, { data: pricingConfig }, { data: products }, { data: ingredients }, { data: productIngredients }] =
    await Promise.all([
      supabase.from("del_fixed_costs").select("*"),
      supabase.from("del_pricing_config").select("*").maybeSingle(),
      supabase.from("del_products").select("*").order("nome"),
      supabase.from("del_ingredients").select("*").order("nome"),
      supabase.from("del_product_ingredients").select("*, del_ingredients(nome, unidade, custo_unitario)"),
    ]);

  const totalCustosFixos = (fixedCosts ?? []).reduce((sum, c) => sum + Number(c.valor_mensal), 0);
  const volumeMensalEstimado = Number(pricingConfig?.volume_mensal_estimado ?? 0);
  const margemDesejada = Number(pricingConfig?.margem_desejada ?? 0.3);

  return (
    <div>
      <Link href="/restaurante/custos" className="text-sm text-amber-700 underline underline-offset-2">
        ← Custos
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">Precificação</h1>

      <section className="mt-4">
        <h2 className="font-semibold text-stone-900">Parâmetros de precificação</h2>
        <form action={updatePricingConfig} className="mt-2 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
          <label className="text-sm text-stone-600">
            <span className="mb-1 block text-xs text-stone-500">Quantas marmitas você estima vender por mês?</span>
            <input
              name="volume_mensal_estimado"
              type="number"
              step="1"
              min="0"
              defaultValue={volumeMensalEstimado}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-stone-600">
            <span className="mb-1 block text-xs text-stone-500">Margem de lucro desejada sobre o preço (%)</span>
            <input
              name="margem_desejada"
              type="number"
              step="1"
              min="0"
              max="95"
              defaultValue={(margemDesejada * 100).toFixed(0)}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-2">
            Salvar parâmetros
          </button>
        </form>
        {volumeMensalEstimado === 0 && (
          <p className="mt-2 text-sm text-amber-700">
            Defina um volume mensal estimado para que o custo fixo rateado por marmita entre no cálculo.
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-stone-900">Ficha técnica e preço sugerido por prato</h2>
        <div className="mt-2 space-y-4">
          {(products ?? []).map((p) => {
            const itensDoProduto = (productIngredients ?? []).filter((pi) => pi.product_id === p.id);
            const ingredientesCalc = itensDoProduto.map((pi) => ({
              quantidade_necessaria: Number(pi.quantidade_necessaria),
              custo_unitario: pi.del_ingredients?.custo_unitario != null ? Number(pi.del_ingredients.custo_unitario) : null,
            }));
            const { custoVariavel, custoFixoRateado, custoTotal, precoSugerido } = calculateProductCost({
              ingredientes: ingredientesCalc,
              totalCustosFixos,
              volumeMensalEstimado,
              margemDesejada,
            });
            const precoAtual = Number(p.preco);
            const margemAtual = precoAtual > 0 ? (precoAtual - custoTotal) / precoAtual : 0;

            return (
              <div key={p.id} className={`rounded-xl border bg-white p-4 ${itensDoProduto.length === 0 ? "border-amber-300" : "border-stone-200"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-stone-900">{p.nome}</h3>
                  {itensDoProduto.length === 0 && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">⚠ Sem ficha técnica</span>
                  )}
                </div>

                <div className="mt-2 space-y-1">
                  {itensDoProduto.map((pi) => (
                    <div key={pi.id} className="flex items-center justify-between text-sm text-stone-600">
                      <span>
                        {Number(pi.quantidade_necessaria)} {pi.del_ingredients?.unidade} de {pi.del_ingredients?.nome}
                        {pi.del_ingredients?.custo_unitario == null && (
                          <span className="ml-1 text-amber-600">(sem custo definido no estoque)</span>
                        )}
                      </span>
                      <form action={deleteProductIngredient.bind(null, pi.id)}>
                        <button type="submit" className="text-xs text-red-600 hover:underline">Remover</button>
                      </form>
                    </div>
                  ))}
                  {itensDoProduto.length === 0 && <p className="text-sm text-amber-700">Nenhum ingrediente cadastrado — o custo variável abaixo está zerado e o preço sugerido não reflete o custo real deste item.</p>}
                </div>

                <form action={addProductIngredient} className="mt-3 flex flex-wrap items-end gap-2 border-t border-stone-100 pt-3">
                  <input type="hidden" name="product_id" value={p.id} />
                  <IngredientePicker ingredients={(ingredients ?? []).map(({ id, nome }) => ({ id, nome }))} name="ingredient_id" />
                  <input
                    name="quantidade_necessaria"
                    type="number"
                    step="0.001"
                    min="0"
                    required
                    placeholder="Qtd. por marmita"
                    className="w-32 rounded-md border border-stone-300 px-2 py-1.5 text-xs"
                  />
                  <button type="submit" className="rounded-md bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-200">
                    Adicionar à ficha técnica
                  </button>
                </form>

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-stone-100 pt-3 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-stone-500">Custo variável</p>
                    <p className="font-medium text-stone-900">{formatReal(custoVariavel)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Custo fixo rateado</p>
                    <p className="font-medium text-stone-900">{formatReal(custoFixoRateado)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Custo total</p>
                    <p className="font-medium text-stone-900">{formatReal(custoTotal)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Preço sugerido</p>
                    <p className="font-semibold text-emerald-700">{formatReal(precoSugerido)}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-stone-500">
                  Preço atual no menu: {formatReal(precoAtual)}
                  {precoAtual > 0 && ` · margem atual: ${(margemAtual * 100).toFixed(0)}%`}
                </p>
              </div>
            );
          })}
          {(products ?? []).length === 0 && (
            <p className="text-sm text-stone-500">Cadastre pratos no menu (em Vendas) para ver a ficha técnica aqui.</p>
          )}
        </div>
      </section>
    </div>
  );
}

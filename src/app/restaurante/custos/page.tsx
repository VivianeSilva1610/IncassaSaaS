import { requireRestaurantSubscription } from "@/lib/subscription";
import {
  addFixedCost,
  deleteFixedCost,
  updatePricingConfig,
  addProductIngredient,
  deleteProductIngredient,
  addZonaEntrega,
  toggleZonaEntregaAtivo,
  deleteZonaEntrega,
} from "@/app/restaurante/actions";
import { calculateProductCost } from "@/lib/delivery/pricing";

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function CustosPage() {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();

  const [{ data: fixedCosts }, { data: pricingConfig }, { data: products }, { data: ingredients }, { data: productIngredients }, { data: zonasEntrega }] =
    await Promise.all([
      supabase.from("del_fixed_costs").select("*").order("created_at"),
      supabase.from("del_pricing_config").select("*").eq("owner_id", restaurantOwnerId).maybeSingle(),
      supabase.from("del_products").select("*").order("nome"),
      supabase.from("del_ingredients").select("*").order("nome"),
      supabase.from("del_product_ingredients").select("*, del_ingredients(nome, unidade, custo_unitario)"),
      supabase.from("del_zonas_entrega").select("*").order("distancia_km", { ascending: true, nullsFirst: false }),
    ]);

  const totalCustosFixos = (fixedCosts ?? []).reduce((sum, c) => sum + Number(c.valor_mensal), 0);
  const volumeMensalEstimado = Number(pricingConfig?.volume_mensal_estimado ?? 0);
  const margemDesejada = Number(pricingConfig?.margem_desejada ?? 0.3);
  const nomeNegocio = pricingConfig?.nome_negocio ?? "";

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Custos e preço sugerido</h1>

      <section className="mt-6">
        <h2 className="font-semibold text-stone-900">Nome do menu/negócio</h2>
        <p className="mt-1 text-sm text-stone-600">
          Ainda não decidiu o nome definitivo? Sem problema, pode trocar aqui a qualquer momento.
        </p>
        <form action={updatePricingConfig} className="mt-2 flex flex-wrap gap-2 rounded-xl border border-stone-200 bg-white p-4">
          <input type="hidden" name="volume_mensal_estimado" value={volumeMensalEstimado} />
          <input type="hidden" name="margem_desejada" value={(margemDesejada * 100).toFixed(0)} />
          <input
            name="nome_negocio"
            defaultValue={nomeNegocio}
            placeholder="Ex: Menu della Nonna"
            className="min-w-48 flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98]">
            Salvar nome
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-stone-900">Custos fixos mensais</h2>
        <p className="mt-1 text-sm text-stone-600">Aluguel, contas, internet, MEI, etc. — some tudo por mês.</p>
        <form action={addFixedCost} className="mt-2 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
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
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-stone-900">Taxa de entrega por bairro</h2>
        <p className="mt-1 text-sm text-stone-600">
          Cadastre os bairros que você atende (inicialmente até uns 30km) com a distância aproximada e a taxa.
          Deixe a taxa em 0 pra oferecer entrega grátis naquele bairro. Bairro fora dessa lista não aparece
          como opção pro cliente no site.
        </p>
        <form action={addZonaEntrega} className="mt-2 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-3">
          <input name="bairro" required placeholder="Nome do bairro" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="distancia_km" type="number" step="0.1" min="0" max="30" placeholder="Distância aprox. (km)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="taxa" type="number" step="0.01" min="0" required placeholder="Taxa (R$, 0 = grátis)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <button
            type="submit"
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-3"
          >
            Adicionar bairro
          </button>
        </form>
        <div className="mt-3 space-y-1.5">
          {(zonasEntrega ?? []).map((z) => (
            <div key={z.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
              <span className={z.ativo ? "text-stone-900" : "text-stone-400 line-through"}>
                {z.bairro}
                {z.distancia_km != null && ` — ~${Number(z.distancia_km)}km`}
                {" — "}
                {Number(z.taxa) === 0 ? "Grátis" : formatReal(Number(z.taxa))}
              </span>
              <div className="flex items-center gap-3">
                <form action={toggleZonaEntregaAtivo.bind(null, z.id, z.ativo)}>
                  <button type="submit" className="text-xs text-amber-700 hover:underline">
                    {z.ativo ? "Desativar" : "Ativar"}
                  </button>
                </form>
                <form action={deleteZonaEntrega.bind(null, z.id)}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">Excluir</button>
                </form>
              </div>
            </div>
          ))}
          {(zonasEntrega ?? []).length === 0 && <p className="text-sm text-stone-500">Nenhum bairro cadastrado ainda — a entrega no site fica indisponível até cadastrar pelo menos um.</p>}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-stone-900">Parâmetros de precificação</h2>
        <form action={updatePricingConfig} className="mt-2 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
          <input type="hidden" name="nome_negocio" value={nomeNegocio} />
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
              <div key={p.id} className="rounded-xl border border-stone-200 bg-white p-4">
                <h3 className="font-semibold text-stone-900">{p.nome}</h3>

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
                  {itensDoProduto.length === 0 && <p className="text-sm text-stone-500">Nenhum ingrediente na ficha técnica ainda.</p>}
                </div>

                <form action={addProductIngredient} className="mt-3 flex flex-wrap items-end gap-2 border-t border-stone-100 pt-3">
                  <input type="hidden" name="product_id" value={p.id} />
                  <select name="ingredient_id" required className="rounded-md border border-stone-300 px-2 py-1.5 text-xs">
                    <option value="">Ingrediente…</option>
                    {(ingredients ?? []).map((i) => (
                      <option key={i.id} value={i.id}>{i.nome}</option>
                    ))}
                  </select>
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

import Link from "next/link";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { updatePricingConfig, addProductIngredient, deleteProductIngredient } from "@/app/restaurante/actions";
import { calculateProductCost } from "@/lib/delivery/pricing";
import { IngredientePicker } from "./ingrediente-picker";

const CONTEUDO: Record<RestauranteLocale, {
  voltar: string; titulo: string; parametros: string; volumePergunta: string; margemPergunta: string;
  salvarParametros: string; definaVolume: string; fichaTecnica: string; custoPranzoCompleto: string;
  buscarPlaceholder: string; buscar: string; limparBusca: string; semFichaTecnica: string;
  semCustoDefinido: string; remover: string; nenhumIngrediente: string; qtdPorPorcao: string;
  adicionarFichaTecnica: string; custoVariavel: string; custoFixoRateado: string; custoTotal: string;
  precoSugerido: string; precoAtual: (valor: string) => string; margemAtual: (pct: string) => string;
  nenhumPratoEncontrado: (termo: string) => string; cadastrePratos: string;
}> = {
  "pt-BR": {
    voltar: "← Custos", titulo: "Precificação", parametros: "Parâmetros de precificação",
    volumePergunta: "Quantas marmitas você estima vender por mês?",
    margemPergunta: "Margem de lucro desejada sobre o preço (%)", salvarParametros: "Salvar parâmetros",
    definaVolume: "Defina um volume mensal estimado para que o custo fixo rateado por marmita entre no cálculo.",
    fichaTecnica: "Ficha técnica e preço sugerido por prato",
    custoPranzoCompleto: "Custo do Pranzo completo (tamanho + principal + acompanhamentos) →",
    buscarPlaceholder: "Buscar prato pelo nome…", buscar: "Buscar", limparBusca: "Limpar busca",
    semFichaTecnica: "⚠ Sem ficha técnica", semCustoDefinido: "(sem custo definido no estoque)",
    remover: "Remover", nenhumIngrediente: "Nenhum ingrediente cadastrado — o custo variável abaixo está zerado e o preço sugerido não reflete o custo real deste item.",
    qtdPorPorcao: "Qtd. por marmita", adicionarFichaTecnica: "Adicionar à ficha técnica",
    custoVariavel: "Custo variável", custoFixoRateado: "Custo fixo rateado", custoTotal: "Custo total",
    precoSugerido: "Preço sugerido", precoAtual: (valor) => `Preço atual no menu: ${valor}`,
    margemAtual: (pct) => `margem atual: ${pct}%`,
    nenhumPratoEncontrado: (termo) => `Nenhum prato encontrado para "${termo}".`,
    cadastrePratos: "Cadastre pratos no menu (em Vendas) para ver a ficha técnica aqui.",
  },
  it: {
    voltar: "← Costi", titulo: "Definizione prezzo", parametros: "Parametri di definizione prezzo",
    volumePergunta: "Quante porzioni stimi di vendere al mese?",
    margemPergunta: "Margine di profitto desiderato sul prezzo (%)", salvarParametros: "Salva parametri",
    definaVolume: "Definisci un volume mensile stimato perché il costo fisso ripartito per porzione entri nel calcolo.",
    fichaTecnica: "Scheda tecnica e prezzo suggerito per piatto",
    custoPranzoCompleto: "Costo del Pranzo completo (formato + principale + contorni) →",
    buscarPlaceholder: "Cerca piatto per nome…", buscar: "Cerca", limparBusca: "Pulisci ricerca",
    semFichaTecnica: "⚠ Senza scheda tecnica", semCustoDefinido: "(costo non definito nel magazzino)",
    remover: "Rimuovi", nenhumIngrediente: "Nessun ingrediente registrato — il costo variabile sotto è azzerato e il prezzo suggerito non riflette il costo reale di questo articolo.",
    qtdPorPorcao: "Quantità per porzione", adicionarFichaTecnica: "Aggiungi alla scheda tecnica",
    custoVariavel: "Costo variabile", custoFixoRateado: "Costo fisso ripartito", custoTotal: "Costo totale",
    precoSugerido: "Prezzo suggerito", precoAtual: (valor) => `Prezzo attuale nel menu: ${valor}`,
    margemAtual: (pct) => `margine attuale: ${pct}%`,
    nenhumPratoEncontrado: (termo) => `Nessun piatto trovato per "${termo}".`,
    cadastrePratos: "Registra piatti nel menu (in Vendite) per vedere qui la scheda tecnica.",
  },
};

export default async function CustosPrecificacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>;
}) {
  const { supabase, locale } = await requireRestaurantSubscription("custos");
  const t = CONTEUDO[locale];
  const formatReal = (value: number) => (locale === "it"
    ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value));
  const { busca } = await searchParams;
  const termo = (busca ?? "").trim();

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
  const produtosFiltrados = termo
    ? (products ?? []).filter((p) => p.nome.toLowerCase().includes(termo.toLowerCase()))
    : (products ?? []);

  return (
    <div>
      <Link href="/restaurante/custos" className="text-sm text-amber-700 underline underline-offset-2">
        {t.voltar}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">{t.titulo}</h1>

      <section className="mt-4">
        <h2 className="font-semibold text-stone-900">{t.parametros}</h2>
        <form action={updatePricingConfig} className="mt-2 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
          <label className="text-sm text-stone-600">
            <span className="mb-1 block text-xs text-stone-500">{t.volumePergunta}</span>
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
            <span className="mb-1 block text-xs text-stone-500">{t.margemPergunta}</span>
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
            {t.salvarParametros}
          </button>
        </form>
        {volumeMensalEstimado === 0 && (
          <p className="mt-2 text-sm text-amber-700">
            {t.definaVolume}
          </p>
        )}
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-stone-900">{t.fichaTecnica}</h2>
          <Link href="/restaurante/custos/precificacao/pranzo" className="text-sm text-amber-700 underline underline-offset-2">
            {t.custoPranzoCompleto}
          </Link>
        </div>

        <form method="get" className="mt-2 flex flex-wrap items-center gap-2">
          <input
            name="busca"
            defaultValue={termo}
            placeholder={t.buscarPlaceholder}
            className="min-w-56 flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
            {t.buscar}
          </button>
          {termo && (
            <a href="/restaurante/custos/precificacao" className="text-xs text-stone-500 hover:underline">
              {t.limparBusca}
            </a>
          )}
        </form>

        <div className="mt-3 space-y-4">
          {produtosFiltrados.map((p) => {
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
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{t.semFichaTecnica}</span>
                  )}
                </div>

                <div className="mt-2 space-y-1">
                  {itensDoProduto.map((pi) => (
                    <div key={pi.id} className="flex items-center justify-between text-sm text-stone-600">
                      <span>
                        {Number(pi.quantidade_necessaria)} {pi.del_ingredients?.unidade} de {pi.del_ingredients?.nome}
                        {pi.del_ingredients?.custo_unitario == null && (
                          <span className="ml-1 text-amber-600">{t.semCustoDefinido}</span>
                        )}
                      </span>
                      <form action={deleteProductIngredient.bind(null, pi.id)}>
                        <button type="submit" className="text-xs text-red-600 hover:underline">{t.remover}</button>
                      </form>
                    </div>
                  ))}
                  {itensDoProduto.length === 0 && <p className="text-sm text-amber-700">{t.nenhumIngrediente}</p>}
                </div>

                <form action={addProductIngredient} className="mt-3 flex flex-wrap items-end gap-2 border-t border-stone-100 pt-3">
                  <input type="hidden" name="product_id" value={p.id} />
                  <IngredientePicker ingredients={(ingredients ?? []).map(({ id, nome }) => ({ id, nome }))} name="ingredient_id" locale={locale} />
                  <input
                    name="quantidade_necessaria"
                    type="number"
                    step="0.001"
                    min="0"
                    required
                    placeholder={t.qtdPorPorcao}
                    className="w-32 rounded-md border border-stone-300 px-2 py-1.5 text-xs"
                  />
                  <button type="submit" className="rounded-md bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-200">
                    {t.adicionarFichaTecnica}
                  </button>
                </form>

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-stone-100 pt-3 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-stone-500">{t.custoVariavel}</p>
                    <p className="font-medium text-stone-900">{formatReal(custoVariavel)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">{t.custoFixoRateado}</p>
                    <p className="font-medium text-stone-900">{formatReal(custoFixoRateado)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">{t.custoTotal}</p>
                    <p className="font-medium text-stone-900">{formatReal(custoTotal)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">{t.precoSugerido}</p>
                    <p className="font-semibold text-emerald-700">{formatReal(precoSugerido)}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-stone-500">
                  {t.precoAtual(formatReal(precoAtual))}
                  {precoAtual > 0 && ` · ${t.margemAtual((margemAtual * 100).toFixed(0))}`}
                </p>
              </div>
            );
          })}
          {produtosFiltrados.length === 0 && (
            <p className="text-sm text-stone-500">
              {termo ? t.nenhumPratoEncontrado(termo) : t.cadastrePratos}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

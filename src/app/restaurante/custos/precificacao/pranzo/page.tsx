import Link from "next/link";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { PranzoCustoCalculator } from "./pranzo-calculator";

const CONTEUDO: Record<RestauranteLocale, { voltar: string; titulo: string; descricao: string }> = {
  "pt-BR": {
    voltar: "← Precificação", titulo: "Custo do Pranzo completo",
    descricao: "Monte uma combinação de tamanho + principal + acompanhamentos (do jeito que o cliente monta no site) e veja o custo e o preço sugerido do prato inteiro — não só de um ingrediente ou produto isolado.",
  },
  it: {
    voltar: "← Definizione prezzo", titulo: "Costo del Pranzo completo",
    descricao: "Componi una combinazione di formato + principale + contorni (come il cliente compone sul sito) e vedi il costo e il prezzo suggerito del piatto intero — non solo di un ingrediente o prodotto isolato.",
  },
};

export default async function CustoPranzoCompletoPage() {
  const { supabase, locale } = await requireRestaurantSubscription("custos");
  const t = CONTEUDO[locale];

  const [{ data: fixedCosts }, { data: pricingConfig }, { data: products }, { data: productIngredients }] =
    await Promise.all([
      supabase.from("del_fixed_costs").select("*"),
      supabase.from("del_pricing_config").select("*").maybeSingle(),
      supabase.from("del_products").select("*").in("categoria", ["tamanho", "principal", "prato", "acompanhamento"]).order("nome"),
      supabase.from("del_product_ingredients").select("product_id, quantidade_necessaria, del_ingredients(custo_unitario)"),
    ]);

  const totalCustosFixos = (fixedCosts ?? []).reduce((sum, c) => sum + Number(c.valor_mensal), 0);
  const volumeMensalEstimado = Number(pricingConfig?.volume_mensal_estimado ?? 0);
  const margemDesejada = Number(pricingConfig?.margem_desejada ?? 0.3);

  const tamanhos = (products ?? [])
    .filter((p) => p.categoria === "tamanho")
    .map((p) => ({ id: p.id, nome: p.nome, preco: Number(p.preco), maxAcompanhamentos: Number(p.max_acompanhamentos ?? 0) }));
  const principais = (products ?? [])
    .filter((p) => p.categoria === "principal" || p.categoria === "prato")
    .map((p) => ({ id: p.id, nome: p.nome }));
  const acompanhamentos = (products ?? [])
    .filter((p) => p.categoria === "acompanhamento")
    .map((p) => ({ id: p.id, nome: p.nome }));

  const fichaTecnicaPorProduto: Record<string, { quantidadeNecessaria: number; custoUnitario: number | null }[]> = {};
  for (const item of productIngredients ?? []) {
    const lista = fichaTecnicaPorProduto[item.product_id] ?? (fichaTecnicaPorProduto[item.product_id] = []);
    const ingrediente = Array.isArray(item.del_ingredients) ? item.del_ingredients[0] : item.del_ingredients;
    lista.push({
      quantidadeNecessaria: Number(item.quantidade_necessaria),
      custoUnitario: ingrediente?.custo_unitario != null ? Number(ingrediente.custo_unitario) : null,
    });
  }

  return (
    <div>
      <Link href="/restaurante/custos/precificacao" className="text-sm text-amber-700 underline underline-offset-2">
        {t.voltar}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {t.descricao}
      </p>

      <PranzoCustoCalculator
        tamanhos={tamanhos}
        principais={principais}
        acompanhamentos={acompanhamentos}
        fichaTecnicaPorProduto={fichaTecnicaPorProduto}
        totalCustosFixos={totalCustosFixos}
        volumeMensalEstimado={volumeMensalEstimado}
        margemDesejada={margemDesejada}
        locale={locale}
      />
    </div>
  );
}

import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { AutoRefresh } from "@/components/delivery/AutoRefresh";

function formatNumero(value: number, intlLocale: string) {
  return new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 3 }).format(value);
}

const CONTEUDO: Record<RestauranteLocale, {
  titulo: string; descricao: string; pratosPreparar: string; nenhumPedido: string;
  ingredientesNecessarios: string; ingredientesDescricao: string; estoqueInsuficiente: string;
  precisaTem: (necessario: string, unidade: string, atual: string) => string; nenhumIngrediente: string;
}> = {
  "pt-BR": {
    titulo: "Produção",
    descricao: "O que precisa ser preparado agora, somando todos os pedidos em aberto (novo + em preparo). Atualiza automaticamente a cada 30 segundos.",
    pratosPreparar: "Pratos a preparar", nenhumPedido: "Nenhum pedido em aberto no momento.",
    ingredientesNecessarios: "Ingredientes necessários",
    ingredientesDescricao: "Soma da ficha técnica de cada prato acima, comparada com o estoque atual.",
    estoqueInsuficiente: "Estoque insuficiente",
    precisaTem: (necessario, unidade, atual) => `precisa ${necessario} ${unidade} · tem ${atual} ${unidade}`,
    nenhumIngrediente: "Nenhum ingrediente a calcular — os pratos em aberto ainda não têm ficha técnica cadastrada, ou não há pedidos.",
  },
  it: {
    titulo: "Produzione",
    descricao: "Cosa va preparato adesso, sommando tutti gli ordini aperti (nuovo + in preparazione). Si aggiorna automaticamente ogni 30 secondi.",
    pratosPreparar: "Piatti da preparare", nenhumPedido: "Nessun ordine aperto al momento.",
    ingredientesNecessarios: "Ingredienti necessari",
    ingredientesDescricao: "Somma della scheda tecnica di ogni piatto sopra, confrontata con la scorta attuale.",
    estoqueInsuficiente: "Scorta insufficiente",
    precisaTem: (necessario, unidade, atual) => `serve ${necessario} ${unidade} · disponibile ${atual} ${unidade}`,
    nenhumIngrediente: "Nessun ingrediente da calcolare — i piatti aperti non hanno ancora una scheda tecnica registrata, oppure non ci sono ordini.",
  },
};

export default async function ProducaoPage() {
  const { supabase, locale } = await requireRestaurantSubscription("producao");
  const t = CONTEUDO[locale];
  const intlLocale = locale === "it" ? "it-IT" : "pt-BR";
  const numero = (value: number) => formatNumero(value, intlLocale);

  const { data: pedidos } = await supabase
    .from("del_orders")
    .select("id, status, del_order_items(product_id, quantidade, del_products(nome, categoria))")
    .in("status", ["novo", "em preparo"]);

  type ItemPedido = { product_id: string | null; quantidade: number; del_products: { nome: string; categoria: string } | { nome: string; categoria: string }[] | null };

  const itensAbertos = (pedidos ?? []).flatMap((p) => (p.del_order_items ?? []) as ItemPedido[]);

  const porProduto = new Map<string, { nome: string; categoria: string; quantidade: number }>();
  for (const item of itensAbertos) {
    if (!item.product_id) continue;
    const produto = Array.isArray(item.del_products) ? item.del_products[0] : item.del_products;
    if (!produto) continue;
    const atual = porProduto.get(item.product_id);
    if (atual) atual.quantidade += Number(item.quantidade);
    else porProduto.set(item.product_id, { nome: produto.nome, categoria: produto.categoria, quantidade: Number(item.quantidade) });
  }

  const produtoIds = [...porProduto.keys()];
  const { data: receitas } = produtoIds.length
    ? await supabase
        .from("del_product_ingredients")
        .select("product_id, quantidade_necessaria, del_ingredients(id, nome, unidade, quantidade_atual)")
        .in("product_id", produtoIds)
    : { data: [] };

  type Receita = { product_id: string; quantidade_necessaria: number; del_ingredients: { id: string; nome: string; unidade: string; quantidade_atual: number } | { id: string; nome: string; unidade: string; quantidade_atual: number }[] | null };

  const porIngrediente = new Map<string, { nome: string; unidade: string; quantidadeAtual: number; necessario: number }>();
  for (const receita of (receitas ?? []) as Receita[]) {
    const ingrediente = Array.isArray(receita.del_ingredients) ? receita.del_ingredients[0] : receita.del_ingredients;
    if (!ingrediente) continue;
    const pedidoDoProduto = porProduto.get(receita.product_id);
    if (!pedidoDoProduto) continue;
    const necessario = Number(receita.quantidade_necessaria) * pedidoDoProduto.quantidade;
    const atual = porIngrediente.get(ingrediente.id);
    if (atual) atual.necessario += necessario;
    else porIngrediente.set(ingrediente.id, { nome: ingrediente.nome, unidade: ingrediente.unidade, quantidadeAtual: Number(ingrediente.quantidade_atual), necessario });
  }

  const produtosOrdenados = [...porProduto.values()].sort((a, b) => b.quantidade - a.quantidade);
  const ingredientesOrdenados = [...porIngrediente.values()].sort((a, b) => b.necessario - a.necessario);

  return (
    <div>
      <AutoRefresh seconds={30} />
      <h1 className="text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {t.descricao}
      </p>

      <section className="mt-6">
        <h2 className="font-semibold text-stone-900">{t.pratosPreparar}</h2>
        <div className="mt-2 space-y-1.5">
          {produtosOrdenados.map((p) => (
            <div key={p.nome} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
              <span className="font-medium text-stone-900">{p.nome}</span>
              <span className="font-semibold text-amber-700">{numero(p.quantidade)}x</span>
            </div>
          ))}
          {produtosOrdenados.length === 0 && <p className="text-sm text-stone-500">{t.nenhumPedido}</p>}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-stone-900">{t.ingredientesNecessarios}</h2>
        <p className="mt-1 text-xs text-stone-500">{t.ingredientesDescricao}</p>
        <div className="mt-2 space-y-1.5">
          {ingredientesOrdenados.map((i) => {
            const falta = i.necessario > i.quantidadeAtual;
            return (
              <div key={i.nome} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${falta ? "border-red-300 bg-red-50" : "border-stone-200 bg-white"}`}>
                <span className={falta ? "font-medium text-red-900" : "text-stone-900"}>
                  {i.nome}
                  {falta && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">{t.estoqueInsuficiente}</span>}
                </span>
                <span className="text-stone-600">
                  {t.precisaTem(numero(i.necessario), i.unidade, numero(i.quantidadeAtual))}
                </span>
              </div>
            );
          })}
          {ingredientesOrdenados.length === 0 && <p className="text-sm text-stone-500">{t.nenhumIngrediente}</p>}
        </div>
      </section>
    </div>
  );
}

import type { SupabaseClient } from "@supabase/supabase-js";

type OrderRow = {
  id: string;
  canal: string;
  totale: number;
  competencia_em: string;
  del_order_items: {
    product_id: string;
    quantidade: number;
    preco_unitario: number;
    del_products: { nome: string; categoria: string | null } | { nome: string; categoria: string | null }[] | null;
  }[];
};

export type ItemVendido = {
  productId: string;
  nome: string;
  categoria: string | null;
  quantidade: number;
  receita: number;
  cmv: number | null;
  margem: number | null;
  margemPercentual: number | null;
};

export type VendaPorCanal = { canal: string; receita: number; pedidos: number };

export type MetricasPeriodo = {
  receita: number;
  estornos: number;
  receitaLiquida: number;
  cmv: number;
  cmvComDadosParciais: boolean;
  margem: number;
  custosFixosNoPeriodo: number;
  lucroEstimado: number;
  pedidos: number;
  ticketMedio: number;
  vendasPorCanal: VendaPorCanal[];
  produtos: ItemVendido[];
};

function custoVigenteEm(historicoDesc: { custo_unitario: number | string; vigente_desde: string }[], quandoMs: number): number | null {
  for (const h of historicoDesc) {
    if (new Date(h.vigente_desde).getTime() <= quandoMs) return Number(h.custo_unitario);
  }
  return null;
}

/** Métricas de vendas, margem e CMV de um período, a partir dos pedidos entregues (por competência). */
export async function calcularMetricasPeriodo(
  supabase: SupabaseClient,
  ownerId: string,
  fromISO: string,
  toISO: string,
): Promise<MetricasPeriodo> {
  const { data: orders } = await supabase
    .from("del_orders")
    .select("id, canal, totale, competencia_em, del_order_items(product_id, quantidade, preco_unitario, del_products(nome, categoria))")
    .eq("owner_id", ownerId)
    .neq("status", "cancelado")
    .gte("competencia_em", fromISO)
    .lte("competencia_em", toISO)
    .returns<OrderRow[]>();

  const pedidos = orders ?? [];
  const receita = pedidos.reduce((sum, o) => sum + Number(o.totale), 0);
  const ticketMedio = pedidos.length > 0 ? receita / pedidos.length : 0;

  const canalMap = new Map<string, VendaPorCanal>();
  for (const o of pedidos) {
    const atual = canalMap.get(o.canal) ?? { canal: o.canal, receita: 0, pedidos: 0 };
    atual.receita += Number(o.totale);
    atual.pedidos += 1;
    canalMap.set(o.canal, atual);
  }

  const productIds = [...new Set(pedidos.flatMap((o) => o.del_order_items.map((i) => i.product_id)))];

  const { data: receitas } = productIds.length
    ? await supabase
        .from("del_product_ingredients")
        .select("product_id, ingredient_id, quantidade_necessaria")
        .eq("owner_id", ownerId)
        .in("product_id", productIds)
    : { data: [] };

  const ingredientIds = [...new Set((receitas ?? []).map((r) => r.ingredient_id))];
  const { data: custosHistoricos } = ingredientIds.length
    ? await supabase
        .from("del_ingredient_custos")
        .select("ingredient_id, custo_unitario, vigente_desde")
        .eq("owner_id", ownerId)
        .in("ingredient_id", ingredientIds)
    : { data: [] };

  const custosPorIngrediente = new Map<string, { custo_unitario: number | string; vigente_desde: string }[]>();
  for (const c of custosHistoricos ?? []) {
    const lista = custosPorIngrediente.get(c.ingredient_id) ?? [];
    lista.push(c);
    custosPorIngrediente.set(c.ingredient_id, lista);
  }
  for (const lista of custosPorIngrediente.values()) {
    lista.sort((a, b) => new Date(b.vigente_desde).getTime() - new Date(a.vigente_desde).getTime());
  }

  const receitaPorProduto = new Map<string, { ingredient_id: string; quantidade_necessaria: number }[]>();
  for (const r of receitas ?? []) {
    const lista = receitaPorProduto.get(r.product_id) ?? [];
    lista.push({ ingredient_id: r.ingredient_id, quantidade_necessaria: Number(r.quantidade_necessaria) });
    receitaPorProduto.set(r.product_id, lista);
  }

  const porProduto = new Map<string, ItemVendido>();
  let cmvTotal = 0;
  let cmvComDadosParciais = false;

  for (const o of pedidos) {
    const quandoMs = new Date(o.competencia_em).getTime();
    for (const item of o.del_order_items) {
      const produtoInfo = Array.isArray(item.del_products) ? item.del_products[0] : item.del_products;
      const nome = produtoInfo?.nome ?? "Produto removido";
      const categoria = produtoInfo?.categoria ?? null;
      const quantidade = Number(item.quantidade);
      const receitaItem = quantidade * Number(item.preco_unitario);

      const ficha = receitaPorProduto.get(item.product_id);
      let cmvItem: number | null = null;
      if (ficha && ficha.length > 0) {
        let somaCusto = 0;
        let algumDesconhecido = false;
        for (const ingrediente of ficha) {
          const custo = custoVigenteEm(custosPorIngrediente.get(ingrediente.ingredient_id) ?? [], quandoMs);
          if (custo == null) {
            algumDesconhecido = true;
          } else {
            somaCusto += ingrediente.quantidade_necessaria * custo;
          }
        }
        cmvItem = algumDesconhecido ? null : somaCusto * quantidade;
      }

      if (cmvItem == null) cmvComDadosParciais = true;
      else cmvTotal += cmvItem;

      const atual = porProduto.get(item.product_id) ?? {
        productId: item.product_id,
        nome,
        categoria,
        quantidade: 0,
        receita: 0,
        cmv: 0,
        margem: null,
        margemPercentual: null,
      };
      atual.quantidade += quantidade;
      atual.receita += receitaItem;
      atual.cmv = cmvItem == null ? null : (atual.cmv ?? 0) + cmvItem;
      porProduto.set(item.product_id, atual);
    }
  }

  const produtos = [...porProduto.values()]
    .map((p) => ({
      ...p,
      margem: p.cmv == null ? null : p.receita - p.cmv,
      margemPercentual: p.cmv == null || p.receita === 0 ? null : (p.receita - p.cmv) / p.receita,
    }))
    .sort((a, b) => b.quantidade - a.quantidade);

  const { data: eventosEstorno } = await supabase
    .from("del_pagamento_eventos")
    .select("valor_movimento, ocorrido_em")
    .eq("owner_id", ownerId)
    .eq("status", "confirmado")
    .gt("valor_movimento", 0)
    .gte("ocorrido_em", fromISO)
    .lte("ocorrido_em", toISO);
  const estornos = (eventosEstorno ?? []).reduce((sum, e) => sum + Number(e.valor_movimento), 0);
  const receitaLiquida = receita - estornos;

  const { data: custosFixos } = await supabase.from("del_fixed_costs").select("valor_mensal").eq("owner_id", ownerId);
  const totalCustosFixosMensal = (custosFixos ?? []).reduce((sum, c) => sum + Number(c.valor_mensal), 0);
  const diasNoPeriodo = Math.max(1, Math.round((new Date(toISO).getTime() - new Date(fromISO).getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const custosFixosNoPeriodo = (totalCustosFixosMensal / 30) * diasNoPeriodo;

  const margem = receitaLiquida - cmvTotal;
  const lucroEstimado = margem - custosFixosNoPeriodo;

  return {
    receita,
    estornos,
    receitaLiquida,
    cmv: cmvTotal,
    cmvComDadosParciais,
    margem,
    custosFixosNoPeriodo,
    lucroEstimado,
    pedidos: pedidos.length,
    ticketMedio,
    vendasPorCanal: [...canalMap.values()].sort((a, b) => b.receita - a.receita),
    produtos,
  };
}

export type ItemDesperdicio = {
  ingredientId: string;
  codigo: string;
  nome: string;
  unidade: string;
  quantidade: number;
  valorEstimado: number | null;
};

export type Desperdicio = {
  quantidadeDeMovimentos: number;
  valorTotalEstimado: number;
  valorComDadosParciais: boolean;
  porIngrediente: ItemDesperdicio[];
};

/** Perdas/desperdício (tipo='perda' em del_stock_movements) no período, valorizadas pelo custo vigente na data de cada perda. */
export async function calcularDesperdicio(
  supabase: SupabaseClient,
  ownerId: string,
  fromISO: string,
  toISO: string,
): Promise<Desperdicio> {
  const { data: movimentos } = await supabase
    .from("del_stock_movements")
    .select("ingredient_id, quantidade, created_at, motivo, del_ingredients(codigo, nome, unidade)")
    .eq("owner_id", ownerId)
    .eq("tipo", "perda")
    .gte("created_at", fromISO)
    .lte("created_at", toISO);

  const lista = movimentos ?? [];
  const ingredientIds = [...new Set(lista.map((m) => m.ingredient_id))];
  const { data: custosHistoricos } = ingredientIds.length
    ? await supabase.from("del_ingredient_custos").select("ingredient_id, custo_unitario, vigente_desde").eq("owner_id", ownerId).in("ingredient_id", ingredientIds)
    : { data: [] };

  const custosPorIngrediente = new Map<string, { custo_unitario: number | string; vigente_desde: string }[]>();
  for (const c of custosHistoricos ?? []) {
    const l = custosPorIngrediente.get(c.ingredient_id) ?? [];
    l.push(c);
    custosPorIngrediente.set(c.ingredient_id, l);
  }
  for (const l of custosPorIngrediente.values()) {
    l.sort((a, b) => new Date(b.vigente_desde).getTime() - new Date(a.vigente_desde).getTime());
  }

  const porIngrediente = new Map<string, ItemDesperdicio>();
  let valorComDadosParciais = false;

  for (const m of lista) {
    const info = Array.isArray(m.del_ingredients) ? m.del_ingredients[0] : m.del_ingredients;
    const quantidade = Number(m.quantidade);
    const custo = custoVigenteEm(custosPorIngrediente.get(m.ingredient_id) ?? [], new Date(m.created_at).getTime());
    if (custo == null) valorComDadosParciais = true;

    const atual = porIngrediente.get(m.ingredient_id) ?? {
      ingredientId: m.ingredient_id,
      codigo: info?.codigo ?? "",
      nome: info?.nome ?? "Produto removido",
      unidade: info?.unidade ?? "",
      quantidade: 0,
      valorEstimado: 0,
    };
    atual.quantidade += quantidade;
    atual.valorEstimado = custo == null ? atual.valorEstimado : (atual.valorEstimado ?? 0) + quantidade * custo;
    porIngrediente.set(m.ingredient_id, atual);
  }

  const itens = [...porIngrediente.values()].sort((a, b) => (b.valorEstimado ?? -1) - (a.valorEstimado ?? -1));
  const valorTotalEstimado = itens.reduce((sum, i) => sum + (i.valorEstimado ?? 0), 0);

  return {
    quantidadeDeMovimentos: lista.length,
    valorTotalEstimado,
    valorComDadosParciais,
    porIngrediente: itens,
  };
}

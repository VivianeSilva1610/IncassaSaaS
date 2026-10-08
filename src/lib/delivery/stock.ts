import type { SupabaseClient } from "@supabase/supabase-js";

type MovementType = "entrada" | "saida" | "ajuste" | "perda";

// Registra que esse custo passou a valer a partir de agora — usado pro
// relatório de inventário por período poder saber o custo vigente em
// qualquer data passada, não só o custo atual. Chamado sempre que o custo
// unitário de um ingrediente é informado (cadastro, edição ou compra).
export async function registrarCustoHistorico(
  supabase: SupabaseClient,
  params: { ownerId: string; ingredientId: string; custoUnitario: number },
) {
  const { error } = await supabase.from("del_ingredient_custos").insert({
    owner_id: params.ownerId,
    ingredient_id: params.ingredientId,
    custo_unitario: params.custoUnitario,
  });
  if (error) throw error;
}

// Registro informativo de lote/validade pra uma entrada de estoque — não
// deduz por lote nas saídas, só alerta antes de vencer (Estoque > Validades).
export async function registrarLoteEstoque(
  supabase: SupabaseClient,
  params: {
    ownerId: string;
    ingredientId: string;
    quantidade: number;
    numeroLote?: string | null;
    validade?: string | null;
    origem?: string | null;
    notaEntradaItemId?: string | null;
    stockMovementId?: string | null;
  },
) {
  const { error } = await supabase.from("del_lotes_estoque").insert({
    owner_id: params.ownerId,
    ingredient_id: params.ingredientId,
    quantidade: params.quantidade,
    numero_lote: params.numeroLote ?? null,
    validade: params.validade ?? null,
    origem: params.origem ?? null,
    nota_entrada_item_id: params.notaEntradaItemId ?? null,
    stock_movement_id: params.stockMovementId ?? null,
  });
  if (error) throw error;
}

export async function registerStockMovement(
  supabase: SupabaseClient,
  params: {
    ownerId: string;
    ingredientId: string;
    tipo: MovementType;
    quantidade: number;
    motivo?: string | null;
    orderId?: string | null;
  },
) {
  const { data: ingredient, error: fetchError } = await supabase
    .from("del_ingredients")
    .select("quantidade_atual")
    .eq("id", params.ingredientId)
    .eq("owner_id", params.ownerId)
    .single();

  if (fetchError || !ingredient) {
    throw new Error("Ingrediente não encontrado.");
  }

  const delta = params.tipo === "saida" || params.tipo === "perda" ? -params.quantidade : params.quantidade;
  const nuovaQuantita = Number(ingredient.quantidade_atual) + delta;

  const { data: movimento, error: insertError } = await supabase
    .from("del_stock_movements")
    .insert({
      owner_id: params.ownerId,
      ingredient_id: params.ingredientId,
      tipo: params.tipo,
      quantidade: params.quantidade,
      motivo: params.motivo ?? null,
      order_id: params.orderId ?? null,
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  const { error: updateError } = await supabase
    .from("del_ingredients")
    .update({ quantidade_atual: nuovaQuantita })
    .eq("id", params.ingredientId)
    .eq("owner_id", params.ownerId);
  if (updateError) throw updateError;

  return { movementId: movimento.id as string };
}

// Desconta do estoque, automaticamente, os ingredientes de cada item vendido
// que tiver ficha técnica cadastrada (del_product_ingredients). Itens sem
// ficha técnica são ignorados — nada a descontar.
export async function deduzirEstoquePorVenda(
  supabase: SupabaseClient,
  params: {
    ownerId: string;
    orderId: string;
    items: { productId: string; quantidade: number }[];
  },
) {
  const productIds = [...new Set(params.items.map((i) => i.productId))];

  const { data: receitas } = await supabase
    .from("del_product_ingredients")
    .select("product_id, ingredient_id, quantidade_necessaria")
    .eq("owner_id", params.ownerId)
    .in("product_id", productIds);

  if (!receitas || receitas.length === 0) return;

  const necessarioPorIngrediente = new Map<string, number>();
  for (const item of params.items) {
    const ingredientesDoItem = receitas.filter((r) => r.product_id === item.productId);
    for (const r of ingredientesDoItem) {
      const quantidade = Number(r.quantidade_necessaria) * item.quantidade;
      necessarioPorIngrediente.set(
        r.ingredient_id,
        (necessarioPorIngrediente.get(r.ingredient_id) ?? 0) + quantidade,
      );
    }
  }

  // Permite retomar um webhook que falhou no meio da baixa: lança apenas a
  // diferença ainda não registrada para cada ingrediente deste pedido.
  const { data: movimentosExistentes } = await supabase
    .from("del_stock_movements")
    .select("ingredient_id, quantidade")
    .eq("owner_id", params.ownerId)
    .eq("order_id", params.orderId)
    .eq("tipo", "saida")
    .eq("motivo", "Venda automática");

  const jaDeduzidoPorIngrediente = new Map<string, number>();
  for (const movimento of movimentosExistentes ?? []) {
    jaDeduzidoPorIngrediente.set(
      movimento.ingredient_id,
      (jaDeduzidoPorIngrediente.get(movimento.ingredient_id) ?? 0) + Number(movimento.quantidade),
    );
  }

  for (const [ingredientId, quantidadeNecessaria] of necessarioPorIngrediente) {
    const quantidadePendente = quantidadeNecessaria - (jaDeduzidoPorIngrediente.get(ingredientId) ?? 0);
    if (quantidadePendente > 0.000_001) {
      await registerStockMovement(supabase, {
        ownerId: params.ownerId,
        ingredientId,
        tipo: "saida",
        quantidade: quantidadePendente,
        motivo: "Venda automática",
        orderId: params.orderId,
      });
    }
  }
}

// Devolve ao estoque os ingredientes de itens cancelados/removidos de um
// pedido (o espelho de deduzirEstoquePorVenda). Itens sem ficha técnica são
// ignorados — nada a devolver. Idempotente como a dedução: resume de onde
// parou se for chamada de novo pro mesmo pedido.
export async function restaurarEstoquePorCancelamento(
  supabase: SupabaseClient,
  params: {
    ownerId: string;
    orderId: string;
    motivo: string;
    items: { productId: string; quantidade: number }[];
  },
) {
  const productIds = [...new Set(params.items.map((i) => i.productId))];

  const { data: receitas } = await supabase
    .from("del_product_ingredients")
    .select("product_id, ingredient_id, quantidade_necessaria")
    .eq("owner_id", params.ownerId)
    .in("product_id", productIds);

  if (!receitas || receitas.length === 0) return;

  const necessarioPorIngrediente = new Map<string, number>();
  for (const item of params.items) {
    const ingredientesDoItem = receitas.filter((r) => r.product_id === item.productId);
    for (const r of ingredientesDoItem) {
      const quantidade = Number(r.quantidade_necessaria) * item.quantidade;
      necessarioPorIngrediente.set(
        r.ingredient_id,
        (necessarioPorIngrediente.get(r.ingredient_id) ?? 0) + quantidade,
      );
    }
  }

  const { data: movimentosExistentes } = await supabase
    .from("del_stock_movements")
    .select("ingredient_id, quantidade")
    .eq("owner_id", params.ownerId)
    .eq("order_id", params.orderId)
    .eq("tipo", "entrada")
    .eq("motivo", params.motivo);

  const jaRestauradoPorIngrediente = new Map<string, number>();
  for (const movimento of movimentosExistentes ?? []) {
    jaRestauradoPorIngrediente.set(
      movimento.ingredient_id,
      (jaRestauradoPorIngrediente.get(movimento.ingredient_id) ?? 0) + Number(movimento.quantidade),
    );
  }

  for (const [ingredientId, quantidadeNecessaria] of necessarioPorIngrediente) {
    const quantidadePendente = quantidadeNecessaria - (jaRestauradoPorIngrediente.get(ingredientId) ?? 0);
    if (quantidadePendente > 0.000_001) {
      await registerStockMovement(supabase, {
        ownerId: params.ownerId,
        ingredientId,
        tipo: "entrada",
        quantidade: quantidadePendente,
        motivo: params.motivo,
        orderId: params.orderId,
      });
    }
  }
}

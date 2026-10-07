import type { SupabaseClient } from "@supabase/supabase-js";

type MovementType = "entrada" | "saida" | "ajuste";

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

  const delta = params.tipo === "saida" ? -params.quantidade : params.quantidade;
  const nuovaQuantita = Number(ingredient.quantidade_atual) + delta;

  const { error: insertError } = await supabase.from("del_stock_movements").insert({
    owner_id: params.ownerId,
    ingredient_id: params.ingredientId,
    tipo: params.tipo,
    quantidade: params.quantidade,
    motivo: params.motivo ?? null,
    order_id: params.orderId ?? null,
  });
  if (insertError) throw insertError;

  const { error: updateError } = await supabase
    .from("del_ingredients")
    .update({ quantidade_atual: nuovaQuantita })
    .eq("id", params.ingredientId)
    .eq("owner_id", params.ownerId);
  if (updateError) throw updateError;
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

import type { SupabaseClient } from "@supabase/supabase-js";

type MovementType = "entrada" | "saida" | "ajuste";

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
    .eq("id", params.ingredientId);
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
    .in("product_id", productIds);

  if (!receitas || receitas.length === 0) return;

  for (const item of params.items) {
    const ingredientesDoItem = receitas.filter((r) => r.product_id === item.productId);
    for (const r of ingredientesDoItem) {
      await registerStockMovement(supabase, {
        ownerId: params.ownerId,
        ingredientId: r.ingredient_id,
        tipo: "saida",
        quantidade: Number(r.quantidade_necessaria) * item.quantidade,
        motivo: "Venda automática",
        orderId: params.orderId,
      });
    }
  }
}

import type { SupabaseClient } from "@supabase/supabase-js";

type MovementType = "entrada" | "saida" | "ajuste";

export async function registerStockMovement(
  supabase: SupabaseClient,
  params: {
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
    throw new Error("Ingrediente non trovato.");
  }

  const delta = params.tipo === "saida" ? -params.quantidade : params.quantidade;
  const nuovaQuantita = Number(ingredient.quantidade_atual) + delta;

  const { error: insertError } = await supabase.from("del_stock_movements").insert({
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

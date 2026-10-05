import type { SupabaseClient } from "@supabase/supabase-js";

export type NewOrderItem = {
  productId: string;
  quantidade: number;
  precoUnitario: number;
};

export async function createOrderWithItems(
  supabase: SupabaseClient,
  params: {
    clienteNome?: string | null;
    clienteTelefone?: string | null;
    canale: string;
    note?: string | null;
    items: NewOrderItem[];
  },
) {
  const totale = params.items.reduce((sum, item) => sum + item.quantidade * item.precoUnitario, 0);

  const { data: order, error: orderError } = await supabase
    .from("del_orders")
    .insert({
      cliente_nome: params.clienteNome ?? null,
      cliente_telefone: params.clienteTelefone ?? null,
      canal: params.canale,
      note: params.note ?? null,
      totale,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    throw new Error("Não foi possível criar o pedido.");
  }

  const { error: itemsError } = await supabase.from("del_order_items").insert(
    params.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      quantidade: item.quantidade,
      preco_unitario: item.precoUnitario,
    })),
  );

  if (itemsError) {
    throw new Error("Não foi possível salvar os itens do pedido.");
  }

  return order.id as string;
}

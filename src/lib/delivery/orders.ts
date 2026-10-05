import type { SupabaseClient } from "@supabase/supabase-js";
import { deduzirEstoquePorVenda } from "@/lib/delivery/stock";

export type NewOrderItem = {
  productId: string;
  quantidade: number;
  precoUnitario: number;
};

export async function createOrderWithItems(
  supabase: SupabaseClient,
  params: {
    ownerId: string;
    clienteNome?: string | null;
    clienteTelefone?: string | null;
    canale: string;
    note?: string | null;
    taxaEntrega?: number;
    aPrazo?: boolean;
    items: NewOrderItem[];
  },
) {
  const taxaEntrega = params.taxaEntrega ?? 0;
  const totale = params.items.reduce((sum, item) => sum + item.quantidade * item.precoUnitario, 0) + taxaEntrega;

  const { data: order, error: orderError } = await supabase
    .from("del_orders")
    .insert({
      owner_id: params.ownerId,
      cliente_nome: params.clienteNome ?? null,
      cliente_telefone: params.clienteTelefone ?? null,
      canal: params.canale,
      note: params.note ?? null,
      taxa_entrega: taxaEntrega,
      a_prazo: params.aPrazo ?? false,
      totale,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    throw new Error("Não foi possível criar o pedido.");
  }

  const { error: itemsError } = await supabase.from("del_order_items").insert(
    params.items.map((item) => ({
      owner_id: params.ownerId,
      order_id: order.id,
      product_id: item.productId,
      quantidade: item.quantidade,
      preco_unitario: item.precoUnitario,
    })),
  );

  if (itemsError) {
    throw new Error("Não foi possível salvar os itens do pedido.");
  }

  await deduzirEstoquePorVenda(supabase, {
    ownerId: params.ownerId,
    orderId: order.id,
    items: params.items.map((item) => ({ productId: item.productId, quantidade: item.quantidade })),
  });

  return { orderId: order.id as string, totale };
}

"use server";

import { revalidatePath } from "next/cache";
import { requireDeliveryAdmin } from "@/lib/delivery/auth";
import { registerStockMovement } from "@/lib/delivery/stock";
import { createOrderWithItems } from "@/lib/delivery/orders";

export async function addIngredient(formData: FormData) {
  const { supabase } = await requireDeliveryAdmin();

  await supabase.from("del_ingredients").insert({
    nome: String(formData.get("nome") ?? ""),
    unidade: String(formData.get("unidade") ?? "un"),
    quantidade_atual: Number(formData.get("quantidade_atual") ?? 0),
    estoque_minimo: formData.get("estoque_minimo") ? Number(formData.get("estoque_minimo")) : null,
  });

  revalidatePath("/delivery-admin/estoque");
}

export async function deleteIngredient(id: string) {
  const { supabase } = await requireDeliveryAdmin();
  await supabase.from("del_ingredients").delete().eq("id", id);
  revalidatePath("/delivery-admin/estoque");
}

export async function addStockMovement(formData: FormData) {
  const { supabase } = await requireDeliveryAdmin();

  const ingredientId = String(formData.get("ingredient_id") ?? "");
  const tipo = String(formData.get("tipo") ?? "entrada") as "entrada" | "saida" | "ajuste";
  const quantidade = Number(formData.get("quantidade") ?? 0);
  const motivo = String(formData.get("motivo") ?? "") || null;

  if (!ingredientId || quantidade <= 0) {
    throw new Error("Dati non validi.");
  }

  await registerStockMovement(supabase, { ingredientId, tipo, quantidade, motivo });
  revalidatePath("/delivery-admin/estoque");
}

export async function addProduct(formData: FormData) {
  const { supabase } = await requireDeliveryAdmin();

  await supabase.from("del_products").insert({
    nome: String(formData.get("nome") ?? ""),
    descrizione: String(formData.get("descrizione") ?? "") || null,
    preco: Number(formData.get("preco") ?? 0),
  });

  revalidatePath("/delivery-admin/vendas");
}

export async function toggleProductAtivo(id: string, ativo: boolean) {
  const { supabase } = await requireDeliveryAdmin();
  await supabase.from("del_products").update({ ativo: !ativo }).eq("id", id);
  revalidatePath("/delivery-admin/vendas");
}

export async function deleteProduct(id: string) {
  const { supabase } = await requireDeliveryAdmin();
  await supabase.from("del_products").delete().eq("id", id);
  revalidatePath("/delivery-admin/vendas");
}

export async function createOrder(formData: FormData) {
  const { supabase } = await requireDeliveryAdmin();

  const productIds = formData.getAll("product_id").map(String);
  const quantities = formData.getAll("quantidade").map((v) => Number(v));
  const prices = formData.getAll("preco_unitario").map((v) => Number(v));

  const items = productIds
    .map((productId, i) => ({ productId, quantidade: quantities[i], precoUnitario: prices[i] }))
    .filter((item) => item.productId && item.quantidade > 0);

  if (items.length === 0) {
    throw new Error("Aggiungi almeno un prodotto all'ordine.");
  }

  await createOrderWithItems(supabase, {
    clienteNome: String(formData.get("cliente_nome") ?? "") || null,
    clienteTelefone: String(formData.get("cliente_telefone") ?? "") || null,
    canale: String(formData.get("canal") ?? "telefone"),
    note: String(formData.get("note") ?? "") || null,
    items,
  });

  revalidatePath("/delivery-admin/vendas");
}

export async function updateOrderStatus(id: string, status: string) {
  const { supabase } = await requireDeliveryAdmin();
  await supabase.from("del_orders").update({ status }).eq("id", id);
  revalidatePath("/delivery-admin/vendas");
}

export async function deleteOrder(id: string) {
  const { supabase } = await requireDeliveryAdmin();
  await supabase.from("del_orders").delete().eq("id", id);
  revalidatePath("/delivery-admin/vendas");
}

"use server";

import { revalidatePath } from "next/cache";
import { requireDeliveryAdmin } from "@/lib/delivery/auth";
import { registerStockMovement } from "@/lib/delivery/stock";
import { createOrderWithItems } from "@/lib/delivery/orders";
import { PRICING_CONFIG_ID } from "@/lib/delivery/pricing";

export async function addIngredient(formData: FormData) {
  const { supabase } = await requireDeliveryAdmin();

  await supabase.from("del_ingredients").insert({
    nome: String(formData.get("nome") ?? ""),
    unidade: String(formData.get("unidade") ?? "un"),
    quantidade_atual: Number(formData.get("quantidade_atual") ?? 0),
    estoque_minimo: formData.get("estoque_minimo") ? Number(formData.get("estoque_minimo")) : null,
    custo_unitario: formData.get("custo_unitario") ? Number(formData.get("custo_unitario")) : null,
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
    throw new Error("Dados inválidos.");
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

export async function updateProduct(id: string, formData: FormData) {
  const { supabase } = await requireDeliveryAdmin();

  await supabase
    .from("del_products")
    .update({
      nome: String(formData.get("nome") ?? ""),
      preco: Number(formData.get("preco") ?? 0),
      descrizione: String(formData.get("descrizione") ?? "") || null,
    })
    .eq("id", id);

  revalidatePath("/delivery-admin/vendas");
  revalidatePath("/delivery-admin/custos");
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
    throw new Error("Adicione pelo menos um item ao pedido.");
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

export async function addFixedCost(formData: FormData) {
  const { supabase } = await requireDeliveryAdmin();

  await supabase.from("del_fixed_costs").insert({
    descricao: String(formData.get("descricao") ?? ""),
    valor_mensal: Number(formData.get("valor_mensal") ?? 0),
  });

  revalidatePath("/delivery-admin/custos");
}

export async function deleteFixedCost(id: string) {
  const { supabase } = await requireDeliveryAdmin();
  await supabase.from("del_fixed_costs").delete().eq("id", id);
  revalidatePath("/delivery-admin/custos");
}

export async function updatePricingConfig(formData: FormData) {
  const { supabase } = await requireDeliveryAdmin();

  const volumeMensalEstimado = Number(formData.get("volume_mensal_estimado") ?? 0);
  const margemPercentual = Number(formData.get("margem_desejada") ?? 0);
  const nomeNegocio = String(formData.get("nome_negocio") ?? "").trim() || null;

  await supabase.from("del_pricing_config").upsert({
    id: PRICING_CONFIG_ID,
    volume_mensal_estimado: volumeMensalEstimado,
    margem_desejada: margemPercentual / 100,
    nome_negocio: nomeNegocio,
    updated_at: new Date().toISOString(),
  });

  revalidatePath("/delivery-admin/custos");
  revalidatePath("/delivery-admin");
  revalidatePath("/delivery-admin/vendas");
}

export async function addProductIngredient(formData: FormData) {
  const { supabase } = await requireDeliveryAdmin();

  const productId = String(formData.get("product_id") ?? "");
  const ingredientId = String(formData.get("ingredient_id") ?? "");
  const quantidadeNecessaria = Number(formData.get("quantidade_necessaria") ?? 0);

  if (!productId || !ingredientId || quantidadeNecessaria <= 0) {
    throw new Error("Dados inválidos.");
  }

  await supabase
    .from("del_product_ingredients")
    .upsert(
      { product_id: productId, ingredient_id: ingredientId, quantidade_necessaria: quantidadeNecessaria },
      { onConflict: "product_id,ingredient_id" },
    );

  revalidatePath("/delivery-admin/custos");
}

export async function deleteProductIngredient(id: string) {
  const { supabase } = await requireDeliveryAdmin();
  await supabase.from("del_product_ingredients").delete().eq("id", id);
  revalidatePath("/delivery-admin/custos");
}

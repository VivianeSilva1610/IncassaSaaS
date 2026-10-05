"use server";

import { revalidatePath } from "next/cache";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { registerStockMovement } from "@/lib/delivery/stock";
import { createOrderWithItems } from "@/lib/delivery/orders";
import { gerarFaturaParaPedido } from "@/lib/delivery/invoice-bridge";

export async function addIngredient(formData: FormData) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();

  const { error } = await supabase.from("del_ingredients").insert({
    owner_id: restaurantOwnerId,
    nome: String(formData.get("nome") ?? ""),
    unidade: String(formData.get("unidade") ?? "un"),
    quantidade_atual: Number(formData.get("quantidade_atual") ?? 0),
    estoque_minimo: formData.get("estoque_minimo") ? Number(formData.get("estoque_minimo")) : null,
    custo_unitario: formData.get("custo_unitario") ? Number(formData.get("custo_unitario")) : null,
  });
  if (error) throw new Error(`Não foi possível salvar o ingrediente: ${error.message}`);

  revalidatePath("/restaurante/estoque");
}

export async function deleteIngredient(id: string) {
  const { supabase } = await requireRestaurantSubscription();
  await supabase.from("del_ingredients").delete().eq("id", id);
  revalidatePath("/restaurante/estoque");
}

export async function addStockMovement(formData: FormData) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();

  const ingredientId = String(formData.get("ingredient_id") ?? "");
  const tipo = String(formData.get("tipo") ?? "entrada") as "entrada" | "saida" | "ajuste";
  const quantidade = Number(formData.get("quantidade") ?? 0);
  const motivo = String(formData.get("motivo") ?? "") || null;

  if (!ingredientId || quantidade <= 0) {
    throw new Error("Dados inválidos.");
  }

  await registerStockMovement(supabase, { ownerId: restaurantOwnerId, ingredientId, tipo, quantidade, motivo });
  revalidatePath("/restaurante/estoque");
}

const VALID_CATEGORIAS = ["prato", "bebida", "tamanho", "principal", "acompanhamento", "extra"];

function parseCategoria(formData: FormData): string {
  const categoria = String(formData.get("categoria") ?? "prato");
  return VALID_CATEGORIAS.includes(categoria) ? categoria : "prato";
}

export async function addProduct(formData: FormData) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();

  const categoria = parseCategoria(formData);
  const maxAcompanhamentos = formData.get("max_acompanhamentos")
    ? Number(formData.get("max_acompanhamentos"))
    : null;

  const { error } = await supabase.from("del_products").insert({
    owner_id: restaurantOwnerId,
    nome: String(formData.get("nome") ?? ""),
    descrizione: String(formData.get("descrizione") ?? "") || null,
    preco: Number(formData.get("preco") ?? 0),
    categoria,
    max_acompanhamentos: categoria === "tamanho" ? maxAcompanhamentos : null,
  });
  if (error) throw new Error(`Não foi possível salvar o item: ${error.message}`);

  revalidatePath("/restaurante/vendas");
  revalidatePath("/restaurante/cardapio");
}

export async function updateProduct(id: string, formData: FormData) {
  const { supabase } = await requireRestaurantSubscription();

  const categoria = parseCategoria(formData);
  const maxAcompanhamentos = formData.get("max_acompanhamentos")
    ? Number(formData.get("max_acompanhamentos"))
    : null;

  const { error } = await supabase
    .from("del_products")
    .update({
      nome: String(formData.get("nome") ?? ""),
      preco: Number(formData.get("preco") ?? 0),
      descrizione: String(formData.get("descrizione") ?? "") || null,
      categoria,
      max_acompanhamentos: categoria === "tamanho" ? maxAcompanhamentos : null,
    })
    .eq("id", id);
  if (error) throw new Error(`Não foi possível atualizar o item: ${error.message}`);

  revalidatePath("/restaurante/vendas");
  revalidatePath("/restaurante/custos");
  revalidatePath("/restaurante/cardapio");
}

export async function toggleProductAtivo(id: string, ativo: boolean) {
  const { supabase } = await requireRestaurantSubscription();
  await supabase.from("del_products").update({ ativo: !ativo }).eq("id", id);
  revalidatePath("/restaurante/vendas");
}

export async function deleteProduct(id: string) {
  const { supabase } = await requireRestaurantSubscription();
  await supabase.from("del_products").delete().eq("id", id);
  revalidatePath("/restaurante/vendas");
}

export async function createOrder(formData: FormData) {
  const { supabase, restaurantOwnerId, isOwner } = await requireRestaurantSubscription();

  const productIds = formData.getAll("product_id").map(String);
  const quantities = formData.getAll("quantidade").map((v) => Number(v));
  const prices = formData.getAll("preco_unitario").map((v) => Number(v));

  const items = productIds
    .map((productId, i) => ({ productId, quantidade: quantities[i], precoUnitario: prices[i] }))
    .filter((item) => item.productId && item.quantidade > 0);

  if (items.length === 0) {
    throw new Error("Adicione pelo menos um item ao pedido.");
  }

  const clienteNome = String(formData.get("cliente_nome") ?? "") || null;
  const clienteTelefone = String(formData.get("cliente_telefone") ?? "") || null;
  // "A prazo" só gera fatura no INCASSA quando quem está lançando é o
  // próprio dono — a conta de um funcionário não tem permissão de escrita
  // em clients/invoices do INCASSA (são tabelas de outro produto, com RLS
  // própria por user_id, sem o mecanismo de equipe do restaurante).
  const aPrazo = isOwner && formData.get("a_prazo") === "on";

  if (aPrazo && !clienteNome) {
    throw new Error("Informe o nome do cliente para lançar um pedido a prazo.");
  }

  const { orderId, totale } = await createOrderWithItems(supabase, {
    ownerId: restaurantOwnerId,
    clienteNome,
    clienteTelefone,
    canale: String(formData.get("canal") ?? "telefone"),
    note: String(formData.get("note") ?? "") || null,
    taxaEntrega: Number(formData.get("taxa_entrega") ?? 0),
    aPrazo,
    items,
  });

  if (aPrazo && clienteNome) {
    await gerarFaturaParaPedido(supabase, {
      userId: restaurantOwnerId,
      clienteNome,
      clienteTelefone,
      importo: totale,
      orderId,
    });
  }

  revalidatePath("/restaurante/vendas");
}

export async function updateOrderStatus(id: string, status: string) {
  const { supabase } = await requireRestaurantSubscription();
  await supabase.from("del_orders").update({ status }).eq("id", id);
  revalidatePath("/restaurante/vendas");
}

export async function deleteOrder(id: string) {
  const { supabase } = await requireRestaurantSubscription();
  await supabase.from("del_orders").delete().eq("id", id);
  revalidatePath("/restaurante/vendas");
}

export async function addFixedCost(formData: FormData) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();

  const { error } = await supabase.from("del_fixed_costs").insert({
    owner_id: restaurantOwnerId,
    descricao: String(formData.get("descricao") ?? ""),
    valor_mensal: Number(formData.get("valor_mensal") ?? 0),
  });
  if (error) throw new Error(`Não foi possível salvar o custo fixo: ${error.message}`);

  revalidatePath("/restaurante/custos");
}

export async function deleteFixedCost(id: string) {
  const { supabase } = await requireRestaurantSubscription();
  await supabase.from("del_fixed_costs").delete().eq("id", id);
  revalidatePath("/restaurante/custos");
}

export async function updatePricingConfig(formData: FormData) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();

  const volumeMensalEstimado = Number(formData.get("volume_mensal_estimado") ?? 0);
  const margemPercentual = Number(formData.get("margem_desejada") ?? 0);
  const nomeNegocio = String(formData.get("nome_negocio") ?? "").trim() || null;

  const { error } = await supabase.from("del_pricing_config").upsert(
    {
      owner_id: restaurantOwnerId,
      volume_mensal_estimado: volumeMensalEstimado,
      margem_desejada: margemPercentual / 100,
      nome_negocio: nomeNegocio,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_id" },
  );
  if (error) throw new Error(`Não foi possível salvar os parâmetros: ${error.message}`);

  revalidatePath("/restaurante/custos");
  revalidatePath("/restaurante");
  revalidatePath("/restaurante/vendas");
}

export async function addProductIngredient(formData: FormData) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();

  const productId = String(formData.get("product_id") ?? "");
  const ingredientId = String(formData.get("ingredient_id") ?? "");
  const quantidadeNecessaria = Number(formData.get("quantidade_necessaria") ?? 0);

  if (!productId || !ingredientId || quantidadeNecessaria <= 0) {
    throw new Error("Dados inválidos.");
  }

  const { error } = await supabase
    .from("del_product_ingredients")
    .upsert(
      {
        owner_id: restaurantOwnerId,
        product_id: productId,
        ingredient_id: ingredientId,
        quantidade_necessaria: quantidadeNecessaria,
      },
      { onConflict: "product_id,ingredient_id" },
    );
  if (error) throw new Error(`Não foi possível salvar a ficha técnica: ${error.message}`);

  revalidatePath("/restaurante/custos");
}

export async function deleteProductIngredient(id: string) {
  const { supabase } = await requireRestaurantSubscription();
  await supabase.from("del_product_ingredients").delete().eq("id", id);
  revalidatePath("/restaurante/custos");
}

export async function addCaixaMovimento(formData: FormData) {
  const { supabase, restaurantOwnerId, user } = await requireRestaurantSubscription();

  const tipo = formData.get("tipo") === "saida" ? "saida" : "entrada";
  const valor = Number(formData.get("valor") ?? 0);

  if (valor <= 0) {
    throw new Error("Valor inválido.");
  }

  const { error } = await supabase.from("del_caixa_movimentos").insert({
    owner_id: restaurantOwnerId,
    operador_email: user.email,
    tipo,
    categoria: String(formData.get("categoria") ?? "outro"),
    valor,
    descrizione: String(formData.get("descrizione") ?? "") || null,
    data: String(formData.get("data") ?? "") || new Date().toISOString().slice(0, 10),
  });
  if (error) throw new Error(`Não foi possível registrar o lançamento: ${error.message}`);

  revalidatePath("/restaurante/caixa");
}

export async function deleteCaixaMovimento(id: string) {
  const { supabase } = await requireRestaurantSubscription();
  await supabase.from("del_caixa_movimentos").delete().eq("id", id);
  revalidatePath("/restaurante/caixa");
}

export async function addStaff(formData: FormData) {
  const { supabase, restaurantOwnerId, isOwner } = await requireRestaurantSubscription();
  if (!isOwner) {
    throw new Error("Apenas o dono do restaurante pode gerenciar a equipe.");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const nome = String(formData.get("nome") ?? "").trim() || null;

  if (!email || !email.includes("@")) {
    throw new Error("E-mail inválido.");
  }

  const { error } = await supabase.from("del_staff").upsert(
    { owner_id: restaurantOwnerId, email, nome },
    { onConflict: "owner_id,email" },
  );
  if (error) throw new Error(`Não foi possível dar acesso: ${error.message}`);

  revalidatePath("/restaurante/equipe");
}

export async function removeStaff(id: string) {
  const { supabase, isOwner } = await requireRestaurantSubscription();
  if (!isOwner) {
    throw new Error("Apenas o dono do restaurante pode gerenciar a equipe.");
  }

  await supabase.from("del_staff").delete().eq("id", id);
  revalidatePath("/restaurante/equipe");
}

export async function addCardapioDia(formData: FormData) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();

  const diaSemana = Number(formData.get("dia_semana") ?? 0);
  const productId = String(formData.get("product_id") ?? "");

  if (!productId) {
    throw new Error("Selecione um prato principal.");
  }

  const { error } = await supabase.from("del_cardapio_semana").insert({
    owner_id: restaurantOwnerId,
    dia_semana: diaSemana,
    product_id: productId,
  });
  if (error) throw new Error(`Não foi possível adicionar ao cardápio da semana: ${error.message}`);

  revalidatePath("/restaurante/cardapio");
}

export async function removeCardapioDia(id: string) {
  const { supabase } = await requireRestaurantSubscription();
  await supabase.from("del_cardapio_semana").delete().eq("id", id);
  revalidatePath("/restaurante/cardapio");
}

export async function addMesa(formData: FormData) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();

  const numero = String(formData.get("numero") ?? "").trim();
  if (!numero) throw new Error("Informe o número ou nome da mesa.");

  const { error } = await supabase.from("del_mesas").insert({ owner_id: restaurantOwnerId, numero });
  if (error) throw new Error(`Não foi possível criar a mesa: ${error.message}`);

  revalidatePath("/restaurante/mesas");
}

export async function deleteMesa(id: string) {
  const { supabase } = await requireRestaurantSubscription();
  await supabase.from("del_mesas").delete().eq("id", id);
  revalidatePath("/restaurante/mesas");
}

export async function fecharComanda(id: string, formData: FormData) {
  const { supabase } = await requireRestaurantSubscription();

  const formaPagamento = String(formData.get("forma_pagamento") ?? "") || null;

  const { error } = await supabase
    .from("del_comandas")
    .update({ status: "fechada", forma_pagamento: formaPagamento, fechada_em: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Não foi possível fechar a comanda: ${error.message}`);

  revalidatePath("/restaurante/mesas");
}

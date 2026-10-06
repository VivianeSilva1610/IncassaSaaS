"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { registerStockMovement } from "@/lib/delivery/stock";
import { createOrderWithItems } from "@/lib/delivery/orders";
import { gerarFaturaParaPedido } from "@/lib/delivery/invoice-bridge";
import { emitirNotaFiscalParaPedido, cancelarNotaFiscal as cancelarNotaFiscalLib } from "@/lib/fiscal/emitir";

// Próximo código sequencial do dono (ex: "0001", "0002"...), usado tanto ao
// cadastrar um ingrediente direto quanto ao informar a compra de um produto
// novo pela tela de fornecedores.
async function proximoCodigo(supabase: SupabaseClient, ownerId: string): Promise<string> {
  const { data } = await supabase
    .from("del_ingredients")
    .select("codigo")
    .eq("owner_id", ownerId)
    .order("codigo", { ascending: false })
    .limit(1)
    .maybeSingle();
  const atual = data?.codigo ? parseInt(data.codigo, 10) : 0;
  return String(atual + 1).padStart(4, "0");
}

export async function addIngredient(formData: FormData) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();

  const codigo = await proximoCodigo(supabase, restaurantOwnerId);

  const { error } = await supabase.from("del_ingredients").insert({
    owner_id: restaurantOwnerId,
    codigo,
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

// Tela única de "compra de fornecedor": se o produto já existe (código
// selecionado), só lança entrada de estoque; se não existe, cadastra um
// produto novo com código novo e a quantidade comprada como estoque inicial.
export async function registrarCompraFornecedor(formData: FormData) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();

  const ingredientId = String(formData.get("ingredient_id") ?? "");
  const quantidade = Number(formData.get("quantidade") ?? 0);
  const fornecedor = String(formData.get("fornecedor") ?? "").trim() || null;
  const custoUnitario = formData.get("custo_unitario") ? Number(formData.get("custo_unitario")) : null;

  if (quantidade <= 0) {
    throw new Error("Informe a quantidade comprada.");
  }

  if (ingredientId) {
    await registerStockMovement(supabase, {
      ownerId: restaurantOwnerId,
      ingredientId,
      tipo: "entrada",
      quantidade,
      motivo: fornecedor ? `Compra — ${fornecedor}` : "Compra de fornecedor",
    });
    if (custoUnitario != null) {
      await supabase.from("del_ingredients").update({ custo_unitario: custoUnitario }).eq("id", ingredientId);
    }
  } else {
    const nome = String(formData.get("nome") ?? "").trim();
    if (!nome) throw new Error("Informe o nome do novo produto.");
    const unidade = String(formData.get("unidade") ?? "un");
    const codigo = await proximoCodigo(supabase, restaurantOwnerId);

    const { error } = await supabase.from("del_ingredients").insert({
      owner_id: restaurantOwnerId,
      codigo,
      nome,
      unidade,
      quantidade_atual: quantidade,
      custo_unitario: custoUnitario,
    });
    if (error) throw new Error(`Não foi possível cadastrar o produto: ${error.message}`);
  }

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
  const diasSite = formData.getAll("dias_site").map((v) => Number(v));

  const { error } = await supabase
    .from("del_products")
    .update({
      nome: String(formData.get("nome") ?? ""),
      preco: Number(formData.get("preco") ?? 0),
      descrizione: String(formData.get("descrizione") ?? "") || null,
      categoria,
      max_acompanhamentos: categoria === "tamanho" ? maxAcompanhamentos : null,
      dias_site: diasSite.length > 0 ? diasSite : null,
    })
    .eq("id", id);
  if (error) throw new Error(`Não foi possível atualizar o item: ${error.message}`);

  revalidatePath("/restaurante/vendas");
  revalidatePath("/restaurante/custos");
  revalidatePath("/restaurante/cardapio");
  revalidatePath("/pranzo");
}

export async function toggleProductAtivo(id: string, ativo: boolean) {
  const { supabase } = await requireRestaurantSubscription();
  await supabase.from("del_products").update({ ativo: !ativo }).eq("id", id);
  revalidatePath("/restaurante/vendas");
}

export async function toggleProductVisivelSite(id: string, visivelSite: boolean) {
  const { supabase } = await requireRestaurantSubscription();
  await supabase.from("del_products").update({ visivel_site: !visivelSite }).eq("id", id);
  revalidatePath("/restaurante/vendas");
  revalidatePath("/pranzo");
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

const STATUS_TIMESTAMP_COLUMN: Record<string, string> = {
  novo: "chegou_cozinha_em",
  "em preparo": "em_preparo_em",
  pronto: "pronto_em",
  entregue: "entregue_em",
};

export async function updateOrderStatus(id: string, status: string) {
  const { supabase } = await requireRestaurantSubscription();
  const update: Record<string, string> = { status };
  const coluna = STATUS_TIMESTAMP_COLUMN[status];
  if (coluna) update[coluna] = new Date().toISOString();
  await supabase.from("del_orders").update(update).eq("id", id);
  revalidatePath("/restaurante/vendas");
  revalidatePath("/restaurante/cozinha");
}

export async function deleteOrder(id: string) {
  const { supabase } = await requireRestaurantSubscription();
  await supabase.from("del_orders").delete().eq("id", id);
  revalidatePath("/restaurante/vendas");
}

export async function updateFiscalConfig(formData: FormData) {
  const { supabase, restaurantOwnerId, isOwner } = await requireRestaurantSubscription();
  if (!isOwner) throw new Error("Apenas o dono do restaurante pode editar os dados fiscais.");

  const { error } = await supabase.from("del_fiscal_config").upsert(
    {
      owner_id: restaurantOwnerId,
      razao_social: String(formData.get("razao_social") ?? "").trim() || null,
      nome_fantasia: String(formData.get("nome_fantasia") ?? "").trim() || null,
      cnpj: String(formData.get("cnpj") ?? "").trim() || null,
      inscricao_estadual: String(formData.get("inscricao_estadual") ?? "").trim() || null,
      regime_tributario: String(formData.get("regime_tributario") ?? "mei"),
      logradouro: String(formData.get("logradouro") ?? "").trim() || null,
      numero: String(formData.get("numero") ?? "").trim() || null,
      bairro: String(formData.get("bairro") ?? "").trim() || null,
      municipio: String(formData.get("municipio") ?? "").trim() || null,
      uf: String(formData.get("uf") ?? "").trim().toUpperCase() || null,
      cep: String(formData.get("cep") ?? "").trim() || null,
      crt: formData.get("crt") ? Number(formData.get("crt")) : null,
      ambiente: String(formData.get("ambiente") ?? "homologacao"),
      provedor: String(formData.get("provedor") ?? "") || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_id" },
  );
  if (error) throw new Error(`Não foi possível salvar os dados fiscais: ${error.message}`);

  revalidatePath("/restaurante/fiscal");
}

export async function updateProductFiscal(id: string, formData: FormData) {
  const { supabase } = await requireRestaurantSubscription();

  const { error } = await supabase
    .from("del_products")
    .update({
      ncm: String(formData.get("ncm") ?? "").trim() || null,
      cfop: String(formData.get("cfop") ?? "").trim() || "5102",
      cest: String(formData.get("cest") ?? "").trim() || null,
      origem: Number(formData.get("origem") ?? 0),
    })
    .eq("id", id);
  if (error) throw new Error(`Não foi possível salvar os dados fiscais do produto: ${error.message}`);

  revalidatePath("/restaurante/fiscal");
}

export async function emitirNotaFiscal(orderId: string) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();
  await emitirNotaFiscalParaPedido(supabase, { ownerId: restaurantOwnerId, orderId });
  revalidatePath("/restaurante/vendas");
  revalidatePath("/restaurante/fiscal");
}

export async function cancelarNotaFiscal(notaId: string, formData: FormData) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();
  const justificativa = String(formData.get("justificativa") ?? "").trim();
  if (justificativa.length < 15) {
    throw new Error("A justificativa do cancelamento precisa ter pelo menos 15 caracteres (exigência da SEFAZ).");
  }
  const resultado = await cancelarNotaFiscalLib(supabase, { ownerId: restaurantOwnerId, notaId, justificativa });
  if (resultado.status === "erro") {
    throw new Error(resultado.mensagemErro ?? "Não foi possível cancelar a nota.");
  }
  revalidatePath("/restaurante/vendas");
  revalidatePath("/restaurante/fiscal");
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

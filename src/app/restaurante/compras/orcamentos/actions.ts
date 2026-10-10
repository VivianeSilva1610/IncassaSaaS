"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { getResendConfigForRestaurant } from "@/lib/delivery/providers";
import { registrarAtividade } from "@/lib/activity-log";

const baseUrl = "/restaurante/compras/orcamentos";

function go(kind: "sucesso" | "erro", message: string, path = baseUrl): never {
  redirect(`${path}?${kind}=${encodeURIComponent(message)}`);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]!);
}

// Agrupa solicitações abertas num orçamento e convida os fornecedores
// escolhidos — nenhum preço (nem custo de referência) é enviado nesse
// momento, só produto e quantidade.
export async function criarOrcamento(formData: FormData) {
  const { user, supabase, restaurantOwnerId } = await requireRestaurantSubscription("compras");
  const observacao = String(formData.get("observacao") ?? "").trim().slice(0, 1000) || null;

  const solicitacaoIds = [...formData.keys()]
    .filter((key) => key.startsWith("solicitacao_"))
    .map((key) => key.replace("solicitacao_", ""))
    .filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  const fornecedorIds = [...formData.keys()]
    .filter((key) => key.startsWith("fornecedor_"))
    .map((key) => key.replace("fornecedor_", ""))
    .filter((id) => /^[0-9a-f-]{36}$/i.test(id));

  if (solicitacaoIds.length === 0) go("erro", "Selecione pelo menos uma solicitação.");
  if (fornecedorIds.length === 0) go("erro", "Selecione pelo menos um fornecedor.");

  const [{ data: solicitacoes }, { data: fornecedores }] = await Promise.all([
    supabase.from("del_solicitacoes_compra").select("*").eq("owner_id", restaurantOwnerId).eq("status", "aberta").in("id", solicitacaoIds),
    supabase.from("del_fornecedores").select("id").eq("owner_id", restaurantOwnerId).in("id", fornecedorIds),
  ]);
  if (!solicitacoes || solicitacoes.length === 0) go("erro", "As solicitações selecionadas não estão mais disponíveis.");
  if (!fornecedores || fornecedores.length !== fornecedorIds.length) go("erro", "Um dos fornecedores selecionados não foi encontrado.");

  const { data: orcamento, error: orcamentoError } = await supabase
    .from("del_orcamentos_compra")
    .insert({ owner_id: restaurantOwnerId, observacao, criado_por: user.id })
    .select("id")
    .single();
  if (orcamentoError || !orcamento) go("erro", "Não foi possível criar o orçamento.");

  const { error: itensError } = await supabase.from("del_orcamento_itens").insert(
    solicitacoes.map((s) => ({
      orcamento_id: orcamento.id,
      owner_id: restaurantOwnerId,
      solicitacao_id: s.id,
      ingrediente_id: s.ingrediente_id,
      descricao_snapshot: s.descricao_snapshot,
      unidade_snapshot: s.unidade_snapshot,
      quantidade: s.quantidade,
    })),
  );
  if (itensError) {
    await supabase.from("del_orcamentos_compra").delete().eq("id", orcamento.id);
    go("erro", "O orçamento foi iniciado, mas seus itens não puderam ser registrados.");
  }

  const { error: fornecedoresError } = await supabase.from("del_orcamento_fornecedores").insert(
    fornecedorIds.map((fornecedorId) => ({ orcamento_id: orcamento.id, owner_id: restaurantOwnerId, fornecedor_id: fornecedorId })),
  );
  if (fornecedoresError) {
    await supabase.from("del_orcamentos_compra").delete().eq("id", orcamento.id);
    go("erro", "O orçamento foi iniciado, mas os fornecedores não puderam ser registrados.");
  }

  await supabase
    .from("del_solicitacoes_compra")
    .update({ status: "em_orcamento", updated_at: new Date().toISOString() })
    .in("id", solicitacoes.map((s) => s.id));

  await registrarAtividade(supabase, {
    ownerId: restaurantOwnerId, atorEmail: user.email, acao: "orcamento_compra_criado", entidade: "orcamento_compra", entidadeId: orcamento.id,
  });

  revalidatePath(baseUrl);
  revalidatePath("/restaurante/compras/solicitacoes");
  go("sucesso", "Orçamento criado. Agora envie para os fornecedores selecionados.", `${baseUrl}/${orcamento.id}`);
}

export async function enviarOrcamentoEmail(orcamentoId: string, orcamentoFornecedorId: string, formData: FormData) {
  const { user, supabase, restaurantOwnerId, isGerente } = await requireRestaurantSubscription("compras");
  const retorno = `${baseUrl}/${orcamentoId}`;
  if (!isGerente) go("erro", "Somente o dono ou gerente pode enviar o orçamento.", retorno);

  const destinatario = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destinatario)) go("erro", "Informe um e-mail válido.", retorno);

  const [{ data: orcamento }, { data: convite }, { data: itens }, { data: identidade }] = await Promise.all([
    supabase.from("del_orcamentos_compra").select("id, numero_controle, observacao").eq("id", orcamentoId).eq("owner_id", restaurantOwnerId).maybeSingle(),
    supabase.from("del_orcamento_fornecedores").select("id, fornecedor_id").eq("id", orcamentoFornecedorId).eq("orcamento_id", orcamentoId).eq("owner_id", restaurantOwnerId).maybeSingle(),
    supabase.from("del_orcamento_itens").select("descricao_snapshot, unidade_snapshot, quantidade").eq("orcamento_id", orcamentoId).eq("owner_id", restaurantOwnerId),
    supabase.from("restaurants").select("id, name").eq("owner_user_id", restaurantOwnerId).maybeSingle(),
  ]);
  if (!orcamento || !convite) go("erro", "Orçamento ou fornecedor não encontrado.", retorno);
  const emailConfig = identidade ? await getResendConfigForRestaurant(supabase, identidade.id) : null;
  if (!emailConfig) go("erro", "Configure o envio de e-mail em Integrações antes de enviar orçamentos a fornecedores.", retorno);

  const { data: fornecedor } = await supabase.from("del_fornecedores").select("razao_social, nome_fantasia").eq("id", convite.fornecedor_id).eq("owner_id", restaurantOwnerId).maybeSingle();

  // Só produto e quantidade — nenhum custo de referência interno é incluído.
  const linhas = (itens ?? [])
    .map((item) => `<tr><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(item.descricao_snapshot)}</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">${Number(item.quantidade)} ${escapeHtml(item.unidade_snapshot)}</td></tr>`)
    .join("");
  const restaurante = identidade?.name || "Restaurante";

  const { error } = await new Resend(emailConfig.apiKey).emails.send({
    from: emailConfig.fromName ? `${emailConfig.fromName} <${emailConfig.fromEmail}>` : emailConfig.fromEmail,
    to: destinatario,
    subject: `Solicitação de orçamento ${orcamento.numero_controle} — ${restaurante}`,
    html: `<div style="font-family:Arial,sans-serif;color:#222"><h1>Solicitação de orçamento ${orcamento.numero_controle}</h1><p><strong>${escapeHtml(restaurante)}</strong></p><p>Olá, ${escapeHtml(fornecedor?.nome_fantasia || fornecedor?.razao_social || "")}! Pedimos a gentileza de nos enviar preço, prazo de entrega e condição de pagamento para os itens abaixo.</p><table style="width:100%;border-collapse:collapse"><thead><tr><th style="padding:8px;text-align:left">Material</th><th style="padding:8px;text-align:right">Quantidade</th></tr></thead><tbody>${linhas}</tbody></table>${orcamento.observacao ? `<p><strong>Observações:</strong> ${escapeHtml(orcamento.observacao)}</p>` : ""}<p>Por favor, responda a este e-mail com sua proposta.</p></div>`,
  });
  if (error) go("erro", `Não foi possível enviar: ${error.message}`, retorno);

  await Promise.all([
    supabase.from("del_fornecedores").update({ email: destinatario, updated_at: new Date().toISOString() }).eq("id", convite.fornecedor_id).eq("owner_id", restaurantOwnerId),
    supabase.from("del_orcamento_fornecedores").update({ enviado_email_para: destinatario, enviado_email_em: new Date().toISOString(), enviado_email_por: user.id }).eq("id", orcamentoFornecedorId).eq("owner_id", restaurantOwnerId),
  ]);

  revalidatePath(retorno);
  go("sucesso", `Orçamento enviado para ${destinatario}.`, retorno);
}

export async function registrarRespostaFornecedor(orcamentoId: string, orcamentoFornecedorId: string, formData: FormData) {
  const { user, supabase, restaurantOwnerId, isGerente } = await requireRestaurantSubscription("compras");
  const retorno = `${baseUrl}/${orcamentoId}`;
  if (!isGerente) go("erro", "Somente o dono ou gerente pode registrar a resposta do fornecedor.", retorno);

  const { data: itens } = await supabase.from("del_orcamento_itens").select("id").eq("orcamento_id", orcamentoId).eq("owner_id", restaurantOwnerId);
  if (!itens || itens.length === 0) go("erro", "Orçamento sem itens.", retorno);

  const precos = itens.map((item) => ({ id: item.id, preco: Number(formData.get(`preco_${item.id}`) ?? NaN) }));
  if (precos.some((p) => !Number.isFinite(p.preco) || p.preco < 0)) {
    go("erro", "Informe um preço válido para todos os itens.", retorno);
  }

  const frete = formData.get("frete") ? Number(formData.get("frete")) : 0;
  const desconto = formData.get("desconto") ? Number(formData.get("desconto")) : 0;
  const prazoEntregaDias = formData.get("prazo_entrega_dias") ? Number(formData.get("prazo_entrega_dias")) : null;
  const condicaoPagamento = String(formData.get("condicao_pagamento") ?? "").trim().slice(0, 200) || null;
  const observacaoResposta = String(formData.get("observacao_resposta") ?? "").trim().slice(0, 1000) || null;

  const { error: updateError } = await supabase
    .from("del_orcamento_fornecedores")
    .update({
      frete,
      desconto,
      prazo_entrega_dias: prazoEntregaDias,
      condicao_pagamento: condicaoPagamento,
      observacao_resposta: observacaoResposta,
      respondido_em: new Date().toISOString(),
      registrado_por: user.id,
    })
    .eq("id", orcamentoFornecedorId)
    .eq("orcamento_id", orcamentoId)
    .eq("owner_id", restaurantOwnerId);
  if (updateError) go("erro", `Não foi possível salvar a resposta: ${updateError.message}`, retorno);

  // Apaga qualquer resposta anterior pra esse fornecedor (permite corrigir)
  // e grava os preços atuais.
  await supabase.from("del_orcamento_resposta_itens").delete().eq("orcamento_fornecedor_id", orcamentoFornecedorId).eq("owner_id", restaurantOwnerId);
  const { error: itensError } = await supabase.from("del_orcamento_resposta_itens").insert(
    precos.map((p) => ({
      orcamento_fornecedor_id: orcamentoFornecedorId,
      orcamento_item_id: p.id,
      owner_id: restaurantOwnerId,
      preco_unitario: p.preco,
    })),
  );
  if (itensError) go("erro", `Não foi possível salvar os preços: ${itensError.message}`, retorno);

  await supabase.from("del_orcamentos_compra").update({ status: "respondido", updated_at: new Date().toISOString() }).eq("id", orcamentoId).eq("owner_id", restaurantOwnerId).eq("status", "aberto");

  revalidatePath(retorno);
  go("sucesso", "Resposta do fornecedor registrada.", retorno);
}

// Aprovação: o gerente escolhe o orçamento vencedor entre as respostas
// recebidas. Só a partir daqui nasce o pedido de compra numerado — com os
// preços acordados daquele fornecedor.
export async function aprovarOrcamento(orcamentoId: string, orcamentoFornecedorId: string) {
  const { user, supabase, restaurantOwnerId, isGerente } = await requireRestaurantSubscription("compras");
  const retorno = `${baseUrl}/${orcamentoId}`;
  if (!isGerente) go("erro", "Somente o dono ou gerente pode aprovar um orçamento.", retorno);

  const [{ data: orcamento }, { data: resposta }, { data: itens }] = await Promise.all([
    supabase.from("del_orcamentos_compra").select("*").eq("id", orcamentoId).eq("owner_id", restaurantOwnerId).maybeSingle(),
    supabase.from("del_orcamento_fornecedores").select("*").eq("id", orcamentoFornecedorId).eq("orcamento_id", orcamentoId).eq("owner_id", restaurantOwnerId).maybeSingle(),
    supabase.from("del_orcamento_itens").select("*").eq("orcamento_id", orcamentoId).eq("owner_id", restaurantOwnerId),
  ]);
  if (!orcamento || orcamento.status === "aprovado" || orcamento.status === "cancelado") go("erro", "Este orçamento não está mais disponível para aprovação.", retorno);
  if (!resposta || !resposta.respondido_em) go("erro", "Esse fornecedor ainda não respondeu o orçamento.", retorno);
  if (!itens || itens.length === 0) go("erro", "Orçamento sem itens.", retorno);

  const { data: respostaItens } = await supabase
    .from("del_orcamento_resposta_itens")
    .select("orcamento_item_id, preco_unitario")
    .eq("orcamento_fornecedor_id", orcamentoFornecedorId)
    .eq("owner_id", restaurantOwnerId);
  const precoPorItem = new Map((respostaItens ?? []).map((r) => [r.orcamento_item_id, Number(r.preco_unitario)]));

  const { data: pedido, error: pedidoError } = await supabase
    .from("del_pedidos_compra")
    .insert({
      owner_id: restaurantOwnerId,
      fornecedor_id: resposta.fornecedor_id,
      observacao: orcamento.observacao,
      criado_por: user.id,
      orcamento_id: orcamentoId,
    })
    .select("id")
    .single();
  if (pedidoError || !pedido) go("erro", "Não foi possível gerar o pedido de compra.", retorno);

  const { error: itensError } = await supabase.from("del_pedidos_compra_itens").insert(
    itens.map((item) => ({
      pedido_compra_id: pedido.id,
      owner_id: restaurantOwnerId,
      ingrediente_id: item.ingrediente_id,
      descricao_snapshot: item.descricao_snapshot,
      unidade_snapshot: item.unidade_snapshot,
      quantidade: item.quantidade,
      custo_unitario_estimado: precoPorItem.get(item.id) ?? null,
    })),
  );
  if (itensError) {
    await supabase.from("del_pedidos_compra").delete().eq("id", pedido.id);
    go("erro", "O pedido foi iniciado, mas seus itens não puderam ser registrados.", retorno);
  }

  await supabase
    .from("del_orcamentos_compra")
    .update({
      status: "aprovado",
      aprovado_por: user.id,
      aprovado_em: new Date().toISOString(),
      fornecedor_vencedor_id: resposta.fornecedor_id,
      pedido_compra_id: pedido.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orcamentoId)
    .eq("owner_id", restaurantOwnerId);

  const solicitacaoIds = itens.map((item) => item.solicitacao_id).filter((id): id is string => !!id);
  if (solicitacaoIds.length > 0) {
    await supabase.from("del_solicitacoes_compra").update({ status: "atendida", updated_at: new Date().toISOString() }).in("id", solicitacaoIds);
  }

  await registrarAtividade(supabase, {
    ownerId: restaurantOwnerId, atorEmail: user.email, acao: "orcamento_compra_aprovado",
    entidade: "orcamento_compra", entidadeId: orcamentoId, detalhe: `pedido ${pedido.id}`,
  });

  revalidatePath(baseUrl);
  revalidatePath("/restaurante/compras/solicitacoes");
  revalidatePath("/restaurante/compras/pedidos");
  go("sucesso", "Orçamento aprovado — pedido de compra gerado como rascunho.", "/restaurante/compras/pedidos");
}

export async function cancelarOrcamento(orcamentoId: string) {
  const { supabase, restaurantOwnerId, isGerente, user } = await requireRestaurantSubscription("compras");
  const retorno = `${baseUrl}/${orcamentoId}`;
  if (!isGerente) go("erro", "Somente o dono ou gerente pode cancelar um orçamento.", retorno);

  const { data: itens } = await supabase.from("del_orcamento_itens").select("solicitacao_id").eq("orcamento_id", orcamentoId).eq("owner_id", restaurantOwnerId);

  const { error } = await supabase
    .from("del_orcamentos_compra")
    .update({ status: "cancelado", updated_at: new Date().toISOString() })
    .eq("id", orcamentoId)
    .eq("owner_id", restaurantOwnerId)
    .neq("status", "aprovado");
  if (error) go("erro", "Não foi possível cancelar o orçamento.", retorno);

  const solicitacaoIds = (itens ?? []).map((item) => item.solicitacao_id).filter((id): id is string => !!id);
  if (solicitacaoIds.length > 0) {
    await supabase.from("del_solicitacoes_compra").update({ status: "aberta", updated_at: new Date().toISOString() }).in("id", solicitacaoIds).eq("status", "em_orcamento");
  }

  await registrarAtividade(supabase, {
    ownerId: restaurantOwnerId, atorEmail: user.email, acao: "orcamento_compra_cancelado", entidade: "orcamento_compra", entidadeId: orcamentoId,
  });

  revalidatePath(baseUrl);
  revalidatePath("/restaurante/compras/solicitacoes");
  go("sucesso", "Orçamento cancelado.");
}

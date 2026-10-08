"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { getResendConfigForRestaurant } from "@/lib/delivery/providers";

const baseUrl = "/restaurante/compras/pedidos";

function go(kind: "sucesso" | "erro", message: string): never {
  redirect(`${baseUrl}?${kind}=${encodeURIComponent(message)}`);
}

export async function criarPedidoCompra(formData: FormData) {
  const { user, supabase, restaurantOwnerId } = await requireRestaurantSubscription("compras");
  const fornecedorId = String(formData.get("fornecedor_id") ?? "");
  const observacao = String(formData.get("observacao") ?? "").trim().slice(0, 1000) || null;
  if (!/^[0-9a-f-]{36}$/i.test(fornecedorId)) go("erro", "Selecione o fornecedor.");

  const selecionados = [...formData.keys()]
    .filter((key) => key.startsWith("selecionar_"))
    .map((key) => key.replace("selecionar_", ""))
    .filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (selecionados.length === 0) go("erro", "Selecione pelo menos um material.");

  const [{ data: fornecedor }, { data: ingredientes }] = await Promise.all([
    supabase.from("del_fornecedores").select("id").eq("id", fornecedorId).eq("owner_id", restaurantOwnerId).maybeSingle(),
    supabase.from("del_ingredients").select("id, nome, unidade, custo_unitario").eq("owner_id", restaurantOwnerId).in("id", selecionados),
  ]);
  if (!fornecedor) go("erro", "Fornecedor não encontrado neste estabelecimento.");
  if (!ingredientes || ingredientes.length !== selecionados.length) go("erro", "Um dos materiais selecionados não foi encontrado.");

  const itens = ingredientes.map((ingrediente) => ({
    ingrediente,
    quantidade: Number(formData.get(`quantidade_${ingrediente.id}`) ?? 0),
  }));
  if (itens.some((item) => !Number.isFinite(item.quantidade) || item.quantidade <= 0)) {
    go("erro", "Informe uma quantidade maior que zero para todos os materiais selecionados.");
  }

  const { data: pedido, error: pedidoError } = await supabase.from("del_pedidos_compra").insert({
    owner_id: restaurantOwnerId,
    fornecedor_id: fornecedorId,
    observacao,
    criado_por: user.id,
  }).select("id").single();
  if (pedidoError || !pedido) go("erro", "Não foi possível criar o pedido de compra.");

  const { error: itensError } = await supabase.from("del_pedidos_compra_itens").insert(itens.map(({ ingrediente, quantidade }) => ({
    pedido_compra_id: pedido.id,
    owner_id: restaurantOwnerId,
    ingrediente_id: ingrediente.id,
    descricao_snapshot: ingrediente.nome,
    unidade_snapshot: ingrediente.unidade,
    quantidade,
    custo_unitario_estimado: ingrediente.custo_unitario,
  })));
  if (itensError) {
    await supabase.from("del_pedidos_compra").delete().eq("id", pedido.id).eq("owner_id", restaurantOwnerId);
    go("erro", "O pedido foi iniciado, mas seus itens não puderam ser registrados.");
  }

  revalidatePath(baseUrl);
  go("sucesso", "Pedido de compra criado como rascunho.");
}

export async function alterarStatusPedidoCompra(pedidoId: string, novoStatus: "emitido" | "cancelado") {
  const { user, supabase, restaurantOwnerId, isGerente } = await requireRestaurantSubscription("compras");
  if (!isGerente) go("erro", "Somente o dono ou gerente autorizado pode emitir ou cancelar pedidos.");
  if (!/^[0-9a-f-]{36}$/i.test(pedidoId)) go("erro", "Pedido inválido.");

  const update = novoStatus === "emitido"
    ? { status: "emitido", emitido_por: user.id, emitido_em: new Date().toISOString(), updated_at: new Date().toISOString() }
    : { status: "cancelado", cancelado_em: new Date().toISOString(), updated_at: new Date().toISOString() };
  const { data, error } = await supabase.from("del_pedidos_compra").update(update)
    .eq("id", pedidoId).eq("owner_id", restaurantOwnerId).eq("status", "rascunho").select("id").maybeSingle();
  if (error || !data) go("erro", "O pedido não está mais disponível para esta operação.");

  revalidatePath(baseUrl);
  go("sucesso", novoStatus === "emitido" ? "Pedido emitido ao fornecedor." : "Pedido cancelado.");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]!);
}

export async function enviarPedidoCompraEmail(pedidoId: string, formData: FormData) {
  const { user, supabase, restaurantOwnerId, isGerente } = await requireRestaurantSubscription("compras");
  const retorno = `/restaurante/compras/pedidos/${pedidoId}/imprimir`;
  if (!isGerente) redirect(`${retorno}?erro=${encodeURIComponent("Somente o dono ou gerente pode enviar o pedido.")}`);
  const destinatario = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destinatario)) redirect(`${retorno}?erro=${encodeURIComponent("Informe um e-mail válido.")}`);

  const { data: pedido } = await supabase.from("del_pedidos_compra")
    .select("id, numero, numero_controle, status, observacao, fornecedor_id")
    .eq("id", pedidoId).eq("owner_id", restaurantOwnerId).maybeSingle();
  if (!pedido || pedido.status !== "emitido") redirect(`${retorno}?erro=${encodeURIComponent("Somente pedidos emitidos podem ser enviados.")}`);
  const [{ data: fornecedor }, { data: itens }, { data: identidade }] = await Promise.all([
    supabase.from("del_fornecedores").select("razao_social, nome_fantasia").eq("id", pedido.fornecedor_id).eq("owner_id", restaurantOwnerId).maybeSingle(),
    supabase.from("del_pedidos_compra_itens").select("descricao_snapshot, unidade_snapshot, quantidade, custo_unitario_estimado").eq("pedido_compra_id", pedido.id).eq("owner_id", restaurantOwnerId),
    supabase.from("restaurants").select("id, name").eq("owner_user_id", restaurantOwnerId).maybeSingle(),
  ]);
  const emailConfig = identidade ? await getResendConfigForRestaurant(supabase, identidade.id) : null;
  if (!emailConfig) redirect(`${retorno}?erro=${encodeURIComponent("Configure o envio de e-mail em Integrações antes de enviar pedidos a fornecedores.")}`);

  const linhas = (itens ?? []).map((item) => {
    const quantidade = Number(item.quantidade);
    const custo = item.custo_unitario_estimado == null ? null : Number(item.custo_unitario_estimado);
    return `<tr><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(item.descricao_snapshot)}</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">${quantidade} ${escapeHtml(item.unidade_snapshot)}</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">${custo == null ? 'A cotar' : custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr>`;
  }).join('');
  const restaurante = identidade?.name || "Restaurante";
  const { error } = await new Resend(emailConfig.apiKey).emails.send({
    from: emailConfig.fromName ? `${emailConfig.fromName} <${emailConfig.fromEmail}>` : emailConfig.fromEmail,
    to: destinatario,
    subject: `Pedido de compra ${pedido.numero_controle || `#${pedido.numero}`} — ${restaurante}`,
    html: `<div style="font-family:Arial,sans-serif;color:#222"><h1>Pedido de compra ${pedido.numero_controle || `#${pedido.numero}`}</h1><p><strong>${escapeHtml(restaurante)}</strong></p><p>Fornecedor: ${escapeHtml(fornecedor?.nome_fantasia || fornecedor?.razao_social || 'Fornecedor')}</p><table style="width:100%;border-collapse:collapse"><thead><tr><th style="padding:8px;text-align:left">Material</th><th style="padding:8px;text-align:right">Quantidade</th><th style="padding:8px;text-align:right">Custo estimado</th></tr></thead><tbody>${linhas}</tbody></table>${pedido.observacao ? `<p><strong>Observações:</strong> ${escapeHtml(pedido.observacao)}</p>` : ''}<p>Por favor, confirme disponibilidade, valores e prazo de entrega respondendo a este e-mail.</p></div>`,
  });
  if (error) redirect(`${retorno}?erro=${encodeURIComponent(`Não foi possível enviar: ${error.message}`)}`);

  await Promise.all([
    supabase.from("del_fornecedores").update({ email: destinatario, updated_at: new Date().toISOString() }).eq("id", pedido.fornecedor_id).eq("owner_id", restaurantOwnerId),
    supabase.from("del_pedidos_compra").update({ enviado_email_para: destinatario, enviado_email_em: new Date().toISOString(), enviado_email_por: user.id, updated_at: new Date().toISOString() }).eq("id", pedido.id).eq("owner_id", restaurantOwnerId),
  ]);
  revalidatePath(retorno);
  redirect(`${retorno}?sucesso=${encodeURIComponent(`Pedido enviado para ${destinatario}.`)}`);
}

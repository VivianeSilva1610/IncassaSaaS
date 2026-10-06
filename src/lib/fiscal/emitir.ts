import type { SupabaseClient } from "@supabase/supabase-js";
import { getFiscalProvider } from "./nfce";

type ItemFiscal = {
  quantidade: number;
  preco_unitario: number;
  del_products: { nome: string; ncm: string | null; cfop: string; cest: string | null; origem: number } | null;
};

export async function emitirNotaFiscalParaPedido(
  supabase: SupabaseClient,
  params: { ownerId: string; orderId: string },
) {
  const { data: config } = await supabase
    .from("del_fiscal_config")
    .select("*")
    .eq("owner_id", params.ownerId)
    .maybeSingle();

  const { data: pedido } = await supabase
    .from("del_orders")
    .select("id, totale, pago, cliente_nome, cliente_cpf_cnpj, del_order_items(quantidade, preco_unitario, del_products(nome, ncm, cfop, cest, origem))")
    .eq("id", params.orderId)
    .eq("owner_id", params.ownerId)
    .single();

  if (!pedido) throw new Error("Pedido não encontrado.");
  if (!pedido.pago) throw new Error("A nota fiscal só pode ser emitida depois da confirmação do pagamento.");

  const { data: notaAtiva } = await supabase
    .from("del_notas_fiscais")
    .select("id, status")
    .eq("owner_id", params.ownerId)
    .eq("order_id", params.orderId)
    .in("status", ["pendente", "emitida"])
    .maybeSingle();
  if (notaAtiva) {
    return { notaId: notaAtiva.id as string, status: notaAtiva.status as "pendente" | "emitida", mensagemErro: undefined };
  }

  const provider = getFiscalProvider(config?.provedor ?? null);
  const numero = config?.proxima_numeracao ?? 1;
  const serie = config?.serie ?? 1;

  const resultado = await provider.emitirNFCe({
    fiscalConfig: {
      razaoSocial: config?.razao_social ?? null,
      cnpj: config?.cnpj ?? null,
      inscricaoEstadual: config?.inscricao_estadual ?? null,
      crt: config?.crt ?? null,
      ambiente: (config?.ambiente as "homologacao" | "producao") ?? "homologacao",
      logradouro: config?.logradouro ?? null,
      numero: config?.numero ?? null,
      bairro: config?.bairro ?? null,
      municipio: config?.municipio ?? null,
      uf: config?.uf ?? null,
      cep: config?.cep ?? null,
    },
    pedido: {
      id: pedido.id,
      totale: Number(pedido.totale),
      clienteNome: pedido.cliente_nome,
      clienteCpfCnpj: pedido.cliente_cpf_cnpj,
      items: ((pedido.del_order_items ?? []) as unknown as ItemFiscal[]).map((it) => ({
        nome: it.del_products?.nome ?? "?",
        quantidade: Number(it.quantidade),
        precoUnitario: Number(it.preco_unitario),
        ncm: it.del_products?.ncm ?? null,
        cfop: it.del_products?.cfop ?? "5102",
        cest: it.del_products?.cest ?? null,
        origem: Number(it.del_products?.origem ?? 0),
      })),
    },
    numero,
    serie,
  });

  const { data: nota, error } = await supabase
    .from("del_notas_fiscais")
    .insert({
      owner_id: params.ownerId,
      order_id: params.orderId,
      status: resultado.status,
      ambiente: config?.ambiente ?? "homologacao",
      provedor: config?.provedor ?? null,
      numero: resultado.numero ?? numero,
      serie: resultado.serie ?? serie,
      chave_acesso: resultado.chaveAcesso ?? null,
      protocolo_autorizacao: resultado.protocoloAutorizacao ?? null,
      url_danfe: resultado.urlDanfe ?? null,
      url_xml: resultado.urlXml ?? null,
      erro_mensagem: resultado.mensagemErro ?? null,
      emitida_em: resultado.status === "emitida" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error || !nota) throw new Error("Não foi possível registrar a nota fiscal.");

  if (resultado.status === "emitida") {
    await supabase
      .from("del_fiscal_config")
      .update({ proxima_numeracao: numero + 1 })
      .eq("owner_id", params.ownerId);
  }

  return { notaId: nota.id as string, status: resultado.status, mensagemErro: resultado.mensagemErro };
}

export async function cancelarNotaFiscal(
  supabase: SupabaseClient,
  params: { ownerId: string; notaId: string; justificativa: string },
) {
  const { data: nota } = await supabase
    .from("del_notas_fiscais")
    .select("*")
    .eq("id", params.notaId)
    .eq("owner_id", params.ownerId)
    .single();
  if (!nota) throw new Error("Nota não encontrada.");
  if (nota.status !== "emitida") throw new Error("Só é possível cancelar uma nota emitida.");

  const { data: config } = await supabase
    .from("del_fiscal_config")
    .select("provedor")
    .eq("owner_id", params.ownerId)
    .maybeSingle();

  const provider = getFiscalProvider(config?.provedor ?? null);
  await supabase
    .from("del_notas_fiscais")
    .update({
      cancelamento_solicitado_em: new Date().toISOString(),
      justificativa_cancelamento: params.justificativa,
      cancelamento_erro: null,
    })
    .eq("id", nota.id)
    .eq("owner_id", params.ownerId);

  let resultado;
  try {
    resultado = await provider.cancelarNFCe({ chaveAcesso: nota.chave_acesso, justificativa: params.justificativa });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha inesperada ao solicitar cancelamento fiscal.";
    await supabase
      .from("del_notas_fiscais")
      .update({ cancelamento_erro: mensagem })
      .eq("id", nota.id)
      .eq("owner_id", params.ownerId);
    throw error;
  }

  if (resultado.status === "cancelada") {
    await supabase
      .from("del_notas_fiscais")
      .update({
        status: "cancelada",
        erro_mensagem: null,
        cancelamento_erro: null,
        protocolo_cancelamento: resultado.protocoloCancelamento ?? null,
        cancelada_em: resultado.canceladaEm ?? new Date().toISOString(),
      })
      .eq("id", nota.id)
      .eq("owner_id", params.ownerId);
  } else {
    await supabase
      .from("del_notas_fiscais")
      .update({ cancelamento_erro: resultado.mensagemErro ?? "Cancelamento fiscal recusado." })
      .eq("id", nota.id)
      .eq("owner_id", params.ownerId);
  }

  return resultado;
}

// Ponto único pra "pedido virou pago": marca o pagamento e já tenta emitir
// a NFC-e na sequência — usado tanto pelo webhook da Asaas (Pix do site)
// quanto pela marcação manual de pagamento em balcão/mesa/telefone. Se a
// emissão falhar (ex: nenhum provedor configurado), isso não é lançado
// como erro aqui — já fica registrado como "erro" em del_notas_fiscais,
// igual à emissão manual.
export async function confirmarPagamentoEEmitirNota(
  supabase: SupabaseClient,
  params: { ownerId: string; orderId: string; formaPagamento?: string; valorPago?: number },
) {
  const pagoEm = new Date().toISOString();
  const { data: pedidoConfirmado, error } = await supabase
    .from("del_orders")
    .update({
      pago: true,
      pago_em: pagoEm,
      forma_pagamento: params.formaPagamento ?? null,
      valor_pago: params.valorPago ?? null,
    })
    .eq("id", params.orderId)
    .eq("owner_id", params.ownerId)
    .eq("pago", false)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(`Não foi possível marcar o pedido como pago: ${error.message}`);
  if (!pedidoConfirmado) return { jaConfirmado: true as const, notaId: null };

  const { data: config } = await supabase
    .from("del_fiscal_config")
    .select("emissao_automatica")
    .eq("owner_id", params.ownerId)
    .maybeSingle();

  if (!config?.emissao_automatica) {
    return { jaConfirmado: false as const, notaId: null };
  }

  return emitirNotaFiscalParaPedido(supabase, { ownerId: params.ownerId, orderId: params.orderId });
}

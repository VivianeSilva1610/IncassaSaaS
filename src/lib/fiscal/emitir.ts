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
    .select("id, totale, cliente_nome, cliente_cpf_cnpj, del_order_items(quantidade, preco_unitario, del_products(nome, ncm, cfop, cest, origem))")
    .eq("id", params.orderId)
    .single();

  if (!pedido) throw new Error("Pedido não encontrado.");

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

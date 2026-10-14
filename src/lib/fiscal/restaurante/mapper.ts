import type { DocumentoFiscal } from "../core/documento";
import type { ResultadoCancelamento, ResultadoEmissao } from "../core/provedor";

// Converte o pedido do Restaurante (del_orders + del_fiscal_config) para o
// documento fiscal comum, e o resultado do provedor de volta para os status
// de del_notas_fiscais ('pendente' | 'emitida' | 'erro' | 'cancelada').

export type ConfigFiscalRestaurante = {
  razao_social?: string | null;
  cnpj?: string | null;
  inscricao_estadual?: string | null;
  crt?: number | null;
  ambiente?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  codigo_municipio_ibge?: string | null;
  municipio?: string | null;
  uf?: string | null;
  cep?: string | null;
} | null;

export type ItemSnapshotRestaurante = {
  nome: string;
  quantidade: number;
  preco_unitario: number;
  valor_total: number;
  ncm: string | null;
  cfop: string | null;
  cest: string | null;
  origem: number | null;
  cst: string | null;
  csosn: string | null;
  aliquota_icms: number | null;
};

export function documentoDoPedido(params: {
  config: ConfigFiscalRestaurante;
  pedido: { id: string; totale: number; clienteNome: string | null; clienteCpfCnpj: string | null };
  itens: ItemSnapshotRestaurante[];
  numero: number;
  serie: number;
}): DocumentoFiscal {
  const { config, pedido } = params;
  return {
    ref: pedido.id,
    produto: "restaurante",
    modelo: "65",
    ambiente: config?.ambiente === "producao" ? "producao" : "homologacao",
    numero: params.numero,
    serie: params.serie,
    emitente: {
      razaoSocial: config?.razao_social ?? null,
      cnpj: config?.cnpj ?? null,
      inscricaoEstadual: config?.inscricao_estadual ?? null,
      crt: config?.crt ?? null,
      endereco: {
        logradouro: config?.logradouro ?? null,
        numero: config?.numero ?? null,
        bairro: config?.bairro ?? null,
        codigoMunicipioIbge: config?.codigo_municipio_ibge ?? null,
        municipio: config?.municipio ?? null,
        uf: config?.uf ?? null,
        cep: config?.cep ?? null,
      },
    },
    destinatario: pedido.clienteNome || pedido.clienteCpfCnpj
      ? { nome: pedido.clienteNome, cpfCnpj: pedido.clienteCpfCnpj, endereco: null }
      : null,
    itens: params.itens.map((item) => ({
      descricao: item.nome,
      quantidade: item.quantidade,
      valorUnitario: item.preco_unitario,
      valorTotal: item.valor_total,
      unidade: null,
      ncm: item.ncm,
      // Sem CFOP no produto, venda dentro do estado de mercadoria
      // adquirida de terceiros — mesmo padrão de antes da camada comum.
      cfop: item.cfop ?? "5102",
      cest: item.cest,
      origem: Number(item.origem ?? 0),
      cst: item.cst,
      csosn: item.csosn,
      aliquotaIcms: item.aliquota_icms,
    })),
    // Forma de pagamento entra no documento na Fase 5 (o pedido ainda não é
    // lido com ela aqui).
    pagamentos: [],
    total: pedido.totale,
  };
}

export function statusNotaRestaurante(status: ResultadoEmissao["status"]): "emitida" | "pendente" | "erro" {
  if (status === "autorizado") return "emitida";
  if (status === "processando") return "pendente";
  return "erro";
}

export function statusCancelamentoRestaurante(status: ResultadoCancelamento["status"]): "cancelada" | "erro" {
  return status === "cancelado" ? "cancelada" : "erro";
}

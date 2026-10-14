// Documento fiscal brasileiro (NFC-e modelo 65 / NF-e modelo 55) no formato
// comum à camada fiscal — o Restaurante e o Comércio convertem os próprios
// dados (pedido, venda) para isto, e cada provedor converte isto para a API
// dele. Nada aqui conhece tabela do banco nem provedor específico.
// Plano: docs/comercio-plano-nfe-provedores.md.

export type ProdutoFiscal = "restaurante" | "comercio";
export type ModeloFiscal = "55" | "65";
export type AmbienteFiscal = "homologacao" | "producao";

export type EnderecoFiscal = {
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  codigoMunicipioIbge: string | null;
  municipio: string | null;
  uf: string | null;
  cep: string | null;
};

export type EmitenteFiscal = {
  razaoSocial: string | null;
  cnpj: string | null;
  inscricaoEstadual: string | null;
  crt: number | null;
  endereco: EnderecoFiscal;
};

export type DestinatarioFiscal = {
  nome: string | null;
  cpfCnpj: string | null;
  endereco: EnderecoFiscal | null;
};

export type ItemFiscal = {
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  unidade: string | null;
  ncm: string | null;
  cfop: string;
  cest: string | null;
  origem: number;
  cst: string | null;
  csosn: string | null;
  aliquotaIcms: number | null;
};

export type PagamentoFiscal = { forma: string; valor: number };

export type DocumentoFiscal = {
  // Identificador do documento no INCASSA — vai como referência para o
  // provedor e é o que garante a idempotência (consultar antes de reenviar).
  ref: string;
  produto: ProdutoFiscal;
  modelo: ModeloFiscal;
  ambiente: AmbienteFiscal;
  numero: number;
  serie: number;
  emitente: EmitenteFiscal;
  destinatario: DestinatarioFiscal | null;
  itens: ItemFiscal[];
  pagamentos: PagamentoFiscal[];
  total: number;
};

import type { DocumentoFiscal } from "./documento";

// Referência técnica conferida em 14/10/2026. A transmissão só poderá ser
// implementada contra os XSD oficiais vigentes; não copiar schemas para o
// código nem presumir que uma versão anterior continua válida.
export const REFERENCIA_SCHEMA_NFE = {
  leiaute: "4.00",
  pacote: "010f",
  notaTecnicaRtc: "2025.002 v1.50",
  cnpjAlfanumerico: "2026.004 v1.01",
  consultadoEm: "2026-10-14",
} as const;

export type ResultadoValidacaoFiscal = {
  prontoParaTransmissao: boolean;
  erros: string[];
  avisos: string[];
};

function vazio(valor: unknown): boolean {
  return valor === null || valor === undefined || (typeof valor === "string" && valor.trim() === "");
}

function quaseIgual(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.005;
}

export function validarDocumentoParaTransmissao(documento: DocumentoFiscal): ResultadoValidacaoFiscal {
  const erros: string[] = [];
  const avisos: string[] = [];
  const emitente = documento.emitente;
  const endereco = emitente.endereco;

  if (vazio(emitente.razaoSocial)) erros.push("Razão social do emitente ausente.");
  const cnpj = emitente.cnpj?.replace(/[.\-\/]/g, "").toUpperCase() ?? "";
  // Novas inscrições podem usar CNPJ alfanumérico. Os dois últimos caracteres
  // continuam sendo dígitos verificadores; a validação matemática entra junto
  // com o pacote XSD oficial, antes da transmissão.
  if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(cnpj)) erros.push("CNPJ do emitente ausente ou com formato inválido.");
  if (vazio(emitente.inscricaoEstadual)) erros.push("Inscrição Estadual do emitente ausente.");
  if (![1, 2, 3, 4].includes(emitente.crt ?? 0)) erros.push("CRT do emitente ausente ou inválido.");

  for (const [valor, rotulo] of [
    [endereco.logradouro, "logradouro"],
    [endereco.numero, "número"],
    [endereco.bairro, "bairro"],
    [endereco.codigoMunicipioIbge, "código IBGE do município"],
    [endereco.municipio, "município"],
    [endereco.uf, "UF"],
    [endereco.cep, "CEP"],
  ] as const) {
    if (vazio(valor)) erros.push(`Endereço do emitente sem ${rotulo}.`);
  }
  if (endereco.codigoMunicipioIbge && !/^\d{7}$/.test(endereco.codigoMunicipioIbge)) erros.push("Código IBGE do município deve ter 7 dígitos.");
  if (endereco.uf && !/^[A-Z]{2}$/.test(endereco.uf)) erros.push("UF do emitente deve ter 2 letras maiúsculas.");
  if (endereco.cep && !/^\d{8}$/.test(endereco.cep.replace(/\D/g, ""))) erros.push("CEP do emitente deve ter 8 dígitos.");

  if (!Number.isInteger(documento.numero) || documento.numero <= 0) erros.push("Número fiscal deve ser inteiro positivo.");
  if (!Number.isInteger(documento.serie) || documento.serie <= 0) erros.push("Série fiscal deve ser inteira positiva.");
  if (documento.itens.length === 0) erros.push("Documento fiscal sem itens.");

  documento.itens.forEach((item, indice) => {
    const prefixo = `Item ${indice + 1}`;
    if (vazio(item.descricao)) erros.push(`${prefixo}: descrição ausente.`);
    if (!(item.quantidade > 0)) erros.push(`${prefixo}: quantidade deve ser positiva.`);
    if (!(item.valorUnitario >= 0) || !(item.valorTotal >= 0)) erros.push(`${prefixo}: valores inválidos.`);
    if (!quaseIgual(item.quantidade * item.valorUnitario, item.valorTotal)) erros.push(`${prefixo}: total diverge de quantidade × valor unitário.`);
    if (!item.ncm || !/^\d{8}$/.test(item.ncm)) erros.push(`${prefixo}: NCM ausente ou inválido.`);
    if (!/^\d{4}$/.test(item.cfop)) erros.push(`${prefixo}: CFOP ausente ou inválido.`);
    if (!Number.isInteger(item.origem) || item.origem < 0 || item.origem > 8) erros.push(`${prefixo}: origem da mercadoria inválida.`);
    if (!item.unidade) erros.push(`${prefixo}: unidade comercial ausente.`);
    if (emitente.crt === 1 || emitente.crt === 4) {
      if (!item.csosn || !/^\d{3}$/.test(item.csosn)) erros.push(`${prefixo}: CSOSN ausente ou inválido para o CRT informado.`);
    } else if (emitente.crt === 2 || emitente.crt === 3) {
      if (!item.cst || !/^\d{2}$/.test(item.cst)) erros.push(`${prefixo}: CST ausente ou inválido para o CRT informado.`);
    }
  });

  const totalItens = documento.itens.reduce((soma, item) => soma + item.valorTotal, 0);
  if (!quaseIgual(totalItens, documento.total)) erros.push("Total do documento diverge da soma dos itens.");
  if (documento.modelo === "65" && documento.pagamentos.length === 0) erros.push("NFC-e sem forma de pagamento.");
  const totalPagamentos = documento.pagamentos.reduce((soma, pagamento) => soma + pagamento.valor, 0);
  if (documento.pagamentos.length > 0 && totalPagamentos + 0.005 < documento.total) erros.push("Pagamentos são menores que o total do documento.");

  if (documento.ambiente === "homologacao") avisos.push("Documento destinado exclusivamente à homologação, sem validade fiscal.");
  avisos.push(`Validar contra XSD ${REFERENCIA_SCHEMA_NFE.pacote} antes de qualquer transmissão.`);
  return { prontoParaTransmissao: erros.length === 0, erros, avisos };
}


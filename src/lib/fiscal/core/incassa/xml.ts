import type { DocumentoFiscal } from "../documento";
import { validarDocumentoParaTransmissao } from "../validacao";

export type ParametrosXmlNfe = {
  codigoUf: string;
  emitidaEm: Date;
  codigoNumerico: string;
  naturezaOperacao: string;
};

export type XmlNfePreparado = {
  chaveAcesso: string;
  id: `NFe${string}`;
  xmlSemAssinatura: string;
};

function escaparXml(valor: string | number): string {
  return String(valor).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function somenteDigitos(valor: string | null): string {
  return valor?.replace(/\D/g, "") ?? "";
}

function decimal(valor: number, casas = 2): string {
  return valor.toFixed(casas);
}

function inteiro(valor: number, tamanho: number): string {
  return String(valor).padStart(tamanho, "0");
}

export function calcularDigitoChaveNfe(chaveSemDigito: string): number {
  if (!/^\d{43}$/.test(chaveSemDigito)) throw new Error("A chave sem dígito deve conter exatamente 43 números.");
  let peso = 2;
  let soma = 0;
  for (let indice = chaveSemDigito.length - 1; indice >= 0; indice -= 1) {
    soma += Number(chaveSemDigito[indice]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const resto = soma % 11;
  return resto === 0 || resto === 1 ? 0 : 11 - resto;
}

export function gerarChaveAcessoNfe(documento: DocumentoFiscal, parametros: ParametrosXmlNfe): string {
  const cnpj = somenteDigitos(documento.emitente.cnpj);
  const aamm = `${String(parametros.emitidaEm.getUTCFullYear()).slice(-2)}${inteiro(parametros.emitidaEm.getUTCMonth() + 1, 2)}`;
  if (!/^\d{2}$/.test(parametros.codigoUf)) throw new Error("Código da UF deve conter 2 números.");
  if (!/^\d{8}$/.test(parametros.codigoNumerico)) throw new Error("Código numérico deve conter 8 números.");
  if (!/^\d{14}$/.test(cnpj)) throw new Error("A geração da chave ainda requer CNPJ numérico com 14 dígitos.");
  const base = `${parametros.codigoUf}${aamm}${cnpj}${documento.modelo}${inteiro(documento.serie, 3)}${inteiro(documento.numero, 9)}1${parametros.codigoNumerico}`;
  return `${base}${calcularDigitoChaveNfe(base)}`;
}

function tag(nome: string, valor: string | number | null | undefined): string {
  return valor === null || valor === undefined || valor === "" ? "" : `<${nome}>${escaparXml(valor)}</${nome}>`;
}

/** Núcleo não assinado: ainda exige XMLDSig e validação no XSD oficial. */
export function gerarXmlNfeNaoAssinado(documento: DocumentoFiscal, parametros: ParametrosXmlNfe): XmlNfePreparado {
  if (documento.ambiente !== "homologacao") throw new Error("O motor direto permite gerar XML apenas em homologação.");
  const validacao = validarDocumentoParaTransmissao(documento);
  if (!validacao.prontoParaTransmissao) throw new Error(`Documento fiscal inválido: ${validacao.erros.join(" ")}`);
  if (!parametros.naturezaOperacao.trim()) throw new Error("Natureza da operação é obrigatória.");

  const chaveAcesso = gerarChaveAcessoNfe(documento, parametros);
  const id = `NFe${chaveAcesso}` as const;
  const emitente = documento.emitente;
  const endereco = emitente.endereco;
  const itens = documento.itens.map((item, indice) => {
    const grupoIcms = item.csosn ? `ICMSSN${item.csosn}` : `ICMS${item.cst}`;
    const tributacao = item.csosn ? tag("CSOSN", item.csosn) : tag("CST", item.cst);
    return `<det nItem="${indice + 1}"><prod>${tag("cProd", indice + 1)}${tag("cEAN", "SEM GTIN")}${tag("xProd", item.descricao)}${tag("NCM", item.ncm)}${tag("CEST", item.cest)}${tag("CFOP", item.cfop)}${tag("uCom", item.unidade)}${tag("qCom", decimal(item.quantidade, 4))}${tag("vUnCom", decimal(item.valorUnitario, 4))}${tag("vProd", decimal(item.valorTotal))}${tag("cEANTrib", "SEM GTIN")}${tag("uTrib", item.unidade)}${tag("qTrib", decimal(item.quantidade, 4))}${tag("vUnTrib", decimal(item.valorUnitario, 4))}${tag("indTot", 1)}</prod><imposto><ICMS><${grupoIcms}>${tag("orig", item.origem)}${tributacao}</${grupoIcms}></ICMS></imposto></det>`;
  }).join("");
  const pagamentos = documento.pagamentos.map((pagamento) => `<detPag>${tag("tPag", pagamento.forma)}${tag("vPag", decimal(pagamento.valor))}</detPag>`).join("");
  const data = parametros.emitidaEm.toISOString().replace(/\.\d{3}Z$/, "+00:00");
  const totaisZero = ["vBC", "vICMS", "vICMSDeson", "vFCP", "vBCST", "vST", "vFCPST", "vFCPSTRet"].map((nome) => tag(nome, "0.00")).join("");
  const outrosTotais = ["vFrete", "vSeg", "vDesc", "vII", "vIPI", "vIPIDevol", "vPIS", "vCOFINS", "vOutro"].map((nome) => tag(nome, "0.00")).join("");

  const xmlSemAssinatura = `<NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe Id="${id}" versao="4.00"><ide>${tag("cUF", parametros.codigoUf)}${tag("cNF", parametros.codigoNumerico)}${tag("natOp", parametros.naturezaOperacao)}${tag("mod", documento.modelo)}${tag("serie", documento.serie)}${tag("nNF", documento.numero)}${tag("dhEmi", data)}${tag("tpNF", 1)}${tag("idDest", 1)}${tag("cMunFG", endereco.codigoMunicipioIbge)}${tag("tpImp", documento.modelo === "65" ? 4 : 1)}${tag("tpEmis", 1)}${tag("cDV", chaveAcesso.at(-1))}${tag("tpAmb", 2)}${tag("finNFe", 1)}${tag("indFinal", 1)}${tag("indPres", documento.modelo === "65" ? 1 : 0)}${tag("procEmi", 0)}${tag("verProc", "INCASSA-0.1")}</ide><emit>${tag("CNPJ", somenteDigitos(emitente.cnpj))}${tag("xNome", emitente.razaoSocial)}<enderEmit>${tag("xLgr", endereco.logradouro)}${tag("nro", endereco.numero)}${tag("xBairro", endereco.bairro)}${tag("cMun", endereco.codigoMunicipioIbge)}${tag("xMun", endereco.municipio)}${tag("UF", endereco.uf)}${tag("CEP", somenteDigitos(endereco.cep))}${tag("cPais", "1058")}${tag("xPais", "BRASIL")}</enderEmit>${tag("IE", somenteDigitos(emitente.inscricaoEstadual))}${tag("CRT", emitente.crt)}</emit>${itens}<total><ICMSTot>${totaisZero}${tag("vProd", decimal(documento.total))}${outrosTotais}${tag("vNF", decimal(documento.total))}</ICMSTot></total><transp>${tag("modFrete", 9)}</transp><pag>${pagamentos}</pag><infAdic>${tag("infCpl", "DOCUMENTO EMITIDO EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL")}</infAdic></infNFe></NFe>`;
  return { chaveAcesso, id, xmlSemAssinatura };
}


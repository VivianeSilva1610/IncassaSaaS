import { XMLParser, XMLValidator } from "fast-xml-parser";
import { exigirXmlAssinado } from "./assinatura";

const NS_NFE = "http://www.portalfiscal.inf.br/nfe";
const NS_AUTORIZACAO = "http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4";
const NS_SOAP12 = "http://www.w3.org/2003/05/soap-envelope";

export const SOAP_ACTION_AUTORIZACAO = `${NS_AUTORIZACAO}/nfeAutorizacaoLote`;

export type ResultadoAutorizacaoSefaz = {
  status: "autorizado" | "rejeitado" | "processando" | "erro";
  codigo: string | null;
  motivo: string;
  recibo?: string;
  protocolo?: string;
  chaveAcesso?: string;
};

function textoCampo(valor: unknown, padrao: string): string {
  if (typeof valor !== "string" && typeof valor !== "number") return padrao;
  return String(valor).replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, 500) || padrao;
}

function motivoSeguro(valor: unknown, padrao: string): string {
  return textoCampo(valor, padrao).replace(/\b\d{11,44}\b/g, "[identificador omitido]");
}

function objeto(valor: unknown): Record<string, unknown> | null {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor) ? valor as Record<string, unknown> : null;
}

function localizar(no: unknown, chave: string): unknown {
  const atual = objeto(no);
  if (!atual) return undefined;
  if (chave in atual) return atual[chave];
  for (const valor of Object.values(atual)) {
    const encontrado = localizar(Array.isArray(valor) ? valor[0] : valor, chave);
    if (encontrado !== undefined) return encontrado;
  }
  return undefined;
}

export function gerarLoteNfe(xmlAssinado: string, referenciaId: `NFe${string}`, idLote: string, sincrono = true): string {
  exigirXmlAssinado(xmlAssinado, referenciaId);
  if (!/^\d{1,15}$/.test(idLote)) throw new Error("Identificador do lote deve conter de 1 a 15 números.");
  if (!xmlAssinado.includes("<tpAmb>2</tpAmb>")) throw new Error("Somente documentos de homologação podem entrar no lote.");
  if ((xmlAssinado.match(/<NFe\b/g) ?? []).length !== 1) throw new Error("Esta etapa aceita exatamente uma NF-e por lote.");
  return `<enviNFe xmlns="${NS_NFE}" versao="4.00"><idLote>${idLote}</idLote><indSinc>${sincrono ? 1 : 0}</indSinc>${xmlAssinado}</enviNFe>`;
}

export function gerarEnvelopeSoapAutorizacao(loteXml: string): string {
  if (!loteXml.startsWith(`<enviNFe xmlns="${NS_NFE}"`)) throw new Error("Lote NF-e inválido.");
  return `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="${NS_SOAP12}"><soap:Body><nfeDadosMsg xmlns="${NS_AUTORIZACAO}">${loteXml}</nfeDadosMsg></soap:Body></soap:Envelope>`;
}

export function interpretarRespostaAutorizacao(xml: string): ResultadoAutorizacaoSefaz {
  if (!xml.trim() || xml.length > 2_000_000) return { status: "erro", codigo: null, motivo: "Resposta vazia ou acima do limite permitido." };
  if (XMLValidator.validate(xml) !== true) return { status: "erro", codigo: null, motivo: "Resposta XML inválida da SEFAZ." };
  let raiz: unknown;
  try {
    raiz = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, parseTagValue: false, processEntities: false }).parse(xml);
  } catch {
    return { status: "erro", codigo: null, motivo: "Resposta XML inválida da SEFAZ." };
  }

  const fault = objeto(localizar(raiz, "Fault"));
  if (fault) {
    const reason = objeto(fault.Reason);
    return { status: "erro", codigo: null, motivo: motivoSeguro(reason?.Text ?? fault.faultstring, "Falha SOAP retornada pela SEFAZ.") };
  }

  const retorno = objeto(localizar(raiz, "retEnviNFe"));
  if (!retorno) return { status: "erro", codigo: null, motivo: "Resposta sem retEnviNFe reconhecível." };
  if (textoCampo(retorno.tpAmb, "") !== "2") return { status: "erro", codigo: null, motivo: "Resposta não pertence ao ambiente de homologação." };

  const codigoLote = textoCampo(retorno.cStat, "");
  const motivoLote = motivoSeguro(retorno.xMotivo, "Retorno sem motivo informado.");
  const recibo = textoCampo(objeto(retorno.infRec)?.nRec, "");
  if (codigoLote === "103" || codigoLote === "105") {
    return { status: "processando", codigo: codigoLote, motivo: motivoLote, ...(recibo ? { recibo } : {}) };
  }

  const protocoloNfe = objeto(Array.isArray(retorno.protNFe) ? retorno.protNFe[0] : retorno.protNFe);
  const infProt = objeto(protocoloNfe?.infProt);
  if (codigoLote === "104" && infProt) {
    const codigo = textoCampo(infProt.cStat, "");
    const motivo = motivoSeguro(infProt.xMotivo, motivoLote);
    const protocolo = /^\d{15}$/.test(textoCampo(infProt.nProt, "")) ? textoCampo(infProt.nProt, "") : "";
    const chaveAcesso = /^\d{44}$/.test(textoCampo(infProt.chNFe, "")) ? textoCampo(infProt.chNFe, "") : "";
    if (codigo === "100" || codigo === "150") {
      return { status: "autorizado", codigo, motivo, ...(protocolo ? { protocolo } : {}), ...(chaveAcesso ? { chaveAcesso } : {}) };
    }
    return { status: "rejeitado", codigo: codigo || codigoLote, motivo };
  }
  return { status: "rejeitado", codigo: codigoLote || null, motivo: motivoLote };
}

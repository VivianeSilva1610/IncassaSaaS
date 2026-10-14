import type { DocumentoFiscal } from "../documento";
import { assinarXmlNfeComPem, type MaterialAssinaturaPem } from "./assinatura";
import { obterCodigoUfRevisado, obterEndpointHomologacao } from "./endpoints";
import { gerarEnvelopeSoapAutorizacao, gerarLoteNfe, SOAP_ACTION_AUTORIZACAO } from "./protocolo";
import { validarXmlNfeNoXsd } from "./validar-xsd";
import { gerarXmlNfeNaoAssinado, type ParametrosXmlNfe } from "./xml";

export type TransmissaoHomologacaoPreparada = {
  endpoint: URL;
  soapAction: string;
  envelope: string;
  chaveAcesso: string;
  xmlAssinado: string;
  pacoteXsd: "PL_010f_v1.04";
};

export async function prepararTransmissaoHomologacao(params: {
  documento: DocumentoFiscal;
  uf: string;
  emitidaEm: Date;
  codigoNumerico: string;
  naturezaOperacao: string;
  idLote: string;
  material: MaterialAssinaturaPem;
}): Promise<TransmissaoHomologacaoPreparada> {
  if (params.documento.ambiente !== "homologacao") throw new Error("A preparação direta está bloqueada fora da homologação.");
  const codigoUf = obterCodigoUfRevisado(params.uf);
  if (params.documento.emitente.endereco.uf?.toUpperCase() !== params.uf.toUpperCase()) throw new Error("UF do endpoint diverge da UF do emitente.");
  const parametrosXml: ParametrosXmlNfe = { codigoUf, emitidaEm: params.emitidaEm, codigoNumerico: params.codigoNumerico, naturezaOperacao: params.naturezaOperacao };
  const preparado = gerarXmlNfeNaoAssinado(params.documento, parametrosXml);
  const xmlAssinado = assinarXmlNfeComPem(preparado.xmlSemAssinatura, preparado.id, params.material);
  const xsd = await validarXmlNfeNoXsd(xmlAssinado);
  if (!xsd.valido) throw new Error(`XML recusado pelo XSD oficial ${xsd.pacote}: ${xsd.erros.join(" ")}`);
  const lote = gerarLoteNfe(xmlAssinado, preparado.id, params.idLote, true);
  return {
    endpoint: obterEndpointHomologacao(params.uf, "autorizacao"),
    soapAction: SOAP_ACTION_AUTORIZACAO,
    envelope: gerarEnvelopeSoapAutorizacao(lote),
    chaveAcesso: preparado.chaveAcesso,
    xmlAssinado,
    pacoteXsd: xsd.pacote,
  };
}

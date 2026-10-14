import { test } from "node:test";
import assert from "node:assert/strict";
import { gerarEnvelopeSoapAutorizacao, gerarLoteNfe, interpretarRespostaAutorizacao, SOAP_ACTION_AUTORIZACAO } from "@/lib/fiscal/core/incassa/protocolo";

const ID = "NFe35261012345678000190650010000000011123456785" as const;
const XML_ASSINADO = `<NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe Id="${ID}" versao="4.00"><ide><tpAmb>2</tpAmb></ide></infNFe><Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignedInfo><Reference URI="#${ID}"></Reference></SignedInfo></Signature></NFe>`;

function soap(retorno: string): string {
  return `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"><soap:Body><nfeResultMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">${retorno}</nfeResultMsg></soap:Body></soap:Envelope>`;
}

test("monta lote síncrono e envelope SOAP 1.2 de autorização", () => {
  const lote = gerarLoteNfe(XML_ASSINADO, ID, "123", true);
  assert.match(lote, /<idLote>123<\/idLote><indSinc>1<\/indSinc>/);
  const envelope = gerarEnvelopeSoapAutorizacao(lote);
  assert.match(envelope, /2003\/05\/soap-envelope/);
  assert.match(envelope, /<nfeDadosMsg/);
  assert.match(SOAP_ACTION_AUTORIZACAO, /nfeAutorizacaoLote$/);
});

test("lote bloqueia produção e identificador inválido", () => {
  assert.throws(() => gerarLoteNfe(XML_ASSINADO.replace("<tpAmb>2", "<tpAmb>1"), ID, "1"), /homologação/);
  assert.throws(() => gerarLoteNfe(XML_ASSINADO, ID, "lote-1"), /1 a 15 números/);
});

test("interpreta autorização síncrona sem expor dados no motivo", () => {
  const xml = soap(`<retEnviNFe versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe"><tpAmb>2</tpAmb><cStat>104</cStat><xMotivo>Lote processado</xMotivo><protNFe><infProt><tpAmb>2</tpAmb><chNFe>35261012345678000190650010000000011123456785</chNFe><cStat>100</cStat><xMotivo>Autorizado o uso da NF-e</xMotivo><nProt>135260000000001</nProt></infProt></protNFe></retEnviNFe>`);
  assert.deepEqual(interpretarRespostaAutorizacao(xml), { status: "autorizado", codigo: "100", motivo: "Autorizado o uso da NF-e", protocolo: "135260000000001", chaveAcesso: "35261012345678000190650010000000011123456785" });
});

test("interpreta lote em processamento e rejeição", () => {
  const processamento = soap(`<retEnviNFe xmlns="http://www.portalfiscal.inf.br/nfe"><tpAmb>2</tpAmb><cStat>103</cStat><xMotivo>Lote recebido</xMotivo><infRec><nRec>351000000000001</nRec></infRec></retEnviNFe>`);
  assert.deepEqual(interpretarRespostaAutorizacao(processamento), { status: "processando", codigo: "103", motivo: "Lote recebido", recibo: "351000000000001" });
  const rejeicao = soap(`<retEnviNFe xmlns="http://www.portalfiscal.inf.br/nfe"><tpAmb>2</tpAmb><cStat>539</cStat><xMotivo>Duplicidade para CNPJ 12345678000190</xMotivo></retEnviNFe>`);
  const resultado = interpretarRespostaAutorizacao(rejeicao);
  assert.equal(resultado.status, "rejeitado");
  assert.equal(resultado.codigo, "539");
  assert.doesNotMatch(resultado.motivo, /12345678000190/);
});

test("recusa resposta de produção, XML malformado e SOAP Fault", () => {
  const producao = soap(`<retEnviNFe xmlns="http://www.portalfiscal.inf.br/nfe"><tpAmb>1</tpAmb><cStat>104</cStat><xMotivo>Lote processado</xMotivo></retEnviNFe>`);
  assert.equal(interpretarRespostaAutorizacao(producao).status, "erro");
  assert.match(interpretarRespostaAutorizacao("<xml>").motivo, /XML inválida/);
  const fault = `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"><soap:Body><soap:Fault><soap:Reason><soap:Text>Falha para 12345678000190</soap:Text></soap:Reason></soap:Fault></soap:Body></soap:Envelope>`;
  const resultado = interpretarRespostaAutorizacao(fault);
  assert.equal(resultado.status, "erro");
  assert.doesNotMatch(resultado.motivo, /12345678000190/);
});

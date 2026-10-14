import { test } from "node:test";
import assert from "node:assert/strict";
import type { DocumentoFiscal } from "@/lib/fiscal/core/documento";
import { calcularDigitoChaveNfe, gerarXmlNfeNaoAssinado } from "@/lib/fiscal/core/incassa/xml";
import { transmitirSoapHomologacao } from "@/lib/fiscal/core/incassa/transporte";
import { assinarXmlNfeComPem, verificarAssinaturaXmlNfe } from "@/lib/fiscal/core/incassa/assinatura";
import { generate } from "selfsigned";
import { validarXmlNfeNoXsd } from "@/lib/fiscal/core/incassa/validar-xsd";
import { prepararTransmissaoHomologacao } from "@/lib/fiscal/core/incassa/preparar";

function documento(): DocumentoFiscal {
  return {
    ref: "fixture-homologacao", produto: "restaurante", modelo: "65", ambiente: "homologacao", numero: 1, serie: 1,
    emitente: { razaoSocial: "EMPRESA TESTE", cnpj: "12345678000190", inscricaoEstadual: "123456789", crt: 1, endereco: { logradouro: "RUA TESTE", numero: "1", bairro: "CENTRO", codigoMunicipioIbge: "3550308", municipio: "SAO PAULO", uf: "SP", cep: "01001000" } },
    destinatario: null,
    itens: [{ descricao: "PRODUTO TESTE", quantidade: 1, valorUnitario: 10, valorTotal: 10, unidade: "UN", ncm: "21069090", cfop: "5102", cest: null, origem: 0, cst: null, csosn: "102", aliquotaIcms: null }],
    pagamentos: [{ forma: "01", valor: 10 }], total: 10,
  };
}

test("calcula dígito e gera XML de homologação determinístico sem assinatura", () => {
  assert.equal(calcularDigitoChaveNfe("3526101234567800019065001000000001112345678"), 5);
  const resultado = gerarXmlNfeNaoAssinado(documento(), { codigoUf: "35", emitidaEm: new Date("2026-10-14T12:00:00Z"), codigoNumerico: "12345678", naturezaOperacao: "VENDA" });
  assert.equal(resultado.chaveAcesso.length, 44);
  assert.ok(resultado.xmlSemAssinatura.includes(`Id="${resultado.id}"`));
  assert.match(resultado.xmlSemAssinatura, /tpAmb>2</);
  assert.match(resultado.xmlSemAssinatura, /SEM VALOR FISCAL/);
  assert.doesNotMatch(resultado.xmlSemAssinatura, /<Signature/);
});

test("bloqueia geração em produção", () => {
  const doc = documento();
  doc.ambiente = "producao";
  assert.throws(() => gerarXmlNfeNaoAssinado(doc, { codigoUf: "35", emitidaEm: new Date(), codigoNumerico: "12345678", naturezaOperacao: "VENDA" }), /apenas em homologação/);
});

test("transporte rejeita host não permitido sem executar fetch", async () => {
  let chamou = false;
  await assert.rejects(() => transmitirSoapHomologacao({ endpoint: new URL("https://exemplo.invalid/soap"), soapAction: "teste", envelope: "<soap:Envelope/>", hostsPermitidos: new Set(["homologacao.sefaz.gov.br"]), fetchImpl: async () => { chamou = true; return new Response(); } }), /fora da lista/);
  assert.equal(chamou, false);
});

test("transporte aceita somente endpoint explicitamente permitido", async () => {
  const resposta = await transmitirSoapHomologacao({ endpoint: new URL("https://homologacao.sefaz.gov.br/soap"), soapAction: "teste", envelope: "<soap:Envelope/>", hostsPermitidos: new Set(["homologacao.sefaz.gov.br"]), fetchImpl: async () => new Response("<retorno/>", { status: 200 }) });
  assert.equal(resposta, "<retorno/>");
});

test("assina a infNFe e detecta alteração posterior", async () => {
  const pems = await generate([{ name: "commonName", value: "fixture-incassa" }], {
    keySize: 2048,
    algorithm: "sha256",
    extensions: [{ name: "keyUsage", digitalSignature: true }],
  });
  const preparado = gerarXmlNfeNaoAssinado(documento(), { codigoUf: "35", emitidaEm: new Date("2026-10-14T12:00:00Z"), codigoNumerico: "12345678", naturezaOperacao: "VENDA" });
  const assinado = assinarXmlNfeComPem(preparado.xmlSemAssinatura, preparado.id, { chavePrivadaPem: pems.private, certificadoPem: pems.cert });
  assert.match(assinado, new RegExp(`Reference URI="#${preparado.id}"`));
  assert.equal(verificarAssinaturaXmlNfe(assinado, pems.cert), true);
  assert.equal(verificarAssinaturaXmlNfe(assinado.replace("PRODUTO TESTE", "PRODUTO ALTERADO"), pems.cert), false);
});

test("XML assinado passa pelo pacote XSD oficial 010f", async () => {
  const pems = await generate([{ name: "commonName", value: "fixture-xsd" }], { keySize: 2048, algorithm: "sha256", extensions: [{ name: "keyUsage", digitalSignature: true }] });
  const preparado = gerarXmlNfeNaoAssinado(documento(), { codigoUf: "35", emitidaEm: new Date("2026-10-14T12:00:00Z"), codigoNumerico: "12345678", naturezaOperacao: "VENDA" });
  const assinado = assinarXmlNfeComPem(preparado.xmlSemAssinatura, preparado.id, { chavePrivadaPem: pems.private, certificadoPem: pems.cert });
  const resultado = await validarXmlNfeNoXsd(assinado);
  assert.deepEqual(resultado.erros, []);
  assert.equal(resultado.valido, true);
  assert.equal(resultado.pacote, "PL_010f_v1.04");
});

test("recusa referência duplicada e material que não seja certificado X.509", () => {
  const preparado = gerarXmlNfeNaoAssinado(documento(), { codigoUf: "35", emitidaEm: new Date("2026-10-14T12:00:00Z"), codigoNumerico: "12345678", naturezaOperacao: "VENDA" });
  const duplicado = preparado.xmlSemAssinatura.replace("</NFe>", `<copia Id="${preparado.id}"/></NFe>`);
  assert.throws(() => assinarXmlNfeComPem(duplicado, preparado.id, { chavePrivadaPem: "inválida", certificadoPem: "inválido" }), /exatamente uma vez/);
  assert.throws(() => assinarXmlNfeComPem(preparado.xmlSemAssinatura, preparado.id, { chavePrivadaPem: "inválida", certificadoPem: "inválido" }), /Certificado PEM/);
});

test("recusa chave privada que não corresponde ao certificado", async () => {
  const primeiro = await generate([{ name: "commonName", value: "chave-a" }], { keySize: 2048 });
  const segundo = await generate([{ name: "commonName", value: "cert-b" }], { keySize: 2048 });
  const preparado = gerarXmlNfeNaoAssinado(documento(), { codigoUf: "35", emitidaEm: new Date("2026-10-14T12:00:00Z"), codigoNumerico: "12345678", naturezaOperacao: "VENDA" });
  assert.throws(() => assinarXmlNfeComPem(preparado.xmlSemAssinatura, preparado.id, { chavePrivadaPem: primeiro.private, certificadoPem: segundo.cert }), /não corresponde/);
});

test("prepara toda a transmissão de homologação sem executar rede", async () => {
  const pems = await generate([{ name: "commonName", value: "pipeline" }], { keySize: 2048 });
  const resultado = await prepararTransmissaoHomologacao({ documento: documento(), uf: "SP", emitidaEm: new Date("2026-10-14T12:00:00Z"), codigoNumerico: "12345678", naturezaOperacao: "VENDA", idLote: "1", material: { chavePrivadaPem: pems.private, certificadoPem: pems.cert } });
  assert.equal(resultado.endpoint.hostname, "homologacao.nfe.fazenda.sp.gov.br");
  assert.equal(resultado.pacoteXsd, "PL_010f_v1.04");
  assert.match(resultado.envelope, /<enviNFe/);
  assert.equal(resultado.chaveAcesso.length, 44);
});

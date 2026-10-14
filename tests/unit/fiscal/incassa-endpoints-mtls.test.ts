import { test } from "node:test";
import assert from "node:assert/strict";
import { hostsFiscaisHomologacaoPermitidos, obterEndpointHomologacao } from "@/lib/fiscal/core/incassa/endpoints";
import { transmitirSoapHomologacaoMtls } from "@/lib/fiscal/core/incassa/mtls";

test("seleciona somente endpoint de homologação oficialmente revisado", () => {
  const endpoint = obterEndpointHomologacao("mg", "autorizacao");
  assert.equal(endpoint.hostname, "hnfe.fazenda.mg.gov.br");
  assert.ok(hostsFiscaisHomologacaoPermitidos().has(endpoint.hostname));
  assert.throws(() => obterEndpointHomologacao("XX", "autorizacao"), /ainda não revisado/);
});

test("mTLS prepara certificado cliente, TLS 1.2 e SOAP sem executar rede", async () => {
  const endpoint = obterEndpointHomologacao("SP", "autorizacao");
  let observouSegredoNoCorpo = false;
  const resposta = await transmitirSoapHomologacaoMtls({
    endpoint,
    soapAction: "acao",
    envelope: "<soap:Envelope></soap:Envelope>",
    hostsPermitidos: hostsFiscaisHomologacaoPermitidos(),
    material: { certificadoPem: "CERTIFICADO-TESTE", chavePrivadaPem: "CHAVE-TESTE" },
    executor: async (opcoes, corpo, limite) => {
      assert.equal(opcoes.hostname, endpoint.hostname);
      assert.equal(opcoes.minVersion, "TLSv1.2");
      assert.equal(opcoes.rejectUnauthorized, true);
      assert.equal(opcoes.cert, "CERTIFICADO-TESTE");
      assert.equal(opcoes.key, "CHAVE-TESTE");
      assert.equal(limite, 2_000_000);
      observouSegredoNoCorpo = corpo.includes("CHAVE-TESTE");
      return { status: 200, corpo: "<retorno/>" };
    },
  });
  assert.equal(resposta, "<retorno/>");
  assert.equal(observouSegredoNoCorpo, false);
});

test("mTLS bloqueia host não oficial antes do executor", async () => {
  let executou = false;
  await assert.rejects(() => transmitirSoapHomologacaoMtls({
    endpoint: new URL("https://example.invalid/soap"),
    soapAction: "acao",
    envelope: "<soap:Envelope></soap:Envelope>",
    hostsPermitidos: hostsFiscaisHomologacaoPermitidos(),
    material: { certificadoPem: "cert", chavePrivadaPem: "key" },
    executor: async () => { executou = true; return { status: 200, corpo: "" }; },
  }), /fora da lista/);
  assert.equal(executou, false);
});

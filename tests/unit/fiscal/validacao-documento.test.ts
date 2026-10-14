import { test } from "node:test";
import assert from "node:assert/strict";
import type { DocumentoFiscal } from "@/lib/fiscal/core/documento";
import { getProvedorFiscal } from "@/lib/fiscal/core/provedor";
import { REFERENCIA_SCHEMA_NFE, validarDocumentoParaTransmissao } from "@/lib/fiscal/core/validacao";

function documentoValido(): DocumentoFiscal {
  return {
    ref: "teste-sem-validade-fiscal",
    produto: "restaurante",
    modelo: "65",
    ambiente: "homologacao",
    numero: 1,
    serie: 1,
    emitente: {
      razaoSocial: "Emitente de teste",
      cnpj: "ABCDEFGHIJKL12",
      inscricaoEstadual: "IE-TESTE",
      crt: 1,
      endereco: {
        logradouro: "Rua de teste",
        numero: "1",
        bairro: "Centro",
        codigoMunicipioIbge: "3170107",
        municipio: "Uberaba",
        uf: "MG",
        cep: "00000000",
      },
    },
    destinatario: null,
    itens: [{
      descricao: "Produto de teste",
      quantidade: 2,
      valorUnitario: 10,
      valorTotal: 20,
      unidade: "UN",
      ncm: "00000000",
      cfop: "5102",
      cest: null,
      origem: 0,
      cst: null,
      csosn: "102",
      aliquotaIcms: null,
    }],
    pagamentos: [{ forma: "01", valor: 20 }],
    total: 20,
  };
}

test("validador aceita estrutura completa de homologação sem transmitir", () => {
  const resultado = validarDocumentoParaTransmissao(documentoValido());
  assert.deepEqual(resultado.erros, []);
  assert.equal(resultado.prontoParaTransmissao, true);
  assert.match(resultado.avisos.join(" "), /sem validade fiscal/i);
  assert.equal(REFERENCIA_SCHEMA_NFE.leiaute, "4.00");
});

test("validador bloqueia totais divergentes e classificação ausente", () => {
  const documento = documentoValido();
  documento.total = 99;
  documento.itens[0].ncm = null;
  documento.itens[0].csosn = null;
  const resultado = validarDocumentoParaTransmissao(documento);
  assert.equal(resultado.prontoParaTransmissao, false);
  assert.ok(resultado.erros.some((erro) => erro.includes("NCM")));
  assert.ok(resultado.erros.some((erro) => erro.includes("CSOSN")));
  assert.ok(resultado.erros.some((erro) => erro.includes("soma dos itens")));
});

test("motor direto valida mas continua sem qualquer transmissão", async () => {
  const provedor = getProvedorFiscal("incassa_direto", { produto: "restaurante" });
  assert.equal(provedor.id, "incassa_direto");
  const resultado = await provedor.emitir(documentoValido());
  assert.equal(resultado.status, "erro");
  assert.match(resultado.mensagem ?? "", /nenhuma transmissão/i);
});

test("Pranzo atual sem dados fiscais recebe diagnóstico antes da SEFAZ", async () => {
  const documento = documentoValido();
  documento.emitente.cnpj = null;
  documento.emitente.inscricaoEstadual = null;
  documento.itens[0].unidade = null;
  documento.pagamentos = [];
  const resultado = await getProvedorFiscal("incassa_direto", { produto: "restaurante" }).emitir(documento);
  assert.equal(resultado.status, "erro");
  assert.match(resultado.mensagem ?? "", /CNPJ/);
  assert.match(resultado.mensagem ?? "", /Inscrição Estadual/);
  assert.match(resultado.mensagem ?? "", /forma de pagamento/);
});


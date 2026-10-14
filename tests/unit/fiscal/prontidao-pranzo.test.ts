import { test } from "node:test";
import assert from "node:assert/strict";
import { pendenciasParaHomologacaoPranzo } from "@/lib/fiscal/restaurante/prontidao";

test("Pranzo sem CNPJ permanece explicitamente fora da homologação oficial", () => {
  const pendencias = pendenciasParaHomologacaoPranzo({ provedor: "simulado" });
  assert.ok(pendencias.includes("CNPJ"));
  assert.ok(pendencias.includes("Inscrição Estadual"));
  assert.ok(pendencias.includes("Motor fiscal direto selecionado"));
});

test("cadastro completo com motor direto fica pronto para iniciar homologação", () => {
  const pendencias = pendenciasParaHomologacaoPranzo({
    cnpj: "00000000000000",
    inscricao_estadual: "ISENTO-APENAS-TESTE",
    razao_social: "Emitente de teste",
    logradouro: "Rua de teste",
    numero: "1",
    bairro: "Centro",
    municipio: "Uberaba",
    codigo_municipio_ibge: "3170107",
    uf: "MG",
    cep: "00000000",
    crt: 1,
    provedor: "incassa_direto",
  });
  assert.deepEqual(pendencias, []);
});

import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { cifrarCredencialFiscal, decifrarCredencialFiscal } from "@/lib/fiscal/core/credenciais";

const chaveAnterior = process.env.FISCAL_CREDENTIALS_KEY;

before(() => {
  process.env.FISCAL_CREDENTIALS_KEY = randomBytes(32).toString("base64");
});

after(() => {
  if (chaveAnterior === undefined) delete process.env.FISCAL_CREDENTIALS_KEY;
  else process.env.FISCAL_CREDENTIALS_KEY = chaveAnterior;
});

const contexto = {
  produto: "restaurante" as const,
  ownerId: "00000000-0000-0000-0000-000000000001",
  ambiente: "homologacao" as const,
  provedor: "incassa_direto" as const,
  tipo: "certificado_a1" as const,
};

test("credencial fiscal faz round-trip sem guardar o conteúdo aberto", () => {
  const segredo = Buffer.from("certificado-de-teste-sem-validade");
  const cifrada = cifrarCredencialFiscal(segredo, contexto);
  assert.notEqual(cifrada.cifra, segredo.toString("base64"));
  assert.equal(cifrada.versaoChave, 1);
  assert.match(cifrada.ultimos4, /^[0-9A-F]{4}$/);
  assert.equal(decifrarCredencialFiscal(cifrada, contexto).toString(), segredo.toString());
});

test("AAD impede usar uma credencial fiscal em outro tenant", () => {
  const cifrada = cifrarCredencialFiscal("segredo", contexto);
  assert.throws(() => decifrarCredencialFiscal(cifrada, { ...contexto, ownerId: "outro-owner" }));
});

test("chave mestra fiscal inválida é recusada", () => {
  process.env.FISCAL_CREDENTIALS_KEY = Buffer.from("curta").toString("base64");
  assert.throws(() => cifrarCredencialFiscal("segredo", contexto), /32 bytes/);
  process.env.FISCAL_CREDENTIALS_KEY = randomBytes(32).toString("base64");
});

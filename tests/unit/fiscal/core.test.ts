import { test } from "node:test";
import assert from "node:assert/strict";
import { getProvedorFiscal } from "@/lib/fiscal/core/provedor";
import { PROVEDORES_FISCAIS } from "@/lib/fiscal/core/provedores-suportados";
import { documentoDoPedido, statusCancelamentoRestaurante, statusNotaRestaurante } from "@/lib/fiscal/restaurante/mapper";

const ITEM = { nome: "Marmita", quantidade: 2, preco_unitario: 15.5, valor_total: 31, ncm: "21069090", cfop: null, cest: null, origem: null, cst: null, csosn: "102", aliquota_icms: null };

test("pedido do Restaurante vira NFC-e modelo 65 com a ref do pedido", () => {
  const doc = documentoDoPedido({
    config: { cnpj: "12345678000190", crt: 1, ambiente: "homologacao", uf: "SP", codigo_municipio_ibge: "3550308" },
    pedido: { id: "pedido-1", totale: 31, clienteNome: null, clienteCpfCnpj: "12345678909" },
    itens: [ITEM],
    numero: 7,
    serie: 2,
  });
  assert.equal(doc.ref, "pedido-1");
  assert.equal(doc.produto, "restaurante");
  assert.equal(doc.modelo, "65");
  assert.equal(doc.ambiente, "homologacao");
  assert.equal(doc.emitente.endereco.codigoMunicipioIbge, "3550308");
  assert.deepEqual(doc.destinatario, { nome: null, cpfCnpj: "12345678909", endereco: null });
  assert.equal(doc.itens[0].cfop, "5102");
  assert.equal(doc.itens[0].origem, 0);
  assert.equal(doc.total, 31);
});

test("sem config fiscal o documento sai em homologação e sem destinatário", () => {
  const doc = documentoDoPedido({ config: null, pedido: { id: "p", totale: 1, clienteNome: null, clienteCpfCnpj: null }, itens: [], numero: 1, serie: 1 });
  assert.equal(doc.ambiente, "homologacao");
  assert.equal(doc.destinatario, null);
});

test("só 'producao' explícito liga o ambiente de produção", () => {
  const base = { pedido: { id: "p", totale: 1, clienteNome: null, clienteCpfCnpj: null }, itens: [], numero: 1, serie: 1 };
  assert.equal(documentoDoPedido({ ...base, config: { ambiente: "producao" } }).ambiente, "producao");
  assert.equal(documentoDoPedido({ ...base, config: { ambiente: "qualquer" } }).ambiente, "homologacao");
});

test("mensagem de provedor não configurado aponta para a tela certa de cada sistema", async () => {
  const restaurante = await getProvedorFiscal(null, { produto: "restaurante" }).emitir({} as never);
  const comercio = await getProvedorFiscal("focus_nfe", { produto: "comercio" }).emitir({} as never);
  assert.match(restaurante.mensagem ?? "", /Restaurante → Fiscal/);
  assert.match(comercio.mensagem ?? "", /Comércio → Fiscal/);
  assert.equal(comercio.status, "erro");
});

test("status do provedor viram os status de del_notas_fiscais", () => {
  assert.equal(statusNotaRestaurante("autorizado"), "emitida");
  assert.equal(statusNotaRestaurante("processando"), "pendente");
  assert.equal(statusNotaRestaurante("rejeitado"), "erro");
  assert.equal(statusNotaRestaurante("erro"), "erro");
  assert.equal(statusCancelamentoRestaurante("cancelado"), "cancelada");
  assert.equal(statusCancelamentoRestaurante("erro"), "erro");
});

test("nenhum provedor é anunciado como disponível antes da liberação", () => {
  // Trava de comunicação: mudar para "disponivel" só depois do piloto
  // (Fase 9 do plano). Se este teste falhar, confira se o piloto acabou.
  assert.ok(PROVEDORES_FISCAIS.every((p) => p.status !== "disponivel"));
});

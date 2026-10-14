// Linha de base do fluxo fiscal BR do Restaurante (Fase 0 do plano em
// docs/comercio-plano-nfe-provedores.md). Descreve o comportamento
// observável — o que é gravado em del_notas_fiscais/del_fiscal_config/
// del_orders e o que as funções devolvem — e precisa continuar passando,
// sem alteração, depois da refatoração para a camada fiscal comum.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cancelarNotaFiscal,
  confirmarPagamentoEEmitirNota,
  emitirNotaFiscalParaPedido,
} from "@/lib/fiscal/emitir";
import { criarSupabaseFalso } from "../apoio/supabase-falso";

const OWNER = "owner-1";
const PEDIDO = "pedido-1";

function seed(opcoes: { provedor?: string | null; pago?: boolean; emissaoAutomatica?: boolean; canal?: string; status?: string } = {}) {
  return {
    del_fiscal_config: [
      {
        owner_id: OWNER,
        provedor: opcoes.provedor === undefined ? "simulado" : opcoes.provedor,
        provedor_api_key: "chave-que-nao-pode-vazar",
        proxima_numeracao: 7,
        serie: 2,
        ambiente: "homologacao",
        emissao_automatica: opcoes.emissaoAutomatica ?? true,
        razao_social: "Restaurante Teste LTDA",
        cnpj: "12345678000190",
        inscricao_estadual: "123456",
        crt: 1,
        logradouro: "Rua A",
        numero: "10",
        bairro: "Centro",
        municipio: "São Paulo",
        uf: "SP",
        cep: "01000000",
      },
    ],
    del_orders: [
      {
        id: PEDIDO,
        owner_id: OWNER,
        totale: 45.5,
        pago: opcoes.pago ?? true,
        canal: opcoes.canal ?? "site",
        status: opcoes.status ?? "novo",
        cliente_nome: "Cliente",
        cliente_cpf_cnpj: "12345678909",
        del_order_items: [
          {
            product_id: "prod-1",
            quantidade: 2,
            preco_unitario: 15.5,
            del_products: { nome: "Marmita", categoria: "pratos", ncm: "21069090", cfop: "5102", cest: null, origem: 0, cst: null, csosn: "102", aliquota_icms: null },
          },
          {
            product_id: "prod-2",
            quantidade: 1,
            preco_unitario: 14.5,
            del_products: { nome: "Suco", categoria: "bebidas", ncm: null, cfop: null, cest: "0300100", origem: null, cst: null, csosn: null, aliquota_icms: null },
          },
        ],
      },
    ],
    del_notas_fiscais: [] as Record<string, unknown>[],
  };
}

const ITENS_SNAPSHOT = [
  { product_id: "prod-1", nome: "Marmita", categoria: "pratos", quantidade: 2, preco_unitario: 15.5, valor_total: 31, ncm: "21069090", cfop: "5102", cest: null, origem: 0, cst: null, csosn: "102", aliquota_icms: null },
  { product_id: "prod-2", nome: "Suco", categoria: "bebidas", quantidade: 1, preco_unitario: 14.5, valor_total: 14.5, ncm: null, cfop: null, cest: "0300100", origem: null, cst: null, csosn: null, aliquota_icms: null },
];

test("emissão sem provedor configurado registra a nota como erro e não avança a numeração", async () => {
  const db = criarSupabaseFalso(seed({ provedor: null }));
  const r = await emitirNotaFiscalParaPedido(db.cliente, { ownerId: OWNER, orderId: PEDIDO });

  assert.equal(r.status, "erro");
  assert.match(r.mensagemErro ?? "", /^Nenhum provedor de NFC-e configurado ainda\./);
  const [nota] = db.tabelas.del_notas_fiscais;
  assert.equal(nota.status, "erro");
  assert.equal(nota.numero, 7);
  assert.equal(nota.serie, 2);
  assert.equal(nota.provedor, null);
  assert.equal(nota.ambiente, "homologacao");
  assert.equal(nota.chave_acesso, null);
  assert.equal(nota.emitida_em, null);
  assert.equal(nota.erro_mensagem, r.mensagemErro);
  assert.deepEqual(nota.itens_snapshot, ITENS_SNAPSHOT);
  assert.equal(db.tabelas.del_fiscal_config[0].proxima_numeracao, 7);
});

test("emissão simulada grava a nota emitida e avança a numeração", async () => {
  const db = criarSupabaseFalso(seed());
  const r = await emitirNotaFiscalParaPedido(db.cliente, { ownerId: OWNER, orderId: PEDIDO });

  assert.equal(r.status, "emitida");
  assert.equal(r.mensagemErro, undefined);
  const [nota] = db.tabelas.del_notas_fiscais;
  assert.equal(r.notaId, nota.id);
  assert.equal(nota.status, "emitida");
  assert.equal(nota.provedor, "simulado");
  assert.equal(nota.numero, 7);
  assert.equal(nota.serie, 2);
  assert.match(String(nota.chave_acesso), /^SIMULACAO-[A-Z0-9]+$/);
  assert.match(String(nota.protocolo_autorizacao), /^SIMULACAO-PROTOCOLO-[A-Z0-9]+$/);
  assert.equal(nota.url_danfe, null);
  assert.equal(nota.url_xml, null);
  assert.ok(nota.emitida_em);
  assert.deepEqual(nota.itens_snapshot, ITENS_SNAPSHOT);
  assert.equal(db.tabelas.del_fiscal_config[0].proxima_numeracao, 8);
});

test("pedido com nota ativa devolve a nota existente sem gravar nada", async () => {
  const base = seed();
  base.del_notas_fiscais.push({ id: "nota-antiga", owner_id: OWNER, order_id: PEDIDO, status: "emitida" });
  const db = criarSupabaseFalso(base);
  const r = await emitirNotaFiscalParaPedido(db.cliente, { ownerId: OWNER, orderId: PEDIDO });

  assert.deepEqual(r, { notaId: "nota-antiga", status: "emitida", mensagemErro: undefined });
  assert.equal(db.escritas.length, 0);
});

test("pedido não pago não emite", async () => {
  const db = criarSupabaseFalso(seed({ pago: false }));
  await assert.rejects(
    emitirNotaFiscalParaPedido(db.cliente, { ownerId: OWNER, orderId: PEDIDO }),
    { message: "A nota fiscal só pode ser emitida depois da confirmação do pagamento." },
  );
  assert.equal(db.escritas.length, 0);
});

test("pedido inexistente não emite", async () => {
  const db = criarSupabaseFalso(seed());
  await assert.rejects(emitirNotaFiscalParaPedido(db.cliente, { ownerId: OWNER, orderId: "outro" }), { message: "Pedido não encontrado." });
});

test("cancelamento simulado marca a nota como cancelada", async () => {
  const db = criarSupabaseFalso(seed());
  const { notaId } = await emitirNotaFiscalParaPedido(db.cliente, { ownerId: OWNER, orderId: PEDIDO });
  const r = await cancelarNotaFiscal(db.cliente, { ownerId: OWNER, notaId, justificativa: "Pedido digitado errado pelo caixa" });

  assert.equal(r.status, "cancelada");
  const [nota] = db.tabelas.del_notas_fiscais;
  assert.equal(nota.status, "cancelada");
  assert.equal(nota.justificativa_cancelamento, "Pedido digitado errado pelo caixa");
  assert.match(String(nota.protocolo_cancelamento), /^SIMULACAO-CANCELAMENTO-\d+$/);
  assert.ok(nota.cancelada_em);
  assert.ok(nota.cancelamento_solicitado_em);
  assert.equal(nota.cancelamento_erro, null);
  assert.equal(nota.erro_mensagem, null);
});

test("cancelamento sem provedor registra o erro e mantém a nota emitida", async () => {
  const base = seed({ provedor: null });
  base.del_notas_fiscais.push({ id: "nota-1", owner_id: OWNER, order_id: PEDIDO, status: "emitida", chave_acesso: "X" });
  const db = criarSupabaseFalso(base);
  const r = await cancelarNotaFiscal(db.cliente, { ownerId: OWNER, notaId: "nota-1", justificativa: "Pedido digitado errado pelo caixa" });

  assert.equal(r.status, "erro");
  const [nota] = db.tabelas.del_notas_fiscais;
  assert.equal(nota.status, "emitida");
  assert.match(String(nota.cancelamento_erro), /^Nenhum provedor de NFC-e configurado ainda/);
});

test("só nota emitida pode ser cancelada", async () => {
  const base = seed();
  base.del_notas_fiscais.push({ id: "nota-1", owner_id: OWNER, order_id: PEDIDO, status: "erro" });
  const db = criarSupabaseFalso(base);
  await assert.rejects(
    cancelarNotaFiscal(db.cliente, { ownerId: OWNER, notaId: "nota-1", justificativa: "qualquer justificativa" }),
    { message: "Só é possível cancelar uma nota emitida." },
  );
});

test("confirmar pagamento sem emissão automática só marca o pedido como pago", async () => {
  const db = criarSupabaseFalso(seed({ pago: false, emissaoAutomatica: false }));
  const r = await confirmarPagamentoEEmitirNota(db.cliente, { ownerId: OWNER, orderId: PEDIDO, formaPagamento: "pix" });

  assert.deepEqual(r, { jaConfirmado: false, notaId: null });
  const [pedido] = db.tabelas.del_orders;
  assert.equal(pedido.pago, true);
  assert.equal(pedido.forma_pagamento, "pix");
  assert.equal(pedido.valor_pago, 45.5);
  assert.equal(db.tabelas.del_notas_fiscais.length, 0);
});

test("confirmar pagamento com emissão automática emite a nota", async () => {
  const db = criarSupabaseFalso(seed({ pago: false }));
  const r = await confirmarPagamentoEEmitirNota(db.cliente, { ownerId: OWNER, orderId: PEDIDO });

  assert.equal((r as { status?: string }).status, "emitida");
  assert.equal(db.tabelas.del_orders[0].forma_pagamento, "outro");
  assert.equal(db.tabelas.del_notas_fiscais.length, 1);
});

test("pagamento já confirmado em pedido de site não faz nada", async () => {
  const db = criarSupabaseFalso(seed({ pago: true }));
  const r = await confirmarPagamentoEEmitirNota(db.cliente, { ownerId: OWNER, orderId: PEDIDO });
  assert.deepEqual(r, { jaConfirmado: true, notaId: null });
  assert.equal(db.escritas.length, 0);
});

test("balcão já pago só conclui o pedido, sem emitir de novo", async () => {
  const db = criarSupabaseFalso(seed({ pago: true, canal: "balcao" }));
  const r = await confirmarPagamentoEEmitirNota(db.cliente, { ownerId: OWNER, orderId: PEDIDO });
  assert.deepEqual(r, { jaConfirmado: true, notaId: null });
  assert.equal(db.tabelas.del_orders[0].status, "entregue");
  assert.equal(db.tabelas.del_notas_fiscais.length, 0);
});

test("pedido cancelado não pode ser marcado como pago", async () => {
  const db = criarSupabaseFalso(seed({ pago: false, status: "cancelado" }));
  await assert.rejects(confirmarPagamentoEEmitirNota(db.cliente, { ownerId: OWNER, orderId: PEDIDO }), {
    message: "Um pedido cancelado não pode ser marcado como pago.",
  });
});

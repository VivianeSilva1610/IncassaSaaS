# Plano de trabalho — INCASSA Comércio

## P0 — Integridade operacional

- Reconciliar estoque, vendas, devoluções, contas e caixa.
- Impedir estoque negativo e baixa superior ao valor da conta.
- Corrigir sinais de entradas e saídas no fechamento de caixa.
- Revisar concorrência, duplicidade e isolamento por empresa.

## P1 — Operação comercial essencial

- [x] Catálogo com variações como cor e tamanho.
- [x] Lote e validade opcionais, ativados somente por produto.
- [x] Pedidos de compra e recebimentos parciais.
- [x] Vínculo do recebimento com NF-e.
- [x] Orçamentos, pedidos de venda, reserva e faturamento no PDV.

## P2 — Fiscal, gestão e SaaS

- [x] Pré-validação fiscal e fila simulada de documentos em homologação.
- Integração com provedor fiscal real pendente.
- [x] Revisão obrigatória do contador antes da produção fiscal.
- [x] DRE, margem, giro e curva ABC (DRE por competência ativa desde a migração 0113).
- [x] Cobrança e limites (ciclo de assinatura e bloqueio da equipe ativos desde a migração 0114).
- Backups e observabilidade em execução pela frente Claude; base E2E pública concluída pela frente Codex. Proteção da assinatura diretamente no RLS pronta na migração 0115; cenários autenticados aguardam conta de homologação.

O trabalho restante foi dividido entre Codex e Claude em `docs/comercio-divisao-codex-claude.md`.

## P3 — Lançamento

- UX responsiva, acessibilidade, documentação e checklist de produção.

Quando uma etapa exigir banco, a migração será criada e o desenvolvimento seguirá sem aguardar confirmação manual.

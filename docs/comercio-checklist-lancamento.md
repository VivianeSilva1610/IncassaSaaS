# Checklist de lançamento — INCASSA Comércio

## Banco e segurança

- [ ] Executar todas as migrations do Comércio em ordem, atualmente `0076` a `0114`.
- [ ] Confirmar RLS com proprietário, gerente, funcionário e usuário sem vínculo.
- [ ] Confirmar que funcionário perde acesso quando a assinatura do proprietário é suspensa.
- [ ] Confirmar que uma chamada direta ao Supabase não consegue ativar plano, add-ons ou módulos não contratados.
- [ ] Confirmar que `viroedu@gmail.com` mantém o acesso administrativo previsto.
- [ ] Conferir índices e funções `security definer`; nenhuma função deve confiar em `owner_id` enviado pelo navegador.
- [ ] Manter o fiscal em homologação até validação do contador e contratação do provedor.

## Stripe e assinatura

- [ ] Executar `npm.cmd run check:comercio-env` no ambiente de Preview e corrigir todas as pendências obrigatórias.
- [ ] Configurar `STRIPE_PRICE_COMERCIO_SAAS` em Preview e Production.
- [ ] Confirmar `STRIPE_WEBHOOK_SECRET` do endpoint publicado.
- [ ] Simular início do teste, pagamento, `past_due`, cancelamento programado e cancelamento concluído.
- [ ] Confirmar atualização de `trial_ends_at`, `current_period_ends_at` e `cancel_at_period_end`.
- [ ] Testar portal de cobrança e retorno para `/comercio/plano`.

## Operação comercial

- [ ] Criar produto sem lote/validade e produto com rastreabilidade habilitada.
- [ ] Efetivar entrada manual e por documento fiscal de compra.
- [ ] Conferir custo médio, variação, lote e saldo de estoque.
- [ ] Abrir caixa, concluir venda, receber parcialmente, devolver e cancelar.
- [ ] Confirmar contas a receber/pagar, conciliação e fechamento do caixa.
- [ ] Conferir DRE por competência separada do fluxo de caixa.
- [ ] Confirmar que compras de estoque não duplicam o CMV na DRE.

## Backup e observabilidade

- [ ] Confirmar execução automática, retenção e alertas do backup.
- [x] Aplicar a migration `0120` de registro e paginação dos backups.
- [ ] Restaurar um backup em ambiente isolado e reconciliar contagens e totais.
- [ ] Verificar página/endpoint operacional produzido pela frente Claude.
- [ ] Confirmar que erros e logs não expõem CPF, CNPJ, tokens ou chaves.

## Qualidade

- [ ] Executar `npm.cmd run lint`.
- [ ] Executar `npm.cmd run build`.
- [ ] Instalar o navegador com `npx playwright install chromium`.
- [ ] Executar `npm.cmd run test:e2e:public` sem credenciais.
- [ ] Executar `npm.cmd run test:e2e` com uma conta exclusiva de homologação.
- [ ] Testar desktop e viewport móvel.
- [ ] Validar navegação por teclado, foco visível, labels e contraste.

## Deploy e rollback

- [ ] Criar backup antes das migrations de produção.
- [ ] Publicar primeiro em Preview e executar o smoke test.
- [ ] Registrar migrations aplicadas e horário do deploy.
- [ ] Não reverter migrations destrutivamente; aplicar migration corretiva aditiva.
- [ ] Manter a versão anterior pronta para rollback da aplicação.
- [ ] Após o deploy, testar login, assinatura, produto, venda, caixa, DRE e download do backup.

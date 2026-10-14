# Divisão de trabalho — INCASSA Comércio

Esta divisão permite trabalho paralelo sem editar os mesmos arquivos. Antes de integrar, cada frente deve executar `npm.cmd run lint` e `npm.cmd run build`.

## Regras de coordenação

- Codex reserva as migrations `0115` a `0119`.
- Claude reserva as migrations `0120` a `0124`.
- Não renumerar migrations já criadas ou executadas (`0076` a `0114`).
- Não alterar arquivos da outra frente sem registrar a necessidade neste documento.
- Não alterar tabelas do Restaurante para resolver requisitos do Comércio.
- Toda tabela nova deve ter `business_id`/`owner_id`, RLS, índices dos filtros principais e trilha auditável quando aplicável.
- Fiscal permanece em homologação; nenhuma integração deve transmitir documento real.
- Segredos nunca devem aparecer em respostas, logs ou banco em texto aberto.

## Frente Codex — qualidade e lançamento

Responsabilidade: preparar testes automatizados e o checklist técnico de lançamento.

Status: base Playwright, 48 testes públicos/de segurança em desktop e mobile e checklist implementados. A proteção de assinatura no RLS está pronta na migration `0115`. A suíte autenticada está preparada e depende apenas de uma conta exclusiva de homologação nas variáveis `E2E_COMMERCE_EMAIL` e `E2E_COMMERCE_PASSWORD`.

Escopo:

1. Configurar Playwright para o projeto.
2. Criar testes públicos de cadastro, login e escolha do sistema sem depender de credenciais reais.
3. Criar testes autenticados parametrizados por variáveis de ambiente, sem gravar senha no repositório.
4. Cobrir os fluxos críticos do Comércio: empresa, produto, entrada, venda, devolução, caixa e DRE.
5. Criar testes de autorização: proprietário, gerente, funcionário, módulos bloqueados e assinatura suspensa.
6. Preparar checklist de deploy, rollback e validação pós-deploy.

Arquivos reservados:

- `playwright.config.ts`
- `tests/e2e/comercio/**`
- scripts de teste em `package.json`
- `.env.example`, somente para variáveis de teste
- `docs/comercio-checklist-lancamento.md`
- migrations `0115` a `0119`, apenas se testes ou integridade exigirem banco

## Frente Claude — observabilidade e backups

Responsabilidade: tornar falhas operacionais detectáveis e confirmar que os backups são recuperáveis.

Escopo:

1. Auditar `src/lib/backup.ts` e `/api/cron/backup-database` quanto a cobertura, paginação, retenção e falhas parciais.
2. Garantir que todas as tabelas do Comércio, inclusive as migrations `0091` a `0114`, estejam incluídas no backup apropriado.
3. Criar registro de execuções do backup com início, fim, status, tamanho, avisos e erro sanitizado.
4. Criar endpoint protegido de saúde operacional para banco, storage, Stripe configurada e última execução do backup.
5. Criar uma tela administrativa somente leitura com o estado operacional, sem expor tokens ou dados pessoais.
6. Documentar procedimento de restauração e teste periódico de recuperação.

Arquivos reservados:

- `src/lib/backup.ts`
- `src/app/api/cron/backup-database/route.ts`
- `src/app/api/comercio/health/**`
- `src/app/comercio/operacoes/**`
- `docs/comercio-backup-restauracao.md`
- migrations `0120` a `0124`
- `scripts/backup-para-sql.mjs` (acrescentado pela frente Claude: valida o arquivo de backup e gera o SQL de restauração; arquivo novo, fora das áreas do Codex)

Claude não deve alterar nesta frente:

- `src/app/comercio/actions.ts`
- `src/lib/commerce-subscription.ts`
- webhook da Stripe
- arquivos de teste ou `package.json`
- migrations `0115` a `0119`

## Frente Claude — emissão fiscal unificada (Restaurante + Comércio)

Responsabilidade: uma camada fiscal comum aos dois sistemas, com a Focus NFe como primeiro provedor. O cliente contrata o provedor. Plano completo em `docs/comercio-plano-nfe-provedores.md`. Autorizada pela Viviane em 2026-10-14.

Status: Fases 0, 1 e 7 concluídas em 2026-10-14 (linha de base + camada comum, 19 testes de unidade passando, lint e build ok; revisão do contador virou só aviso, migration `0122` executada no Supabase). Próximas fases dependem da conta de homologação da Focus NFe. Sugestão ao Codex: incluir o comando dos testes de unidade (ver plano) nos scripts do `package.json`, que é reservado à frente Codex.

Arquivos desta frente:

- `src/lib/fiscal/core/**`, `src/lib/fiscal/restaurante/**`, `src/lib/fiscal/comercio/**`
- `src/lib/fiscal/emitir.ts` e `src/lib/fiscal/nfce.ts` (fluxo BR do Restaurante; a API pública é preservada)
- `tests/unit/**` (testes de unidade em Node puro, sem dependência nova; não toca em `tests/e2e/**`)
- migrations `0122` a `0124` (a `0121` foi usada por `0121_pranzo_acesso_gestor.sql`, de outra frente, dentro da faixa Claude; não renumerar)

Coordenação necessária:

- `src/app/comercio/actions.ts` (frente Codex): as ações fiscais do Comércio (`prepararDocumentoFiscalComercio`, `simularDocumentoFiscalComercio`) vão chamar a camada nova a partir da Fase 5. Combinar antes de editar.
- Tabelas `del_*` do Restaurante serão alteradas na Fase 2, para requisitos do **próprio** Restaurante (emissão real), não do Comércio.
- O fluxo fiscal da Itália (`emitirIt.ts`, `fatturaIt.ts`) não é alterado.

## Prompt para entregar ao Claude

> Trabalhe apenas na frente “Claude — observabilidade e backups” descrita em `docs/comercio-divisao-codex-claude.md`. Leia o `AGENTS.md` e a documentação desta versão do Next.js em `node_modules/next/dist/docs/` antes de escrever código. Preserve todas as alterações existentes e não edite os arquivos reservados ao Codex. Use somente migrations `0120` a `0124`. Audite primeiro o backup atual, implemente observabilidade segura e documentação de restauração, depois execute lint e build. Não transmita documentos fiscais, não use credenciais reais e não exponha segredos ou dados pessoais. Ao terminar, informe arquivos alterados, migrations que precisam ser executadas, validações realizadas e riscos restantes.

## Integração final

Status: migration `0120` aplicada; integração e testes conjuntos em andamento.

Após as duas frentes terminarem:

1. Revisar conflitos e migrations em ordem numérica.
2. Executar migrations pendentes no ambiente de teste.
3. Rodar lint, build e suíte E2E completa.
4. Simular assinatura ativa, suspensa e cancelada.
5. Testar geração e restauração de um backup sem dados reais de clientes.
6. Somente então preparar o deploy de produção.

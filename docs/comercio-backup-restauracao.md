# Backup e restauração — INCASSA (Comércio e Restaurante)

Procedimento operacional. Vale para o banco inteiro (schema `public` + lista mínima de `auth.users`), não só para o Comércio.

## 1. Como o backup funciona

| Item | Valor |
|---|---|
| Agendamento | Vercel Cron, `0 3 * * *` (03:00 UTC), em `vercel.json` |
| Rota | `GET /api/cron/backup-database`, exige `Authorization: Bearer $CRON_SECRET` (mínimo de 16 caracteres; sem ele a rota recusa tudo) |
| Execução manual | mesma rota com `?origem=manual` |
| Cobertura | todas as tabelas `BASE TABLE` do schema `public`, descobertas na hora pela função `backup_tabelas_metadados()` (migration 0120). Tabela nova do Comércio entra sozinha, sem mexer no código |
| Paginação | 1000 linhas por request, ordenadas pela chave primária, até 200.000 linhas por tabela. O total exportado é comparado com o `count` exato da tabela |
| `auth.users` | só `id`, `email`, `phone`, `created_at` e `email_confirmed_at`. Nunca hash de senha nem metadados |
| Formato | `backup-<ISO com hora>.json.gz`: JSON `{ formato: 2, geradoEm, tabelas, metadados, usuariosAuth, avisos, incompleto }` compactado em gzip |
| Cópia 1 | bucket privado `backups` do Storage do próprio projeto, completa |
| Cópia 2 | e-mail para o administrador, com **credenciais de terceiros redigidas** (`*api_key*`, `*secret*`, `senha`, `password`, `private_key` → `[REDIGIDO]`). Só sai se tiver até 35 MB |
| Verificação | logo após o upload o arquivo é baixado de volta e o sha256 é comparado |
| Retenção | 30 dias, sempre mantendo pelo menos os 7 arquivos mais recentes. A limpeza **só roda depois de um backup com status `sucesso`**: uma sequência de falhas nunca apaga backups bons |
| Registro | cada execução gera uma linha em `ops_backup_runs` (início, fim, status, tamanho, sha256, tabelas, linhas, avisos, erro sanitizado). O registro é guardado por 180 dias |

### Status de uma execução

- `sucesso`: todas as tabelas foram exportadas, as contagens conferem e o checksum no Storage confere.
- `parcial`: o arquivo foi salvo, mas há tabela com erro, contagem divergente, limite atingido ou verificação falha. Ele **não** dispara a retenção.
- `falha`: nenhum arquivo foi salvo. Um e-mail "FALHA no backup do banco" é enviado e a rota responde 500 (visível nos logs do Vercel Cron).
- `interrompido` (só na leitura): a execução ficou mais de 15 minutos em `executando`, ou seja, a function foi encerrada no meio (timeout ou memória).

## 2. Monitoramento

- **Tela:** `/comercio/operacoes`, acessível só a e-mails em `ADMIN_EMAILS` (para os demais usuários a página responde 404). É somente leitura e não está no menu, então abra digitando a URL.
- **Endpoint:** `GET /api/comercio/health`
  - Acesso por sessão de administrador, ou com `Authorization: Bearer $HEALTHCHECK_SECRET`. Se `HEALTHCHECK_SECRET` não estiver configurada, vale `CRON_SECRET`; o recomendado é criar uma variável própria para o monitor externo.
  - Responde 200 quando o status é `ok`/`atencao` e 503 quando é `falha`. Basta configurar um monitor (UptimeRobot, Better Stack etc.) para alertar com base no código HTTP.
  - O retorno contém só estados, contagens, datas e latências: nunca chaves, tokens, e-mails ou dados de clientes.
- **Regras de alerta do backup:** `atencao` se o último sucesso tiver mais de 26 h ou se a última execução não tiver sido `sucesso`; `falha` se passar de 50 h sem sucesso ou se não houver registro.

## 3. Onde buscar o arquivo para restaurar

1. **Storage** (preferido, pois é a cópia completa): Supabase Dashboard → Storage → bucket `backups` → baixe o `backup-…json.gz` desejado. O sha256 dele está na linha correspondente de `ops_backup_runs` (coluna `sha256`).
2. **E-mail** (use quando o próprio projeto Supabase estiver indisponível): anexo `…-sem-credenciais.json.gz`. O sha256 que aparece no corpo do e-mail é o do arquivo do **Storage**, não o do anexo, então não use `--sha256` com o anexo.

## 4. Validar o arquivo (sem tocar em banco)

```bash
node scripts/backup-para-sql.mjs backup-2026-10-13T03-00-04-123Z.json.gz --sha256 <sha256 de ops_backup_runs>
```

O script descompacta, confere o checksum, lista cada tabela com o total exportado e o `count` da origem, e avisa se há credenciais redigidas. Códigos de saída: `0` ok, `1` arquivo inválido/checksum diferente, `2` divergência de contagem.

## 5. Restaurar

> **Nunca restaure direto em produção sem antes fazer o mesmo procedimento num projeto de teste.** Tudo roda numa transação única: se algo falhar, nada é gravado.
>
> Um banco recém-migrado **não está vazio**: migrations como `0024` e as de assinatura inserem linhas de seed (`commerce_subscriptions`, `del_staff`, `restaurant_members`, `restaurants`). Por isso o restore precisa de `--substituir`, que esvazia as tabelas do backup antes de inserir. Sem a flag, o SQL aborta e lista as tabelas que já têm dados.

1. **Banco de destino:** crie um projeto Supabase de teste (ou uma branch) e aplique **todas** as migrations em ordem (`supabase/migrations`, `0001` em diante). O schema precisa existir antes, porque o backup contém só dados.
2. **Gerar o SQL**, do banco inteiro ou só do Comércio:
   ```bash
   # banco inteiro + contas de login (projeto novo)
   node scripts/backup-para-sql.mjs <arquivo>.json.gz --sha256 <hash> --substituir --com-usuarios-auth --saida restore.sql
   # só o Comércio, num destino que já tem as contas
   node scripts/backup-para-sql.mjs <arquivo>.json.gz --sha256 <hash> --prefixo commerce_ --substituir --saida restore-comercio.sql
   ```
3. **Aplicar** com a connection string do banco de destino (Dashboard → Connect → Session pooler ou Direct):
   ```bash
   psql "<connection string do projeto de TESTE>" -f restore.sql
   ```
   - O SQL usa `session_replication_role = replica` dentro da transação para desligar triggers (log de atividade, movimentos de estoque) e checagem de FK, já que as tabelas entram em ordem alfabética. Por isso o restore não recalcula nada: os saldos vêm prontos do backup.
   - Coluna que existe no backup e não no destino é ignorada. Coluna nova no destino fica com o default.
   - Ao final, as sequências de `identity`/`serial` são ajustadas para `max(id) + 1`.
   - Se `set local session_replication_role` for recusado por permissão, rode com o usuário `postgres` da connection string direta (não com o pooler em modo transaction). Esse ponto foi testado só em Postgres local como superusuário; a primeira restauração num projeto Supabase precisa confirmar.
4. **Usuários (`auth.users`):** com `--com-usuarios-auth`, o SQL recria as contas **com o mesmo `id`** (mais a linha em `auth.identities`) na mesma transação, com triggers desligados.
   - Precisa ser feito assim. Se as contas forem criadas *depois* do restore, o trigger `handle_new_user` tenta inserir em `profiles`, que já foi restaurado, e falha por chave duplicada (comportamento confirmado no teste).
   - Sem as contas, os dados entram, mas qualquer insert novo com `owner_id`/`created_by` falha na FK para `auth.users`.
   - O backup não guarda hash de senha: cada pessoa entra usando "esqueci a senha".
   - O teste local usou uma réplica simplificada do schema `auth`. No Supabase real, confirme no primeiro teste que o login com a senha redefinida funciona.
5. **Credenciais:** se o arquivo veio do e-mail, as colunas `[REDIGIDO]` precisam ser preenchidas de novo por cada cliente (chaves Stripe/Asaas/Resend/provedor fiscal). Avise os clientes antes de reativar pagamentos.
6. **Storage:** o único bucket é `backups`. Fotos, logos e capas são URLs externas e não estão no Supabase, então não há arquivos de clientes para restaurar.

## 6. Reconciliação depois do restore

Rode no banco restaurado e compare com a saída do passo 4 (coluna "count na origem"):

```sql
-- contagem por tabela do Comércio
select relname as tabela, n_live_tup as linhas_aprox
from pg_stat_user_tables where schemaname = 'public' and relname like 'commerce_%' order by 1;

-- contagem exata de uma tabela específica
select count(*) from commerce_sales;

-- totais que precisam bater com a origem (rode nos dois bancos)
select business_id, count(*), sum(total) from commerce_sales group by 1 order by 1;
select business_id, product_id, sum(quantidade) from commerce_inventory_movements group by 1, 2 order by 1, 2 limit 50;
select business_id, status, count(*), sum(valor) from commerce_accounts_receivable group by 1, 2 order by 1, 2;
```

Os nomes de colunas de valor (`total`, `valor`, `quantidade`) seguem as migrations 0076+. Ajuste se o schema mudar.

Por fim, entre no app apontando para o projeto restaurado (`.env.local` de teste) com a conta de testes e confira produtos, uma venda, o caixa e a DRE.

## 7. Teste periódico de recuperação

**Frequência:** mensal, e sempre antes de aplicar migrations em produção.

1. Escolha o backup `sucesso` mais recente em `/comercio/operacoes`.
2. Faça os passos 4 → 5 → 6 num projeto de teste descartável, com o recorte `--prefixo commerce_` se o objetivo for só o Comércio.
3. Use **somente** o projeto de teste. Não use dados de produção fora do ambiente de teste: apague o projeto de teste ao terminar, porque os dados restaurados são dados reais de clientes.
4. Registre o resultado na tabela abaixo.

| Data | Backup usado (arquivo) | Quem | Tempo total | Contagens conferem? | Problemas |
|---|---|---|---|---|---|
| | | | | | |

### Teste sem dados reais de clientes (integração final)

Para o ensaio pedido em "Integração final" do plano de divisão, há duas opções:

- Gere o backup a partir de um projeto de **homologação** que tenha só a conta de testes (`teste-italia@incassa.eu` / conta E2E), configurando `CRON_SECRET` nele e chamando `/api/cron/backup-database?origem=manual`.
- Ou valide só a mecânica com um arquivo sintético: monte um JSON no formato acima com 1–2 linhas por tabela, compacte com gzip e rode os passos 4 e 5 contra um Postgres local com as migrations aplicadas.

## 7.1 Registro de testes já feitos

| Data | Backup usado | Ambiente | Resultado |
|---|---|---|---|
| 2026-10-13 | gerado pelo `gerarBackupCompleto` real via PostgREST (`db-max-rows=1000`) a partir de dados fictícios (1 empresa, 2.500 produtos, 1.200 clientes, 2.500 movimentos, 6.200 linhas de log) | Postgres 16 local em Docker, 120 migrations aplicadas na origem e no destino, `auth`/`storage` simulados | 107 tabelas idênticas linha a linha (hash por tabela); usuários recriados; sequências continuaram (próximo id correto); inserts e triggers funcionando depois do restore. O código antigo teria exportado só 1.000 dos 2.500 produtos |

## 8. Limitações conhecidas

- **Sem consistência de snapshot:** as tabelas são lidas uma após a outra (a paginação usa offset). Uma escrita durante o backup pode causar divergência de contagem, que é detectada e marcada como `parcial`. O horário de 03:00 UTC minimiza esse risco.
- **Memória e tempo:** o backup inteiro é montado em memória numa function com `maxDuration = 300`. Quando a soma passar de algumas centenas de MB ou de 5 minutos, a execução aparece como `interrompido`. Nesse ponto, migre para o plano Pro do Supabase (PITR/pg_dump) ou para um backup por tabela.
- **O Storage fica no mesmo projeto:** se o projeto Supabase for perdido, sobra só a cópia por e-mail, que não leva credenciais e só sai até 35 MB.
- **Credenciais em texto aberto:** as chaves de terceiros dos clientes estão em texto aberto nas tabelas (e, portanto, na cópia completa do Storage). Esse problema é anterior a este trabalho; o ideal é criptografar em repouso (Supabase Vault/pgsodium).

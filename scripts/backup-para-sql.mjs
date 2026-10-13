#!/usr/bin/env node
// Valida um arquivo de backup gerado por /api/cron/backup-database e, se
// pedido, gera o SQL que o restaura num banco Postgres/Supabase.
//
//   node scripts/backup-para-sql.mjs <backup.json.gz> [--sha256 <hash>] [--prefixo commerce_] [--saida restore.sql] [--substituir] [--com-usuarios-auth]
//
// --substituir: o SQL esvazia (truncate) as tabelas do backup no destino
// antes de inserir. Necessário mesmo num banco recém-migrado, porque
// algumas migrations já inserem linhas (seed). Sem ele, o SQL aborta se
// qualquer tabela do backup já tiver dados no destino.
// --com-usuarios-auth: recria as contas de auth.users (mesmo id, sem senha)
// a partir de usuariosAuth do backup. Use só num projeto novo.
// Sem --saida só valida (checksum, formato, contagem por tabela) e não
// escreve nada. Não conecta em banco nenhum: o SQL gerado é aplicado à mão
// com psql, sempre primeiro num projeto de TESTE (ver
// docs/comercio-backup-restauracao.md).

import { createHash, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const VALOR_REDIGIDO = "[REDIGIDO]";

function argumentos(argv) {
  const opcoes = { arquivo: null, sha256: null, prefixo: null, saida: null, substituir: false, comUsuariosAuth: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--sha256") opcoes.sha256 = argv[++i];
    else if (a === "--prefixo") opcoes.prefixo = argv[++i];
    else if (a === "--saida") opcoes.saida = argv[++i];
    else if (a === "--substituir") opcoes.substituir = true;
    else if (a === "--com-usuarios-auth") opcoes.comUsuariosAuth = true;
    else if (!opcoes.arquivo) opcoes.arquivo = a;
  }
  return opcoes;
}

function falhar(msg) {
  console.error(`ERRO: ${msg}`);
  process.exit(1);
}

const opcoes = argumentos(process.argv.slice(2));
if (!opcoes.arquivo) falhar("informe o arquivo .json.gz do backup");

const bruto = readFileSync(opcoes.arquivo);
const sha = createHash("sha256").update(bruto).digest("hex");
console.log(`sha256: ${sha}`);
if (opcoes.sha256 && opcoes.sha256.toLowerCase() !== sha) {
  falhar(`checksum não confere (esperado ${opcoes.sha256}) — arquivo corrompido ou trocado`);
}

let backup;
try {
  backup = JSON.parse(gunzipSync(bruto).toString("utf-8"));
} catch (e) {
  falhar(`não foi possível descompactar/ler o JSON: ${e.message}`);
}
if (!backup || typeof backup.tabelas !== "object") falhar("arquivo não tem o campo 'tabelas'");

const formato = backup.formato ?? 1;
console.log(`formato: ${formato} · gerado em: ${backup.geradoEm}`);
if (backup.incompleto) console.warn("ATENÇÃO: o backup foi marcado como incompleto quando gerado.");
for (const aviso of backup.avisos ?? []) console.warn(`aviso do backup: ${aviso}`);

const nomes = Object.keys(backup.tabelas)
  .filter((n) => !opcoes.prefixo || n.startsWith(opcoes.prefixo))
  .sort();
let problemas = 0;
let totalLinhas = 0;
let redigidas = 0;
for (const nome of nomes) {
  const linhas = backup.tabelas[nome];
  if (!Array.isArray(linhas)) {
    console.error(`  ${nome}: conteúdo inválido`);
    problemas++;
    continue;
  }
  totalLinhas += linhas.length;
  const meta = backup.metadados?.tabelas?.[nome];
  const esperado = meta?.esperado;
  const confere = esperado == null || esperado === linhas.length;
  if (!confere) problemas++;
  if (JSON.stringify(linhas).includes(`"${VALOR_REDIGIDO}"`)) redigidas++;
  console.log(`  ${confere ? "ok " : "!! "} ${nome}: ${linhas.length}${esperado != null ? ` (count na origem: ${esperado})` : ""}`);
}
console.log(`${nomes.length} tabelas · ${totalLinhas} linhas · ${(backup.usuariosAuth ?? []).length} usuários auth`);
if (redigidas > 0) {
  console.warn(`ATENÇÃO: ${redigidas} tabela(s) têm credenciais redigidas (cópia de e-mail). Após restaurar, os clientes precisam informar as chaves de novo.`);
}
if (problemas > 0) console.warn(`${problemas} tabela(s) com divergência de contagem — veja acima.`);

if (!opcoes.saida) {
  console.log("Validação concluída. Use --saida restore.sql para gerar o SQL de restauração.");
  process.exit(problemas > 0 ? 2 : 0);
}

const json = (valor) => JSON.stringify(valor);
let tag = `$bk${randomBytes(6).toString("hex")}$`;
while (nomes.some((n) => json(backup.tabelas[n]).includes(tag))) tag = `$bk${randomBytes(6).toString("hex")}$`;

const partes = [];
partes.push(`-- Restauração gerada por scripts/backup-para-sql.mjs
-- Origem: ${opcoes.arquivo} · sha256 ${sha} · gerado em ${backup.geradoEm}
-- Aplique SOMENTE num banco de teste (schema já migrado) antes de
-- qualquer uso em produção. Roda numa transação única: se qualquer tabela
-- falhar, nada é gravado.
-- Modo: ${opcoes.substituir ? "SUBSTITUIR — esvazia as tabelas do backup no destino antes de inserir" : "somente inserir — aborta se o destino já tiver dados nessas tabelas"}
\\set ON_ERROR_STOP on
begin;
-- Desliga triggers e checagem de FK só nesta transação: as tabelas entram
-- em ordem alfabética e o log de atividade não pode ser re-disparado.
set local session_replication_role = replica;
create temp table _restauracao (tabela text primary key, dados jsonb not null) on commit drop;
`);
for (const nome of nomes) {
  const linhas = backup.tabelas[nome];
  if (!Array.isArray(linhas) || linhas.length === 0) continue;
  partes.push(`insert into _restauracao values ('${nome.replace(/'/g, "''")}', ${tag}${json(linhas)}${tag}::jsonb);\n`);
}
// Contas de login com o mesmo id da origem, dentro da mesma transação (com
// triggers desligados): criadas depois, o trigger handle_new_user tentaria
// inserir em profiles, que o restore já preencheu. Sem senha — cada pessoa
// usa "esqueci a senha" no primeiro acesso.
const usuariosAuth = Array.isArray(backup.usuariosAuth) ? backup.usuariosAuth : [];
if (opcoes.comUsuariosAuth && usuariosAuth.length > 0) {
  let tagUsuarios = `$us${randomBytes(6).toString("hex")}$`;
  while (json(usuariosAuth).includes(tagUsuarios)) tagUsuarios = `$us${randomBytes(6).toString("hex")}$`;
  partes.push(`
create temp table _usuarios on commit drop as
  select * from jsonb_to_recordset(${tagUsuarios}${json(usuariosAuth)}${tagUsuarios}::jsonb)
    as u(id uuid, email text, phone text, created_at timestamptz, email_confirmed_at timestamptz);
insert into auth.users (instance_id, id, aud, role, email, phone, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email, nullif(phone, ''), email_confirmed_at, created_at, now(),
       '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb
  from _usuarios
on conflict (id) do nothing;
insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
select id::text, id, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', email_confirmed_at is not null), 'email', created_at, now()
  from _usuarios where email is not null
on conflict do nothing;
`);
}

const listaTabelas = `array[${nomes.map((n) => `'${n.replace(/'/g, "''")}'`).join(", ")}]::text[]`;
const acaoPreparo = opcoes.substituir
  ? `  if array_length(existentes, 1) > 0 then
    execute 'truncate table ' || (select string_agg(format('public.%I', x), ', ') from unnest(existentes) x);
    raise notice 'esvaziadas % tabelas antes de restaurar (% tinham dados)', array_length(existentes, 1), coalesce(array_length(com_dados, 1), 0);
  end if;`
  : `  if array_length(com_dados, 1) > 0 then
    raise exception 'destino já tem dados em: % — gere o SQL com --substituir se a intenção é sobrescrever', array_to_string(com_dados, ', ');
  end if;`;
partes.push(`
do $prepara$
declare
  t text;
  existentes text[] := '{}';
  com_dados text[] := '{}';
  tem boolean;
begin
  foreach t in array ${listaTabelas} loop
    if to_regclass(format('public.%I', t)) is null then continue; end if;
    existentes := existentes || t;
    execute format('select exists (select 1 from public.%I)', t) into tem;
    if tem then com_dados := com_dados || t; end if;
  end loop;
${acaoPreparo}
end
$prepara$;
`);
partes.push(`
do $restaura$
declare
  r record;
  cols text;
  n bigint;
begin
  for r in select * from _restauracao order by tabela loop
    if to_regclass(format('public.%I', r.tabela)) is null then
      raise notice 'tabela % não existe no destino — pulando', r.tabela;
      continue;
    end if;
    -- Só colunas que existem no destino E no backup: coluna nova no schema
    -- fica com o default, coluna removida do schema é ignorada.
    select string_agg(quote_ident(c.column_name), ', ' order by c.ordinal_position)
      into cols
      from information_schema.columns c
     where c.table_schema = 'public'
       and c.table_name = r.tabela
       and c.is_generated = 'NEVER'
       and exists (select 1 from jsonb_object_keys(r.dados -> 0) k where k = c.column_name);
    if cols is null then
      raise notice 'tabela % sem colunas em comum — pulando', r.tabela;
      continue;
    end if;
    execute format(
      'insert into public.%I (%s) overriding system value select %s from jsonb_populate_recordset(null::public.%I, $1)',
      r.tabela, cols, cols, r.tabela
    ) using r.dados;
    get diagnostics n = row_count;
    raise notice '% : % linhas', r.tabela, n;
  end loop;

  -- Sequências de identity/serial voltam a apontar pro maior id restaurado.
  for r in
    select c.table_name, c.column_name, pg_get_serial_sequence(format('public.%I', c.table_name), c.column_name) as seq
      from information_schema.columns c
     where c.table_schema = 'public'
       and pg_get_serial_sequence(format('public.%I', c.table_name), c.column_name) is not null
  loop
    execute format('select setval(%L, coalesce((select max(%I) from public.%I), 0) + 1, false)', r.seq, r.column_name, r.table_name);
  end loop;
end
$restaura$;

commit;
`);

writeFileSync(opcoes.saida, partes.join(""), "utf-8");
console.log(`SQL de restauração escrito em ${opcoes.saida}`);

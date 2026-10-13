import type { SupabaseClient } from "@supabase/supabase-js";

// O PostgREST do Supabase devolve no máximo 1000 linhas por request
// (db-max-rows), mesmo pedindo .limit() maior — por isso cada tabela é lida
// em páginas, ordenadas pela chave primária, e o total exportado é
// conferido contra o count exato da tabela.
const LINHAS_POR_PAGINA = 1000;
// Teto por tabela — só pra evitar que a function estoure memória se algum
// dia uma tabela crescer demais; o backup sai marcado como incompleto.
const LIMITE_LINHAS_POR_TABELA = 200_000;

// Colunas com credencial de terceiros (chave Asaas/Stripe/Resend/provedor
// fiscal de cada cliente). Ficam inteiras só na cópia do Storage privado
// (mesmo projeto onde já estão em texto aberto); a cópia que sai por e-mail
// leva o valor substituído.
const COLUNA_SEGREDO = /(api_key|secret|senha|password|private_key)/i;
export const VALOR_REDIGIDO = "[REDIGIDO]";

export const FORMATO_BACKUP = 2;

export type MetadadosTabela = {
  linhas: number;
  esperado: number | null;
  pk: string[] | null;
};

export type UsuarioAuthBackup = {
  id: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  email_confirmed_at: string | null;
};

export type BackupCompleto = {
  formato: typeof FORMATO_BACKUP;
  geradoEm: string;
  tabelas: Record<string, unknown[]>;
  metadados: { tabelas: Record<string, MetadadosTabela>; colunasRedigidas: string[] };
  usuariosAuth: UsuarioAuthBackup[];
  avisos: string[];
  // true quando alguma tabela ficou de fora ou veio com menos linhas do que
  // o count exato — a execução é registrada como "parcial", não "sucesso".
  incompleto: boolean;
};

async function listarTabelas(
  supabase: SupabaseClient,
  avisos: string[],
): Promise<Array<{ tabela: string; colunas_pk: string[] | null }>> {
  const { data, error } = await supabase.rpc("backup_tabelas_metadados");
  if (!error && data) return data as Array<{ tabela: string; colunas_pk: string[] | null }>;

  // Migration 0120 ainda não aplicada: cai na função antiga, sem PK.
  const antigo = await supabase.rpc("listar_tabelas_backup");
  if (antigo.error || !antigo.data) {
    throw new Error(`Não foi possível listar as tabelas: ${antigo.error?.message ?? "resultado vazio"}`);
  }
  avisos.push("backup_tabelas_metadados indisponível (migration 0120 pendente) — paginação sem ordem estável");
  return (antigo.data as string[]).map((tabela) => ({ tabela, colunas_pk: null }));
}

async function exportarTabela(
  supabase: SupabaseClient,
  tabela: string,
  pk: string[] | null,
): Promise<{ linhas: unknown[]; esperado: number | null; erro?: string }> {
  const linhas: unknown[] = [];
  let esperado: number | null = null;

  for (let inicio = 0; inicio < LIMITE_LINHAS_POR_TABELA; inicio += LINHAS_POR_PAGINA) {
    let query = supabase.from(tabela).select("*", inicio === 0 ? { count: "exact" } : undefined);
    for (const coluna of pk ?? []) query = query.order(coluna, { ascending: true });
    const { data, error, count } = await query.range(inicio, inicio + LINHAS_POR_PAGINA - 1);
    if (error) return { linhas, esperado, erro: error.message };
    if (inicio === 0) esperado = count ?? null;
    linhas.push(...(data ?? []));
    // Para pela página vazia ou pelo count — nunca por "veio menos que
    // LINHAS_POR_PAGINA", que truncaria se o max-rows do projeto for menor.
    if (!data || data.length === 0) break;
    if (esperado !== null && linhas.length >= esperado) break;
  }
  return { linhas, esperado };
}

async function exportarUsuariosAuth(supabase: SupabaseClient): Promise<UsuarioAuthBackup[]> {
  // auth.users não é exposto pelo PostgREST; sem esta lista o restore teria
  // todas as linhas com owner_id/user_id apontando pra ninguém. Guarda só
  // o mínimo pra recriar as contas — nunca hash de senha nem metadados.
  const usuarios: UsuarioAuthBackup[] = [];
  for (let page = 1; page < 1000; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      // Erros do GoTrue às vezes chegam com message "{}" — usa nome/status.
      const detalhe = error.message && error.message !== "{}" ? error.message : `${error.name} (HTTP ${error.status ?? "?"})`;
      throw new Error(detalhe);
    }
    for (const u of data.users) {
      usuarios.push({
        id: u.id,
        email: u.email ?? null,
        phone: u.phone ?? null,
        created_at: u.created_at,
        email_confirmed_at: u.email_confirmed_at ?? null,
      });
    }
    if (data.users.length < 1000) break;
  }
  return usuarios;
}

export async function gerarBackupCompleto(supabase: SupabaseClient): Promise<BackupCompleto> {
  const avisos: string[] = [];
  let incompleto = false;
  const nomesTabelas = await listarTabelas(supabase, avisos);

  const tabelas: Record<string, unknown[]> = {};
  const metadadosTabelas: Record<string, MetadadosTabela> = {};

  for (const { tabela, colunas_pk } of nomesTabelas) {
    if (!colunas_pk?.length && !avisos.some((a) => a.startsWith("backup_tabelas_metadados"))) {
      avisos.push(`${tabela}: sem chave primária, paginação sem ordem estável`);
    }
    const { linhas, esperado, erro } = await exportarTabela(supabase, tabela, colunas_pk);
    if (erro) {
      avisos.push(`${tabela}: não foi possível exportar (${sanitizarErro(erro)})`);
      incompleto = true;
      continue;
    }
    tabelas[tabela] = linhas;
    metadadosTabelas[tabela] = { linhas: linhas.length, esperado, pk: colunas_pk };
    if (linhas.length >= LIMITE_LINHAS_POR_TABELA) {
      avisos.push(`${tabela}: atingiu o limite de ${LIMITE_LINHAS_POR_TABELA} linhas, backup incompleto`);
      incompleto = true;
    } else if (esperado !== null && linhas.length !== esperado) {
      // Pode ser escrita concorrente durante a leitura; registra e marca
      // como parcial pra alguém olhar.
      avisos.push(`${tabela}: exportou ${linhas.length} linhas, count da tabela era ${esperado}`);
      incompleto = true;
    }
  }

  let usuariosAuth: UsuarioAuthBackup[] = [];
  try {
    usuariosAuth = await exportarUsuariosAuth(supabase);
  } catch (e) {
    avisos.push(`auth.users: não foi possível exportar (${sanitizarErro(e)})`);
    incompleto = true;
  }

  return {
    formato: FORMATO_BACKUP,
    geradoEm: new Date().toISOString(),
    tabelas,
    metadados: { tabelas: metadadosTabelas, colunasRedigidas: [] },
    usuariosAuth,
    avisos,
    incompleto,
  };
}

// Cópia do backup com as colunas de credencial substituídas por
// VALOR_REDIGIDO — é a que pode sair do Supabase (e-mail).
export function redigirSegredos(backup: BackupCompleto): BackupCompleto {
  const colunasRedigidas: string[] = [];
  const tabelas: Record<string, unknown[]> = {};
  for (const [nome, linhas] of Object.entries(backup.tabelas)) {
    const primeira = linhas[0] as Record<string, unknown> | undefined;
    const colunas = primeira ? Object.keys(primeira).filter((c) => COLUNA_SEGREDO.test(c)) : [];
    if (colunas.length === 0) {
      tabelas[nome] = linhas;
      continue;
    }
    colunasRedigidas.push(...colunas.map((c) => `${nome}.${c}`));
    tabelas[nome] = linhas.map((linha) => {
      const copia = { ...(linha as Record<string, unknown>) };
      for (const c of colunas) if (copia[c] != null) copia[c] = VALOR_REDIGIDO;
      return copia;
    });
  }
  return { ...backup, tabelas, metadados: { ...backup.metadados, colunasRedigidas } };
}

// Mensagem de erro segura pra gravar no banco, devolver na resposta ou
// mandar por e-mail: tira tokens/chaves/JWT/e-mails e corta o tamanho.
export function sanitizarErro(erro: unknown): string {
  const bruto = erro instanceof Error ? erro.message : typeof erro === "string" ? erro : "erro desconhecido";
  return bruto
    .replace(/\b(sk|rk|pk|whsec)_(live|test)?_?[A-Za-z0-9]{8,}\b/g, "[chave]")
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[jwt]")
    .replace(/\bBearer\s+\S+/gi, "Bearer [token]")
    .replace(/(apikey|api_key|token|secret|password|senha)=([^&\s]+)/gi, "$1=[redigido]")
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[email]")
    .slice(0, 500);
}

export type StatusExecucaoBackup = "executando" | "sucesso" | "parcial" | "falha";

// Registro em ops_backup_runs. Nunca derruba o backup se a tabela ainda
// não existir (migration 0120 pendente) — só devolve null.
export async function registrarInicioBackup(
  supabase: SupabaseClient,
  origem: "cron" | "manual",
): Promise<string | null> {
  const { data, error } = await supabase
    .from("ops_backup_runs")
    .insert({ origem, status: "executando" })
    .select("id")
    .single();
  if (error || !data) return null;
  return data.id as string;
}

export async function registrarFimBackup(
  supabase: SupabaseClient,
  runId: string | null,
  resultado: {
    status: Exclude<StatusExecucaoBackup, "executando">;
    arquivo?: string | null;
    tamanhoBytes?: number | null;
    sha256?: string | null;
    tabelasTotal?: number | null;
    linhasTotal?: number | null;
    usuariosAuthTotal?: number | null;
    avisos?: string[];
    erro?: string | null;
    emailEnviado?: boolean;
    verificado?: boolean;
    backupsRemovidos?: number;
  },
): Promise<void> {
  if (!runId) return;
  await supabase
    .from("ops_backup_runs")
    .update({
      status: resultado.status,
      finalizado_em: new Date().toISOString(),
      arquivo: resultado.arquivo ?? null,
      tamanho_bytes: resultado.tamanhoBytes ?? null,
      sha256: resultado.sha256 ?? null,
      tabelas_total: resultado.tabelasTotal ?? null,
      linhas_total: resultado.linhasTotal ?? null,
      usuarios_auth_total: resultado.usuariosAuthTotal ?? null,
      avisos: (resultado.avisos ?? []).slice(0, 200).map((a) => a.slice(0, 500)),
      erro: resultado.erro ? resultado.erro.slice(0, 1000) : null,
      email_enviado: resultado.emailEnviado ?? false,
      verificado: resultado.verificado ?? false,
      backups_removidos: resultado.backupsRemovidos ?? 0,
    })
    .eq("id", runId);
}

import { getSupabaseAdmin } from "@/lib/supabase";
import { sanitizarErro } from "@/lib/backup";

// Verificações de saúde operacional usadas por GET /api/comercio/health e
// pela tela /comercio/operacoes. Tudo aqui volta só estado, contagem, data
// e latência — nunca token, chave, e-mail ou dado de cliente.

export type NivelSaude = "ok" | "atencao" | "falha";

export type ExecucaoBackupResumo = {
  status: "executando" | "sucesso" | "parcial" | "falha" | "interrompido";
  origem: string;
  iniciadoEm: string;
  finalizadoEm: string | null;
  duracaoSegundos: number | null;
  tamanhoBytes: number | null;
  tabelas: number | null;
  linhas: number | null;
  usuariosAuth: number | null;
  verificado: boolean;
  emailEnviado: boolean;
  avisos: string[];
  erro: string | null;
};

export type SaudeOperacional = {
  status: NivelSaude;
  verificadoEm: string;
  banco: { status: NivelSaude; latenciaMs: number | null; erro: string | null };
  storage: {
    status: NivelSaude;
    latenciaMs: number | null;
    arquivosBackup: number | null;
    ultimoArquivoEm: string | null;
    erro: string | null;
  };
  stripe: {
    status: NivelSaude;
    chaveConfigurada: boolean;
    modo: "producao" | "teste" | "desconhecido" | null;
    webhookConfigurado: boolean;
    precoComercioConfigurado: boolean;
  };
  backup: {
    status: NivelSaude;
    registroDisponivel: boolean;
    horasDesdeUltimoSucesso: number | null;
    ultimoSucessoEm: string | null;
    ultimaExecucao: ExecucaoBackupResumo | null;
    historico: ExecucaoBackupResumo[];
    cronSecretConfigurado: boolean;
    emailConfigurado: boolean;
  };
};

// Cron roda 1x/dia às 03:00 UTC; 26h dá folga pra atraso do agendador.
const HORAS_ATENCAO = 26;
const HORAS_FALHA = 50;
// Function do backup tem maxDuration 300s; passou disso ainda "executando"
// significa que foi morta no meio.
const MINUTOS_INTERROMPIDO = 15;

const COLUNAS_RUN =
  "status, origem, iniciado_em, finalizado_em, tamanho_bytes, tabelas_total, linhas_total, usuarios_auth_total, verificado, email_enviado, avisos, erro";

type RunRow = {
  status: ExecucaoBackupResumo["status"];
  origem: string;
  iniciado_em: string;
  finalizado_em: string | null;
  tamanho_bytes: number | null;
  tabelas_total: number | null;
  linhas_total: number | null;
  usuarios_auth_total: number | null;
  verificado: boolean;
  email_enviado: boolean;
  avisos: string[] | null;
  erro: string | null;
};

function resumir(row: RunRow, agora: number): ExecucaoBackupResumo {
  const inicio = new Date(row.iniciado_em).getTime();
  const interrompido = row.status === "executando" && agora - inicio > MINUTOS_INTERROMPIDO * 60_000;
  return {
    status: interrompido ? "interrompido" : row.status,
    origem: row.origem,
    iniciadoEm: row.iniciado_em,
    finalizadoEm: row.finalizado_em,
    duracaoSegundos: row.finalizado_em ? Math.round((new Date(row.finalizado_em).getTime() - inicio) / 1000) : null,
    tamanhoBytes: row.tamanho_bytes,
    tabelas: row.tabelas_total,
    linhas: row.linhas_total,
    usuariosAuth: row.usuarios_auth_total,
    verificado: row.verificado,
    emailEnviado: row.email_enviado,
    // Avisos e erro já foram sanitizados ao gravar; sanitiza de novo por
    // garantia antes de mostrar.
    avisos: (row.avisos ?? []).slice(0, 50).map((a) => sanitizarErro(a)),
    erro: row.erro ? sanitizarErro(row.erro) : null,
  };
}

function pior(...niveis: NivelSaude[]): NivelSaude {
  if (niveis.includes("falha")) return "falha";
  if (niveis.includes("atencao")) return "atencao";
  return "ok";
}

function modoStripe(chave: string | undefined): SaudeOperacional["stripe"]["modo"] {
  if (!chave) return null;
  if (/^(sk|rk)_live_/.test(chave)) return "producao";
  if (/^(sk|rk)_test_/.test(chave)) return "teste";
  return "desconhecido";
}

async function medir<T>(fn: () => PromiseLike<T>): Promise<{ resultado: T; ms: number }> {
  const inicio = performance.now();
  const resultado = await fn();
  return { resultado, ms: Math.round(performance.now() - inicio) };
}

export async function verificarSaudeOperacional(): Promise<SaudeOperacional> {
  const supabase = getSupabaseAdmin();
  const agora = Date.now();

  const [banco, storage, runs, sucesso] = await Promise.all([
    medir(() => supabase.from("commerce_businesses").select("id", { count: "exact", head: true })).catch((e) => ({
      resultado: { error: { message: sanitizarErro(e) } },
      ms: null,
    })),
    medir(() =>
      supabase.storage.from("backups").list("", { limit: 1000, sortBy: { column: "name", order: "desc" } }),
    ).catch((e) => ({ resultado: { data: null, error: { message: sanitizarErro(e) } }, ms: null })),
    supabase.from("ops_backup_runs").select(COLUNAS_RUN).order("iniciado_em", { ascending: false }).limit(14),
    supabase
      .from("ops_backup_runs")
      .select("iniciado_em")
      .eq("status", "sucesso")
      .order("iniciado_em", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const bancoErro = banco.resultado.error ? sanitizarErro(banco.resultado.error.message) : null;
  const bancoStatus: NivelSaude = bancoErro ? "falha" : (banco.ms ?? 0) > 2000 ? "atencao" : "ok";

  const storageErro = storage.resultado.error ? sanitizarErro(storage.resultado.error.message) : null;
  const arquivos = (storage.resultado.data ?? []).filter((f) => f.name.startsWith("backup-"));
  const ultimoArquivo = arquivos[0];
  const storageStatus: NivelSaude = storageErro ? "falha" : arquivos.length === 0 ? "atencao" : "ok";

  const chave = process.env.STRIPE_SECRET_KEY;
  const stripe: SaudeOperacional["stripe"] = {
    status: "ok",
    chaveConfigurada: !!chave,
    modo: modoStripe(chave),
    webhookConfigurado: !!process.env.STRIPE_WEBHOOK_SECRET,
    precoComercioConfigurado: !!process.env.STRIPE_PRICE_COMERCIO_SAAS,
  };
  stripe.status =
    !stripe.chaveConfigurada || !stripe.webhookConfigurado
      ? "falha"
      : !stripe.precoComercioConfigurado || stripe.modo !== "producao"
        ? "atencao"
        : "ok";

  const registroDisponivel = !runs.error;
  const historico = ((runs.data ?? []) as RunRow[]).map((r) => resumir(r, agora));
  const ultimoSucessoEm = (sucesso.data?.iniciado_em as string | undefined) ?? null;
  const horasDesdeUltimoSucesso = ultimoSucessoEm
    ? Math.round(((agora - new Date(ultimoSucessoEm).getTime()) / 3_600_000) * 10) / 10
    : null;
  const ultimaExecucao = historico[0] ?? null;

  let backupStatus: NivelSaude;
  if (!registroDisponivel || horasDesdeUltimoSucesso === null || horasDesdeUltimoSucesso > HORAS_FALHA) {
    backupStatus = "falha";
  } else if (
    horasDesdeUltimoSucesso > HORAS_ATENCAO ||
    (ultimaExecucao && ultimaExecucao.status !== "sucesso" && ultimaExecucao.status !== "executando")
  ) {
    backupStatus = "atencao";
  } else {
    backupStatus = "ok";
  }

  return {
    status: pior(bancoStatus, storageStatus, stripe.status, backupStatus),
    verificadoEm: new Date(agora).toISOString(),
    banco: { status: bancoStatus, latenciaMs: banco.ms, erro: bancoErro },
    storage: {
      status: storageStatus,
      latenciaMs: storage.ms,
      arquivosBackup: storageErro ? null : arquivos.length,
      ultimoArquivoEm: ultimoArquivo?.created_at ?? null,
      erro: storageErro,
    },
    stripe,
    backup: {
      status: backupStatus,
      registroDisponivel,
      horasDesdeUltimoSucesso,
      ultimoSucessoEm,
      ultimaExecucao,
      historico,
      cronSecretConfigurado: !!process.env.CRON_SECRET && process.env.CRON_SECRET.length >= 16,
      emailConfigurado: !!process.env.RESEND_API_KEY,
    },
  };
}

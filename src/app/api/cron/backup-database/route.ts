import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { gzipSync } from "node:zlib";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  gerarBackupCompleto,
  redigirSegredos,
  registrarFimBackup,
  registrarInicioBackup,
  sanitizarErro,
  type StatusExecucaoBackup,
} from "@/lib/backup";

// Plano Free do Supabase não tem backup automático nem pg_dump disponível
// no runtime do Vercel — então o backup aqui é lógico (dados de cada
// tabela em JSON), guardado num bucket privado e também enviado por
// e-mail, pra não depender só do próprio projeto Supabase caso ele tenha
// um problema (o bucket vive no mesmo projeto, então sozinho não cobre
// esse risco). Procedimento de restauração: docs/comercio-backup-restauracao.md.
export const maxDuration = 300;

const BUCKET = "backups";
const RETENCAO_DIAS = 30;
// Mesmo dentro da retenção, nunca deixa o bucket com menos que isso.
const MINIMO_BACKUPS_MANTIDOS = 7;
const RETENCAO_REGISTROS_DIAS = 180;
const LIMITE_ANEXO_BYTES = 35 * 1024 * 1024; // Resend aceita até ~40MB por request.
const EMAIL_DESTINO = "viroedu@gmail.com";

function autorizado(req: Request): boolean {
  const segredo = process.env.CRON_SECRET;
  // Sem CRON_SECRET configurado, "Bearer undefined" passaria na comparação.
  if (!segredo || segredo.length < 16) return false;
  const recebido = Buffer.from(req.headers.get("authorization") ?? "");
  const esperado = Buffer.from(`Bearer ${segredo}`);
  return recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
}

function escaparHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

async function enviarEmail(assunto: string, html: string, anexo?: { nome: string; conteudo: Buffer }) {
  if (!process.env.RESEND_API_KEY) return false;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to: EMAIL_DESTINO,
    subject: assunto,
    html,
    attachments: anexo ? [{ filename: anexo.nome, content: anexo.conteudo.toString("base64") }] : undefined,
  });
  return !error;
}

export async function GET(req: Request) {
  if (!autorizado(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origem = new URL(req.url).searchParams.get("origem") === "manual" ? "manual" : "cron";
  const supabase = getSupabaseAdmin();
  const runId = await registrarInicioBackup(supabase, origem);

  let status: Exclude<StatusExecucaoBackup, "executando"> = "falha";
  let arquivo: string | null = null;
  let tamanhoBytes: number | null = null;
  let sha256: string | null = null;
  let tabelasTotal: number | null = null;
  let linhasTotal: number | null = null;
  let usuariosAuthTotal: number | null = null;
  let avisos: string[] = [];
  let erro: string | null = null;
  let emailEnviado = false;
  let verificado = false;
  let backupsRemovidos = 0;

  if (!runId) avisos.push("ops_backup_runs indisponível (migration 0120 pendente) — execução não registrada");

  try {
    const backup = await gerarBackupCompleto(supabase);
    avisos = [...avisos, ...backup.avisos];
    tabelasTotal = Object.keys(backup.tabelas).length;
    linhasTotal = Object.values(backup.tabelas).reduce((total, linhas) => total + linhas.length, 0);
    usuariosAuthTotal = backup.usuariosAuth.length;

    const comprimido = gzipSync(Buffer.from(JSON.stringify(backup), "utf-8"));
    tamanhoBytes = comprimido.byteLength;
    sha256 = createHash("sha256").update(comprimido).digest("hex");
    // Nome com hora: uma execução manual ou parcial no mesmo dia não
    // sobrescreve um backup bom anterior.
    arquivo = `backup-${backup.geradoEm.replace(/[:.]/g, "-")}.json.gz`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(arquivo, comprimido, { contentType: "application/gzip", upsert: false });
    if (uploadError) throw new Error(`Falha ao salvar no Storage: ${uploadError.message}`);

    // Lê de volta e confere o checksum — garante que o que está guardado é
    // exatamente o que foi gerado.
    const { data: baixado, error: downloadError } = await supabase.storage.from(BUCKET).download(arquivo);
    if (downloadError || !baixado) {
      avisos.push(`verificação: não foi possível baixar o arquivo (${sanitizarErro(downloadError?.message)})`);
    } else {
      const shaBaixado = createHash("sha256").update(Buffer.from(await baixado.arrayBuffer())).digest("hex");
      verificado = shaBaixado === sha256;
      if (!verificado) avisos.push("verificação: checksum do arquivo no Storage não confere");
    }

    status = backup.incompleto || !verificado ? "parcial" : "sucesso";

    // Cópia fora do Supabase — sem as credenciais de terceiros, e só quando
    // cabe no limite de anexo.
    const redigido = redigirSegredos(backup);
    const comprimidoEmail = gzipSync(Buffer.from(JSON.stringify(redigido), "utf-8"));
    if (comprimidoEmail.byteLength <= LIMITE_ANEXO_BYTES) {
      emailEnviado = await enviarEmail(
        `Backup do banco — ${backup.geradoEm.slice(0, 10)}${status === "parcial" ? " (PARCIAL)" : ""}`,
        `<p>Backup automático do banco de dados, gerado em ${escaparHtml(backup.geradoEm)}.</p>` +
          `<p>Status: <strong>${status}</strong> · ${tabelasTotal} tabelas · ${linhasTotal} linhas · sha256 do arquivo no Storage: <code>${sha256}</code></p>` +
          (redigido.metadados.colunasRedigidas.length > 0
            ? `<p>Credenciais de terceiros foram removidas desta cópia (${redigido.metadados.colunasRedigidas.length} colunas); a cópia completa fica só no Storage.</p>`
            : "") +
          (avisos.length > 0
            ? `<p><strong>Avisos:</strong></p><ul>${avisos.map((a) => `<li>${escaparHtml(a)}</li>`).join("")}</ul>`
            : ""),
        { nome: arquivo.replace(".json.gz", "-sem-credenciais.json.gz"), conteudo: comprimidoEmail },
      );
    } else {
      avisos.push(`e-mail: arquivo de ${comprimidoEmail.byteLength} bytes excede o limite de anexo`);
    }

    // Limpeza só depois de um backup bom e verificado — uma sequência de
    // falhas nunca apaga os últimos backups íntegros.
    if (status === "sucesso") {
      const { data: arquivos } = await supabase.storage
        .from(BUCKET)
        .list("", { limit: 1000, sortBy: { column: "name", order: "desc" } });
      const limite = new Date();
      limite.setDate(limite.getDate() - RETENCAO_DIAS);
      const corte = `backup-${limite.toISOString().slice(0, 10)}`;
      const antigos = (arquivos ?? [])
        .filter((f) => f.name.startsWith("backup-"))
        .slice(MINIMO_BACKUPS_MANTIDOS)
        .filter((f) => f.name < corte)
        .map((f) => f.name);
      if (antigos.length > 0) {
        const { error: removeError } = await supabase.storage.from(BUCKET).remove(antigos);
        if (removeError) avisos.push(`retenção: não foi possível remover antigos (${sanitizarErro(removeError.message)})`);
        else backupsRemovidos = antigos.length;
      }

      const limiteRegistros = new Date();
      limiteRegistros.setDate(limiteRegistros.getDate() - RETENCAO_REGISTROS_DIAS);
      await supabase.from("ops_backup_runs").delete().lt("iniciado_em", limiteRegistros.toISOString());
    }
  } catch (e) {
    status = "falha";
    erro = sanitizarErro(e);
    console.error("[backup-database] falha:", erro);
    await enviarEmail(
      "FALHA no backup do banco",
      `<p>O backup automático falhou em ${escaparHtml(new Date().toISOString())}.</p><p>Erro: ${escaparHtml(erro)}</p>` +
        `<p>Detalhes em /comercio/operacoes.</p>`,
    ).catch(() => false);
  }

  await registrarFimBackup(supabase, runId, {
    status,
    arquivo,
    tamanhoBytes,
    sha256,
    tabelasTotal,
    linhasTotal,
    usuariosAuthTotal,
    avisos,
    erro,
    emailEnviado,
    verificado,
    backupsRemovidos,
  });

  return NextResponse.json(
    {
      runId,
      status,
      arquivo,
      tabelas: tabelasTotal,
      linhas: linhasTotal,
      tamanhoBytes,
      sha256,
      verificado,
      avisos,
      erro,
      emailEnviado,
      backupsAntigosRemovidos: backupsRemovidos,
    },
    { status: status === "falha" ? 500 : 200, headers: { "Cache-Control": "no-store" } },
  );
}

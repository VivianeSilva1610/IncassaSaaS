import { NextResponse } from "next/server";
import { gzipSync } from "node:zlib";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";
import { gerarBackupCompleto } from "@/lib/backup";

// Plano Free do Supabase não tem backup automático nem pg_dump disponível
// no runtime do Vercel — então o backup aqui é lógico (dados de cada
// tabela em JSON), guardado num bucket privado e também enviado por
// e-mail, pra não depender só do próprio projeto Supabase caso ele tenha
// um problema (o bucket vive no mesmo projeto, então sozinho não cobre
// esse risco).
const RETENCAO_DIAS = 30;
const LIMITE_ANEXO_BYTES = 35 * 1024 * 1024; // Resend aceita até ~40MB por request.
const EMAIL_DESTINO = "viroedu@gmail.com";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const backup = await gerarBackupCompleto(supabase);

  const json = JSON.stringify(backup);
  const comprimido = gzipSync(Buffer.from(json, "utf-8"));
  const dataArquivo = backup.geradoEm.slice(0, 10);
  const nomeArquivo = `backup-${dataArquivo}.json.gz`;

  const { error: uploadError } = await supabase.storage
    .from("backups")
    .upload(nomeArquivo, comprimido, { contentType: "application/gzip", upsert: true });
  if (uploadError) {
    return NextResponse.json({ error: `Falha ao salvar no Storage: ${uploadError.message}` }, { status: 500 });
  }

  // Limpeza: mantém só os últimos RETENCAO_DIAS dias de backup no bucket.
  const { data: arquivos } = await supabase.storage.from("backups").list();
  const limite = new Date();
  limite.setDate(limite.getDate() - RETENCAO_DIAS);
  const antigos = (arquivos ?? [])
    .filter((f) => f.name.startsWith("backup-") && f.name < `backup-${limite.toISOString().slice(0, 10)}`)
    .map((f) => f.name);
  if (antigos.length > 0) {
    await supabase.storage.from("backups").remove(antigos);
  }

  // Cópia fora do Supabase — só por e-mail quando cabe no limite de anexo.
  let emailEnviado = false;
  if (comprimido.byteLength <= LIMITE_ANEXO_BYTES && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
      to: EMAIL_DESTINO,
      subject: `Backup do banco — ${dataArquivo}`,
      html: `<p>Backup automático do banco de dados, gerado em ${backup.geradoEm}.</p>${
        backup.avisos.length > 0
          ? `<p><strong>Avisos:</strong></p><ul>${backup.avisos.map((a) => `<li>${a}</li>`).join("")}</ul>`
          : ""
      }`,
      attachments: [{ filename: nomeArquivo, content: comprimido.toString("base64") }],
    });
    emailEnviado = !emailError;
  }

  return NextResponse.json({
    arquivo: nomeArquivo,
    tabelas: Object.keys(backup.tabelas).length,
    tamanhoBytes: comprimido.byteLength,
    avisos: backup.avisos,
    emailEnviado,
    backupsAntigosRemovidos: antigos.length,
  });
}

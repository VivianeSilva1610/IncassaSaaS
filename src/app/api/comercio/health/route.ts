import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createClient } from "@/lib/supabase-server";
import { isAdminEmail } from "@/lib/subscription";
import { verificarSaudeOperacional } from "./checks";

// Saúde operacional da plataforma (banco, storage, Stripe configurada,
// último backup). Acesso: sessão de um e-mail em ADMIN_EMAILS, ou
// "Authorization: Bearer <HEALTHCHECK_SECRET>" pra monitor externo
// (UptimeRobot etc.) — cai no CRON_SECRET se HEALTHCHECK_SECRET não existir.
// Responde 503 quando algo está em falha, pra o monitor alertar só pelo
// código HTTP.

function bearerValido(req: Request): boolean {
  const segredo = process.env.HEALTHCHECK_SECRET || process.env.CRON_SECRET;
  if (!segredo || segredo.length < 16) return false;
  const recebido = Buffer.from(req.headers.get("authorization") ?? "");
  const esperado = Buffer.from(`Bearer ${segredo}`);
  return recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
}

async function sessaoAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return isAdminEmail(user?.email);
}

export async function GET(req: Request) {
  if (!bearerValido(req) && !(await sessaoAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const saude = await verificarSaudeOperacional();
  return NextResponse.json(saude, {
    status: saude.status === "falha" ? 503 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { generateSollecitoMessage } from "@/lib/anthropic";
import { getFallbackMessages } from "@/lib/fallback-message";
import { sendSollecitoEmail } from "@/lib/sollecito-email";

const GIORNI_SOGLIA_SOLLECITO_AUTOMATICO = 5;
const TONO_DEFAULT = "Cordiale" as const;
const MAX_INVOICES_PER_RUN = 200;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("sollecito_automatico_attivo", true);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ checked: 0, sent: 0 });
  }

  const emailByUserId = new Map(profiles.map((p) => [p.id, p.email]));
  const sogliaData = new Date();
  sogliaData.setDate(sogliaData.getDate() - GIORNI_SOGLIA_SOLLECITO_AUTOMATICO);
  const sogliaStr = sogliaData.toISOString().slice(0, 10);

  const { data: invoices, error: invoicesError } = await supabase
    .from("invoices")
    .select("id, user_id, importo, data_scadenza, numero, clients(nome, email)")
    .in("user_id", profiles.map((p) => p.id))
    .eq("status", "aperta")
    .lte("data_scadenza", sogliaStr)
    .is("sollecito_auto_inviato_il", null)
    .limit(MAX_INVOICES_PER_RUN);

  if (invoicesError) {
    return NextResponse.json({ error: invoicesError.message }, { status: 500 });
  }

  let sent = 0;
  for (const inv of invoices ?? []) {
    const cliente = inv.clients as unknown as { nome: string; email: string | null } | null;
    if (!cliente?.email) continue;

    const artigianoEmail = emailByUserId.get(inv.user_id);
    if (!artigianoEmail) continue;

    const giorniRitardo = Math.max(
      0,
      Math.round((Date.now() - new Date(inv.data_scadenza).getTime()) / (1000 * 60 * 60 * 24)),
    );

    let messaggio: string;
    try {
      messaggio = await generateSollecitoMessage({
        tono: TONO_DEFAULT,
        clienteNome: cliente.nome,
        importo: Number(inv.importo),
        data: inv.data_scadenza,
        tipoDocumento: "fattura",
        giorniRitardo,
        numero: inv.numero,
      });
    } catch (err) {
      console.error("generateSollecitoMessage failed in cron, using fallback:", err);
      messaggio =
        getFallbackMessages({
          tono: TONO_DEFAULT,
          clienteNome: cliente.nome,
          importo: Number(inv.importo),
          data: inv.data_scadenza,
          giorniRitardo,
          numero: inv.numero,
          tipoDocumento: "fattura",
        })[0] ?? "";
    }

    if (!messaggio) continue;

    const result = await sendSollecitoEmail({
      to: cliente.email,
      clienteNome: cliente.nome,
      messaggio,
      replyTo: artigianoEmail,
    });

    if (!result.ok) {
      console.error(`sendSollecitoEmail failed for invoice ${inv.id}:`, result.error);
      continue;
    }

    await supabase
      .from("invoices")
      .update({ sollecito_auto_inviato_il: new Date().toISOString() })
      .eq("id", inv.id);

    sent += 1;
  }

  return NextResponse.json({ checked: invoices?.length ?? 0, sent });
}

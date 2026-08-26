import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { generateSollecitoMessage } from "@/lib/anthropic";
import { getFallbackMessages } from "@/lib/fallback-message";
import { normalizePhoneForWhatsapp } from "@/lib/phone";
import type { Tone } from "@/content/kit-incassa";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const body = (await req.json()) as { kind: "fattura" | "preventivo"; id: string; tono: Tone };
  const { kind, id, tono } = body;

  const table = kind === "fattura" ? "invoices" : "quotes";
  const { data: record, error } = await supabase
    .from(table)
    .select("*, clients(nome, telefono, email)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !record) {
    return NextResponse.json({ error: "Non trovato" }, { status: 404 });
  }

  const dataRiferimento: string = kind === "fattura" ? record.data_scadenza : record.data_invio;
  const giorniRitardo = Math.max(
    0,
    Math.round((Date.now() - new Date(dataRiferimento).getTime()) / (1000 * 60 * 60 * 24)),
  );

  let messages: string[];
  let fallback = false;
  try {
    const aiMessage = await generateSollecitoMessage({
      tono,
      clienteNome: record.clients.nome,
      importo: Number(record.importo),
      data: dataRiferimento,
      tipoDocumento: kind,
      giorniRitardo,
      numero: record.numero,
    });
    messages = [aiMessage];
  } catch (err) {
    console.error("generateSollecitoMessage failed, using fallback templates:", err);
    messages = getFallbackMessages({
      tono,
      clienteNome: record.clients.nome,
      importo: Number(record.importo),
      data: dataRiferimento,
      giorniRitardo,
      numero: record.numero,
      tipoDocumento: kind,
    });
    fallback = true;

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "Non siamo riusciti a generare il messaggio. Riprova tra poco." },
        { status: 502 },
      );
    }
  }

  const phone = record.clients.telefono ? normalizePhoneForWhatsapp(record.clients.telefono) : null;

  return NextResponse.json({
    messages,
    fallback,
    phone,
    email: record.clients.email ?? null,
    clientId: record.client_id,
  });
}

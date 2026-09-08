import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendPushToUser } from "@/lib/web-push";
import { formatEuro } from "@/lib/urgency";
import type { Locale } from "@/lib/locale";

const pushStrings = {
  it: { fatturaTitle: "Fattura in scadenza oggi", uscitaTitle: "Uscita da pagare oggi" },
  en: { fatturaTitle: "Invoice due today", uscitaTitle: "Expense due today" },
};

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const supabase = getSupabaseAdmin();

  const [{ data: invoices, error: invoicesError }, { data: uscite, error: usciteError }] = await Promise.all([
    supabase
      .from("invoices")
      .select("user_id, importo, clients(nome, user_id)")
      .eq("status", "aperta")
      .eq("data_scadenza", today),
    supabase.from("uscite").select("user_id, importo, descrizione").eq("status", "da_pagare").eq("data_scadenza", today),
  ]);

  if (invoicesError) {
    return NextResponse.json({ error: invoicesError.message }, { status: 500 });
  }
  if (usciteError) {
    return NextResponse.json({ error: usciteError.message }, { status: 500 });
  }

  const userIds = Array.from(
    new Set([...(invoices ?? []).map((i) => i.user_id), ...(uscite ?? []).map((u) => u.user_id)]),
  );
  const { data: profiles } = await supabase.from("profiles").select("id, locale").in("id", userIds);
  const localeByUserId = new Map((profiles ?? []).map((p) => [p.id, (p.locale as Locale) ?? "it"]));

  let sent = 0;
  for (const inv of invoices ?? []) {
    const cliente = inv.clients as unknown as { nome: string; user_id: string } | null;
    if (!cliente || cliente.user_id !== inv.user_id) {
      console.error(`Skipping invoice with mismatched client ownership (user ${inv.user_id})`);
      continue;
    }
    const clienteNome = cliente.nome;
    const locale = localeByUserId.get(inv.user_id) ?? "it";
    await sendPushToUser(inv.user_id, {
      title: pushStrings[locale].fatturaTitle,
      body: `${clienteNome} — ${formatEuro(Number(inv.importo))}`,
      url: "/app",
    });
    sent += 1;
  }

  for (const u of uscite ?? []) {
    const locale = localeByUserId.get(u.user_id) ?? "it";
    await sendPushToUser(u.user_id, {
      title: pushStrings[locale].uscitaTitle,
      body: `${u.descrizione} — ${formatEuro(Number(u.importo))}`,
      url: "/app/uscite",
    });
    sent += 1;
  }

  return NextResponse.json({
    checked: (invoices?.length ?? 0) + (uscite?.length ?? 0),
    sent,
  });
}

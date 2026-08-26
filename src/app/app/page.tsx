import { requireActiveSubscription } from "@/lib/subscription";
import { createClient } from "@/lib/supabase-server";
import { getUrgency, urgencyEmoji, formatEuro } from "@/lib/urgency";
import { SollecitaButton } from "@/components/SollecitaButton";
import Link from "next/link";

export default async function DashboardPage() {
  await requireActiveSubscription();
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);
  const trentaGiorniFa = new Date();
  trentaGiorniFa.setDate(trentaGiorniFa.getDate() - 30);
  const trentaGiorniFaStr = trentaGiorniFa.toISOString().slice(0, 10);

  const [{ data: invoices }, { data: quotes }, { data: fattureRecenti }, { data: uscite }, { data: pagamenti }] =
    await Promise.all([
      supabase
        .from("invoices")
        .select("*, clients(nome, telefono, email)")
        .eq("status", "aperta")
        .order("data_scadenza"),
      supabase
        .from("quotes")
        .select("*, clients(nome, telefono, email)")
        .eq("status", "in_attesa")
        .order("data_invio"),
      supabase
        .from("invoices")
        .select("status")
        .gte("data_scadenza", trentaGiorniFaStr)
        .lte("data_scadenza", today),
      supabase.from("uscite").select("*").eq("status", "da_pagare").order("data_scadenza"),
      supabase.from("pagamenti").select("invoice_id, importo"),
    ]);

  const pagatoByInvoice = new Map<string, number>();
  for (const p of pagamenti ?? []) {
    pagatoByInvoice.set(p.invoice_id, (pagatoByInvoice.get(p.invoice_id) ?? 0) + Number(p.importo));
  }
  const residuo = (inv: { id: string; importo: number }) =>
    Number(inv.importo) - (pagatoByInvoice.get(inv.id) ?? 0);

  const totalInvoices = (invoices ?? []).reduce((sum, i) => sum + residuo(i), 0);
  const totalQuotes = (quotes ?? []).reduce((sum, q) => sum + Number(q.importo), 0);
  const total = totalInvoices + totalQuotes;

  const totalUscite = (uscite ?? []).reduce((sum, u) => sum + Number(u.importo), 0);
  const saldoNetto = total - totalUscite;

  const scadenzeOggi = (invoices ?? []).filter((inv) => inv.data_scadenza === today);
  const totalScadenzeOggi = scadenzeOggi.reduce((sum, i) => sum + residuo(i), 0);

  const usciteOggi = (uscite ?? []).filter((u) => u.data_scadenza === today);
  const totalUsciteOggi = usciteOggi.reduce((sum, u) => sum + Number(u.importo), 0);

  const fattureRecentiCount = fattureRecenti?.length ?? 0;
  const fatturePagateRecenti = (fattureRecenti ?? []).filter((f) => f.status === "pagata").length;
  const tassoRecupero =
    fattureRecentiCount > 0 ? Math.round((fatturePagateRecenti / fattureRecentiCount) * 100) : null;

  return (
    <div>
      <section className="rounded-xl bg-gradient-to-b from-stone-900 to-stone-800 p-6 text-center text-white sm:p-10">
        <p className="text-sm text-stone-300">DA RECUPERARE</p>
        <p className="mt-1 text-4xl font-bold">{formatEuro(total)}</p>
        <div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg bg-white/10 p-3">
            <p className="text-stone-300">Da incassare</p>
            <p className="text-lg font-semibold">{formatEuro(totalInvoices)}</p>
          </div>
          <div className="rounded-lg bg-white/10 p-3">
            <p className="text-stone-300">Preventivi</p>
            <p className="text-lg font-semibold">{formatEuro(totalQuotes)}</p>
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-sm border-t border-white/10 pt-6">
          <p className="text-sm text-stone-300">Saldo netto stimato (dopo le uscite)</p>
          <p className={`mt-1 text-2xl font-bold ${saldoNetto >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {formatEuro(saldoNetto)}
          </p>
          <p className="mt-1 text-xs text-stone-400">
            {formatEuro(total)} da recuperare − {formatEuro(totalUscite)} di uscite che hai segnato
          </p>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Scadenze oggi</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{scadenzeOggi.length}</p>
          {scadenzeOggi.length > 0 && (
            <p className="text-sm text-stone-500">{formatEuro(totalScadenzeOggi)}</p>
          )}
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Uscite oggi</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{usciteOggi.length}</p>
          {usciteOggi.length > 0 && (
            <p className="text-sm text-stone-500">{formatEuro(totalUsciteOggi)}</p>
          )}
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Tasso di recupero (30gg)</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">
            {tassoRecupero === null ? "—" : `${tassoRecupero}%`}
          </p>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">Fatture aperte</h2>
          <Link href="/app/fatture" className="text-sm text-amber-700 underline underline-offset-2">
            Gestisci fatture
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {(invoices ?? []).length === 0 && (
            <p className="text-sm text-stone-500">Nessuna fattura aperta. 🎉</p>
          )}
          {(invoices ?? []).map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-4"
            >
              <div>
                <p className="font-medium text-stone-900">
                  {urgencyEmoji[getUrgency(inv.data_scadenza)]} {inv.clients?.nome}
                </p>
                <p className="text-sm text-stone-500">
                  {pagatoByInvoice.has(inv.id)
                    ? `${formatEuro(residuo(inv))} ancora da incassare (di ${formatEuro(Number(inv.importo))})`
                    : formatEuro(Number(inv.importo))}
                  {" · scade "}
                  {inv.data_scadenza}
                </p>
              </div>
              <SollecitaButton kind="fattura" id={inv.id} />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">Preventivi in attesa</h2>
          <Link href="/app/preventivi" className="text-sm text-amber-700 underline underline-offset-2">
            Gestisci preventivi
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {(quotes ?? []).length === 0 && (
            <p className="text-sm text-stone-500">Nessun preventivo in attesa. 🎉</p>
          )}
          {(quotes ?? []).map((q) => (
            <div
              key={q.id}
              className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-4"
            >
              <div>
                <p className="font-medium text-stone-900">{q.clients?.nome}</p>
                <p className="text-sm text-stone-500">
                  {formatEuro(Number(q.importo))} · inviato {q.data_invio}
                </p>
              </div>
              <SollecitaButton kind="preventivo" id={q.id} />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">Uscite da pagare</h2>
          <Link href="/app/uscite" className="text-sm text-amber-700 underline underline-offset-2">
            Gestisci uscite
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {(uscite ?? []).length === 0 && (
            <p className="text-sm text-stone-500">Nessuna uscita segnata. 🎉</p>
          )}
          {(uscite ?? []).map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-4"
            >
              <div>
                <p className="font-medium text-stone-900">
                  {urgencyEmoji[getUrgency(u.data_scadenza)]} {u.descrizione}
                </p>
                <p className="text-sm text-stone-500">
                  {formatEuro(Number(u.importo))} · scade {u.data_scadenza}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

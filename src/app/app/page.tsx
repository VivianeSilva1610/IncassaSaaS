import { requireActiveSubscription } from "@/lib/subscription";
import { createClient } from "@/lib/supabase-server";
import { getUserLocale } from "@/lib/locale";
import { getUrgency, urgencyEmoji, formatEuro } from "@/lib/urgency";
import { SollecitaButton } from "@/components/SollecitaButton";
import Link from "next/link";

const strings = {
  it: {
    daRecuperare: "DA RECUPERARE",
    daIncassare: "Da incassare",
    preventivi: "Preventivi",
    saldoNetto: "Saldo netto stimato (dopo le uscite)",
    saldoDettaglio: (total: string, uscite: string) => `${total} da recuperare − ${uscite} di uscite che hai segnato`,
    scadenzeOggi: "Scadenze oggi",
    usciteOggi: "Uscite oggi",
    tassoRecupero: "Tasso di recupero (30gg)",
    fattureAperte: "Fatture aperte",
    gestisciFatture: "Gestisci fatture",
    nessunaFattura: "Nessuna fattura aperta. 🎉",
    residuo: (res: string, tot: string) => `${res} ancora da incassare (di ${tot})`,
    scade: "scade",
    preventiviInAttesa: "Preventivi in attesa",
    gestisciPreventivi: "Gestisci preventivi",
    nessunPreventivo: "Nessun preventivo in attesa. 🎉",
    inviato: "inviato",
    usciteDaPagare: "Uscite da pagare",
    gestisciUscite: "Gestisci uscite",
    nessunaUscita: "Nessuna uscita segnata. 🎉",
  },
  en: {
    daRecuperare: "TO COLLECT",
    daIncassare: "Invoices",
    preventivi: "Quotes",
    saldoNetto: "Estimated net balance (after expenses)",
    saldoDettaglio: (total: string, uscite: string) => `${total} to collect − ${uscite} in expenses you've logged`,
    scadenzeOggi: "Due today",
    usciteOggi: "Expenses today",
    tassoRecupero: "Recovery rate (30d)",
    fattureAperte: "Open invoices",
    gestisciFatture: "Manage invoices",
    nessunaFattura: "No open invoices. 🎉",
    residuo: (res: string, tot: string) => `${res} still owed (of ${tot})`,
    scade: "due",
    preventiviInAttesa: "Pending quotes",
    gestisciPreventivi: "Manage quotes",
    nessunPreventivo: "No pending quotes. 🎉",
    inviato: "sent",
    usciteDaPagare: "Expenses to pay",
    gestisciUscite: "Manage expenses",
    nessunaUscita: "No expenses logged. 🎉",
  },
};

export default async function DashboardPage() {
  await requireActiveSubscription();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = user ? await getUserLocale(supabase, user.id) : "it";
  const t = strings[locale];

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
        <p className="text-sm text-stone-300">{t.daRecuperare}</p>
        <p className="mt-1 text-4xl font-bold">{formatEuro(total)}</p>
        <div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg bg-white/10 p-3">
            <p className="text-stone-300">{t.daIncassare}</p>
            <p className="text-lg font-semibold">{formatEuro(totalInvoices)}</p>
          </div>
          <div className="rounded-lg bg-white/10 p-3">
            <p className="text-stone-300">{t.preventivi}</p>
            <p className="text-lg font-semibold">{formatEuro(totalQuotes)}</p>
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-sm border-t border-white/10 pt-6">
          <p className="text-sm text-stone-300">{t.saldoNetto}</p>
          <p className={`mt-1 text-2xl font-bold ${saldoNetto >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {formatEuro(saldoNetto)}
          </p>
          <p className="mt-1 text-xs text-stone-400">{t.saldoDettaglio(formatEuro(total), formatEuro(totalUscite))}</p>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">{t.scadenzeOggi}</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{scadenzeOggi.length}</p>
          {scadenzeOggi.length > 0 && (
            <p className="text-sm text-stone-500">{formatEuro(totalScadenzeOggi)}</p>
          )}
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">{t.usciteOggi}</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{usciteOggi.length}</p>
          {usciteOggi.length > 0 && (
            <p className="text-sm text-stone-500">{formatEuro(totalUsciteOggi)}</p>
          )}
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">{t.tassoRecupero}</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">
            {tassoRecupero === null ? "—" : `${tassoRecupero}%`}
          </p>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">{t.fattureAperte}</h2>
          <Link href="/app/fatture" className="text-sm text-amber-700 underline underline-offset-2">
            {t.gestisciFatture}
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {(invoices ?? []).length === 0 && <p className="text-sm text-stone-500">{t.nessunaFattura}</p>}
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
                    ? t.residuo(formatEuro(residuo(inv)), formatEuro(Number(inv.importo)))
                    : formatEuro(Number(inv.importo))}
                  {` · ${t.scade} `}
                  {inv.data_scadenza}
                </p>
              </div>
              <SollecitaButton kind="fattura" id={inv.id} locale={locale} />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">{t.preventiviInAttesa}</h2>
          <Link href="/app/preventivi" className="text-sm text-amber-700 underline underline-offset-2">
            {t.gestisciPreventivi}
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {(quotes ?? []).length === 0 && <p className="text-sm text-stone-500">{t.nessunPreventivo}</p>}
          {(quotes ?? []).map((q) => (
            <div
              key={q.id}
              className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-4"
            >
              <div>
                <p className="font-medium text-stone-900">{q.clients?.nome}</p>
                <p className="text-sm text-stone-500">
                  {formatEuro(Number(q.importo))} · {t.inviato} {q.data_invio}
                </p>
              </div>
              <SollecitaButton kind="preventivo" id={q.id} locale={locale} />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">{t.usciteDaPagare}</h2>
          <Link href="/app/uscite" className="text-sm text-amber-700 underline underline-offset-2">
            {t.gestisciUscite}
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {(uscite ?? []).length === 0 && <p className="text-sm text-stone-500">{t.nessunaUscita}</p>}
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
                  {formatEuro(Number(u.importo))} · {t.scade} {u.data_scadenza}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

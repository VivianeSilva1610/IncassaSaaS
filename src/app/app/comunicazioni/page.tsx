import { requireActiveSubscription } from "@/lib/subscription";
import { createClient } from "@/lib/supabase-server";
import { getUserLocale } from "@/lib/locale";
import { toneEmoji } from "@/lib/tone-styles";
import type { Tone } from "@/content/kit-incassa";
import Link from "next/link";

const strings = {
  it: {
    title: "Comunicazioni",
    vediTutte: "Vedi tutte",
    intro: "Storico dei solleciti inviati, manuali e automatici.",
    nessuna: "Nessuna comunicazione ancora.",
    cliente: "Cliente",
    automatico: "Automatico",
    canaleLabel: { email: "✉️ Email", whatsapp: "💬 WhatsApp" } as Record<string, string>,
    dateLocale: "it-IT",
  },
  en: {
    title: "Communications",
    vediTutte: "See all",
    intro: "History of reminders sent, manual and automatic.",
    nessuna: "No communications yet.",
    cliente: "Client",
    automatico: "Automatic",
    canaleLabel: { email: "✉️ Email", whatsapp: "💬 WhatsApp" } as Record<string, string>,
    dateLocale: "en-US",
  },
};

export default async function ComunicazioniPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  await requireActiveSubscription();
  const { cliente: clienteId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = user ? await getUserLocale(supabase, user.id) : "it";
  const t = strings[locale];

  let query = supabase
    .from("comunicazioni")
    .select("*, clients(nome)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (clienteId) {
    query = query.eq("client_id", clienteId);
  }

  const { data: comunicazioni } = await query;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">{t.title}</h1>
        {clienteId && (
          <Link href="/app/comunicazioni" className="text-sm text-amber-700 underline underline-offset-2">
            {t.vediTutte}
          </Link>
        )}
      </div>
      <p className="mt-1 text-sm text-stone-600">{t.intro}</p>

      <div className="mt-6 space-y-2">
        {(comunicazioni ?? []).length === 0 && <p className="text-sm text-stone-500">{t.nessuna}</p>}
        {(comunicazioni ?? []).map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-4">
            <div>
              <p className="font-medium text-stone-900">
                {c.clients?.nome ?? t.cliente}
                {c.automatico && (
                  <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                    {t.automatico}
                  </span>
                )}
              </p>
              <p className="text-sm text-stone-500">
                {t.canaleLabel[c.canale] ?? c.canale}
                {c.tono ? ` · ${toneEmoji[c.tono as Tone] ?? ""} ${c.tono}` : ""} ·{" "}
                {new Date(c.created_at).toLocaleString(t.dateLocale)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

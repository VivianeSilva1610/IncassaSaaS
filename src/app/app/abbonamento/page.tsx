import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getUserLocale } from "@/lib/locale";
import { SubscribeButton } from "@/components/SubscribeButton";
import { isAdminEmail } from "@/lib/subscription";

const strings = {
  it: {
    title: "Abbonamento INCASSA",
    admin: "🟢 Accesso amministratore",
    statusLabel: {
      trialing: "🟢 Periodo di prova attivo",
      active: "🟢 Abbonamento attivo",
      past_due: "🟠 Pagamento in ritardo",
      canceled: "🔴 Abbonamento cancellato",
      none: "Nessun abbonamento",
    } as Record<string, string>,
    trialEnds: (date: string) => `Il periodo di prova termina il ${date}.`,
    vaiAllaDashboard: "Vai alla dashboard",
    perUsare:
      "Per usare INCASSA — dashboard, solleciti generati con IA e molto altro — attiva l'abbonamento:",
    prezzo: "€19,90/mese",
    trialInfo: ", con 7 giorni di prova gratuita.",
    dateLocale: "it-IT",
  },
  en: {
    title: "INCASSA Subscription",
    admin: "🟢 Admin access",
    statusLabel: {
      trialing: "🟢 Trial active",
      active: "🟢 Subscription active",
      past_due: "🟠 Payment overdue",
      canceled: "🔴 Subscription canceled",
      none: "No subscription",
    } as Record<string, string>,
    trialEnds: (date: string) => `Your trial ends on ${date}.`,
    vaiAllaDashboard: "Go to dashboard",
    perUsare: "To use INCASSA — dashboard, AI-generated reminders and more — activate the subscription:",
    prezzo: "€19.90/month",
    trialInfo: ", with a 7-day free trial.",
    dateLocale: "en-US",
  },
};

export default async function AbbonamentoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const locale = await getUserLocale(supabase, user.id);
  const t = strings[locale];

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, trial_ends_at")
    .eq("id", user.id)
    .single();

  const status = profile?.subscription_status ?? "none";
  const isAdmin = isAdminEmail(user.email);
  const hasAccess = isAdmin || status === "trialing" || status === "active";

  return (
    <main className="mx-auto max-w-md text-center">
      <h1 className="text-2xl font-bold text-stone-900">{t.title}</h1>
      <p className="mt-2 text-sm text-stone-600">{isAdmin ? t.admin : (t.statusLabel[status] ?? status)}</p>

      {hasAccess ? (
        <>
          {profile?.trial_ends_at && status === "trialing" && (
            <p className="mt-2 text-xs text-stone-400">
              {t.trialEnds(new Date(profile.trial_ends_at).toLocaleDateString(t.dateLocale))}
            </p>
          )}
          <Link
            href="/app"
            className="mt-6 inline-block rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:bg-stone-700 active:scale-[0.98]"
          >
            {t.vaiAllaDashboard}
          </Link>
        </>
      ) : (
        <>
          <p className="mt-6 text-stone-700">
            {t.perUsare} <strong>{t.prezzo}</strong>
            {t.trialInfo}
          </p>
          <div className="mt-6">
            <SubscribeButton
              locale={locale}
              className="w-full rounded-lg bg-gradient-to-b from-amber-500 to-orange-600 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-orange-900/20 transition-transform hover:from-amber-400 hover:to-orange-500 active:scale-[0.98] disabled:opacity-60"
            />
          </div>
        </>
      )}
    </main>
  );
}

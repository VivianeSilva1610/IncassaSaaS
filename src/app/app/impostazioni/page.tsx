import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getUserLocale } from "@/lib/locale";
import { BillingPortalButton } from "@/components/BillingPortalButton";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { EnableNotificationsButton } from "@/components/EnableNotificationsButton";
import { ToggleSollecitoAutomatico } from "@/components/ToggleSollecitoAutomatico";
import { CopyTextButton } from "@/components/CopyTextButton";
import { LocaleSelect } from "@/components/LocaleSelect";
import Link from "next/link";

const strings = {
  it: {
    title: "Impostazioni",
    linguaTitle: "Lingua dei messaggi",
    linguaDesc: "Lingua usata dall'IA per generare i solleciti (manuali e automatici).",
    abbonamentoTitle: "Abbonamento e fatturazione",
    abbonamentoDesc: "Aggiorna il metodo di pagamento, scarica le ricevute o cancella l'abbonamento.",
    nessunAbbonamento: "Nessun abbonamento attivo.",
    dirittoRecesso: "Sei un Consumatore e vuoi esercitare il diritto di recesso? Usa il ",
    dirittoRecessoLink: "modulo di recesso online",
    notificheTitle: "Notifiche",
    notificheDesc: "Ricevi una notifica sul dispositivo quando una fattura scade oggi, o quando hai un'uscita da pagare oggi.",
    sollecitiTitle: "Solleciti automatici",
    sollecitiDesc:
      "Se una fattura resta scaduta per più di 5 giorni, invieremo un'email di sollecito automatico al cliente, con tono Cordiale. Puoi disattivare in ogni momento.",
    frasePronta: "Frase pronta per la tua informativa privacy o fattura",
    testoInformativa:
      "I dati forniti potranno essere utilizzati per l'invio di promemoria di pagamento, " +
      "anche in forma automatizzata, relativi a fatture e preventivi in essere.",
    zonaPericolosaTitle: "Zona pericolosa",
    zonaPericolosaDesc:
      "Elimina definitivamente il tuo account INCASSA, l'abbonamento e tutti i dati (clienti, fatture, preventivi) associati.",
  },
  en: {
    title: "Settings",
    linguaTitle: "Message language",
    linguaDesc: "Language the AI uses to generate reminders (manual and automatic).",
    abbonamentoTitle: "Subscription & billing",
    abbonamentoDesc: "Update your payment method, download receipts, or cancel your subscription.",
    nessunAbbonamento: "No active subscription.",
    dirittoRecesso: "Are you a Consumer and want to exercise your right of withdrawal? Use the ",
    dirittoRecessoLink: "online withdrawal form",
    notificheTitle: "Notifications",
    notificheDesc: "Get a notification on your device when an invoice is due today, or when you have an expense due today.",
    sollecitiTitle: "Automatic reminders",
    sollecitiDesc:
      "If an invoice stays unpaid for more than 5 days, we'll send an automatic reminder email to the client, with a Polite tone. You can turn this off at any time.",
    frasePronta: "Ready-to-use phrase for your privacy notice or invoice",
    testoInformativa:
      "The data provided may be used to send payment reminders, including in automated form, " +
      "related to outstanding invoices and quotes.",
    zonaPericolosaTitle: "Danger zone",
    zonaPericolosaDesc:
      "Permanently delete your INCASSA account, subscription, and all associated data (clients, invoices, quotes).",
  },
};

export default async function ImpostazioniPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const locale = await getUserLocale(supabase, user.id);
  const t = strings[locale];

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, sollecito_automatico_attivo, locale")
    .eq("id", user.id)
    .single();

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{t.title}</h1>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-stone-900">{t.linguaTitle}</h2>
            <p className="mt-1 text-sm text-stone-600">{t.linguaDesc}</p>
          </div>
          <LocaleSelect initialLocale={(profile?.locale as "it" | "en") ?? "it"} />
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="font-semibold text-stone-900">{t.abbonamentoTitle}</h2>
        <p className="mt-1 text-sm text-stone-600">{t.abbonamentoDesc}</p>
        {profile?.stripe_customer_id ? (
          <div className="mt-4">
            <BillingPortalButton
              locale={locale}
              className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98]"
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-stone-400">{t.nessunAbbonamento}</p>
        )}
        <p className="mt-4 text-xs text-stone-500">
          {t.dirittoRecesso}
          <Link
            href={locale === "en" ? "/en/recesso" : "/recesso"}
            className="text-amber-700 underline underline-offset-2"
          >
            {t.dirittoRecessoLink}
          </Link>
          .
        </p>
      </section>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="font-semibold text-stone-900">{t.notificheTitle}</h2>
        <p className="mt-1 text-sm text-stone-600">{t.notificheDesc}</p>
        <div className="mt-4">
          <EnableNotificationsButton locale={locale} />
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-stone-900">{t.sollecitiTitle}</h2>
            <p className="mt-1 text-sm text-stone-600">{t.sollecitiDesc}</p>
          </div>
          <ToggleSollecitoAutomatico initialEnabled={profile?.sollecito_automatico_attivo ?? false} />
        </div>

        <div className="mt-4 rounded-lg bg-stone-50 p-3">
          <p className="text-xs font-medium text-stone-500">{t.frasePronta}</p>
          <p className="mt-1 text-sm text-stone-700 italic">&quot;{t.testoInformativa}&quot;</p>
          <div className="mt-2">
            <CopyTextButton text={t.testoInformativa} locale={locale} />
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-red-200 bg-white p-4">
        <h2 className="font-semibold text-red-700">{t.zonaPericolosaTitle}</h2>
        <p className="mt-1 text-sm text-stone-600">{t.zonaPericolosaDesc}</p>
        <div className="mt-4">
          <DeleteAccountButton locale={locale} />
        </div>
      </section>
    </div>
  );
}

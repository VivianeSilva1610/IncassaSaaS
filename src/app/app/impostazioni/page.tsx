import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { BillingPortalButton } from "@/components/BillingPortalButton";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { EnableNotificationsButton } from "@/components/EnableNotificationsButton";
import { ToggleSollecitoAutomatico } from "@/components/ToggleSollecitoAutomatico";
import { CopyTextButton } from "@/components/CopyTextButton";

const testoInformativa =
  "I dati forniti potranno essere utilizzati per l'invio di promemoria di pagamento, " +
  "anche in forma automatizzata, relativi a fatture e preventivi in essere.";

export default async function ImpostazioniPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, sollecito_automatico_attivo")
    .eq("id", user.id)
    .single();

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Impostazioni</h1>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="font-semibold text-stone-900">Abbonamento e fatturazione</h2>
        <p className="mt-1 text-sm text-stone-600">
          Aggiorna il metodo di pagamento, scarica le ricevute o cancella l&apos;abbonamento.
        </p>
        {profile?.stripe_customer_id ? (
          <div className="mt-4">
            <BillingPortalButton className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98]" />
          </div>
        ) : (
          <p className="mt-4 text-sm text-stone-400">Nessun abbonamento attivo.</p>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="font-semibold text-stone-900">Notifiche</h2>
        <p className="mt-1 text-sm text-stone-600">
          Ricevi una notifica sul dispositivo quando una fattura scade oggi, o quando hai
          un&apos;uscita da pagare oggi.
        </p>
        <div className="mt-4">
          <EnableNotificationsButton />
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-stone-900">Solleciti automatici</h2>
            <p className="mt-1 text-sm text-stone-600">
              Se una fattura resta scaduta per più di 5 giorni, invieremo un&apos;email di sollecito
              automatico al cliente, con tono Cordiale. Puoi disattivare in ogni momento.
            </p>
          </div>
          <ToggleSollecitoAutomatico initialEnabled={profile?.sollecito_automatico_attivo ?? false} />
        </div>

        <div className="mt-4 rounded-lg bg-stone-50 p-3">
          <p className="text-xs font-medium text-stone-500">
            Frase pronta per la tua informativa privacy o fattura
          </p>
          <p className="mt-1 text-sm text-stone-700 italic">&quot;{testoInformativa}&quot;</p>
          <div className="mt-2">
            <CopyTextButton text={testoInformativa} />
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-red-200 bg-white p-4">
        <h2 className="font-semibold text-red-700">Zona pericolosa</h2>
        <p className="mt-1 text-sm text-stone-600">
          Elimina definitivamente il tuo account INCASSA, l&apos;abbonamento e tutti i dati
          (clienti, fatture, preventivi) associati.
        </p>
        <div className="mt-4">
          <DeleteAccountButton />
        </div>
      </section>
    </div>
  );
}

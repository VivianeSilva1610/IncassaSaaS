import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Informativa sulla Privacy — Kit Incassa",
};

const SUPPORT_EMAIL = "viverevivi37@gmail.com";
const LAST_UPDATED = "25 agosto 2026";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-stone-700">
      <Link href="/" className="text-sm text-amber-700 underline underline-offset-2">
        ← Torna alla home
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-stone-900">Informativa sulla Privacy</h1>
      <p className="mt-1 text-sm text-stone-400">Ultimo aggiornamento: {LAST_UPDATED}</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-stone-900">1. Titolare del trattamento</h2>
          <p className="mt-2">
            Il titolare del trattamento dei dati è Viviane Silva, Italia. Per qualsiasi domanda
            relativa a questa informativa o al trattamento dei tuoi dati, puoi scrivere a{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">2. Dati raccolti</h2>
          <p className="mt-2">
            Al momento dell&apos;acquisto del Kit Incassa, tramite la pagina di pagamento ospitata
            da Stripe, raccogliamo:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Indirizzo email</li>
            <li>Identificativo della sessione di pagamento e stato del pagamento</li>
          </ul>
          <p className="mt-2">
            Non riceviamo né conserviamo i dati della tua carta di pagamento: questi sono gestiti
            interamente da Stripe.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">3. Finalità e base giuridica</h2>
          <p className="mt-2">
            Trattiamo i tuoi dati per elaborare il pagamento, consegnarti il prodotto digitale
            acquistato e fornirti assistenza (base giuridica: esecuzione del contratto, art. 6.1.b
            GDPR), oltre che per adempiere agli obblighi contabili e fiscali previsti dalla legge
            (base giuridica: obbligo legale, art. 6.1.c GDPR).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">4. Fornitori e destinatari dei dati</h2>
          <p className="mt-2">Per fornire il servizio ci affidiamo ai seguenti fornitori, che agiscono come responsabili del trattamento:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Stripe</strong> — elaborazione del pagamento</li>
            <li><strong>Supabase</strong> — hosting del database degli ordini</li>
            <li><strong>Resend</strong> — invio dell&apos;email con il prodotto acquistato</li>
            <li><strong>Vercel</strong> — hosting del sito</li>
          </ul>
          <p className="mt-2">
            Alcuni di questi fornitori possono trattare dati anche al di fuori dello Spazio
            Economico Europeo, in base a garanzie adeguate previste dalle rispettive informative
            (es. clausole contrattuali standard).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">5. Conservazione dei dati</h2>
          <p className="mt-2">
            Conserviamo i dati per il tempo necessario a gestire il tuo acquisto e, successivamente,
            per il periodo richiesto dagli obblighi contabili e fiscali previsti dalla legge
            italiana.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">6. I tuoi diritti</h2>
          <p className="mt-2">
            Hai diritto di accedere ai tuoi dati, rettificarli, chiederne la cancellazione, la
            limitazione o l&apos;opposizione al trattamento, e alla portabilità dei dati (artt.
            15–22 GDPR). Puoi esercitare questi diritti scrivendo a{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>
            . Hai inoltre diritto di proporre reclamo al Garante per la protezione dei dati
            personali (www.garanteprivacy.it).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">7. Cookie</h2>
          <p className="mt-2">
            Questo sito non utilizza cookie di profilazione, analytics o marketing. Il pagamento
            avviene su una pagina ospitata da Stripe (dominio stripe.com), soggetta alla{" "}
            <a
              href="https://stripe.com/it/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-700 underline underline-offset-2"
            >
              informativa privacy di Stripe
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">8. Modifiche a questa informativa</h2>
          <p className="mt-2">
            Questa informativa può essere aggiornata nel tempo. La versione più recente è sempre
            disponibile a questo indirizzo.
          </p>
        </section>
      </div>
    </main>
  );
}

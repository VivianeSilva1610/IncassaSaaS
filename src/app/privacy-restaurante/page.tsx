import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Informativa sulla Privacy — Ristorante (bozza) — INCASSA",
};

const SUPPORT_EMAIL = "viverevivi37@gmail.com";
const PEC_EMAIL = "supporto@pec.incassa.eu";
const LAST_UPDATED = "7 ottobre 2026 (bozza)";

export default function PrivacyRestaurantePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-stone-700">
      <Link href="/" className="text-sm text-amber-700 underline underline-offset-2">
        ← Torna alla home
      </Link>

      <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Bozza in attesa di revisione legale.</strong> Questo testo non è ancora stato
        validato da un avvocato e non deve essere considerato definitivo né vincolante fino a
        nuova indicazione.
      </div>

      <h1 className="mt-6 text-2xl font-bold text-stone-900">
        Informativa sulla Privacy — Piattaforma per Ristoranti
      </h1>
      <p className="mt-1 text-sm text-stone-400">Ultimo aggiornamento: {LAST_UPDATED}</p>
      <p className="mt-2 text-sm text-stone-500">
        Questa informativa copre l&apos;abbonamento alla piattaforma di gestione per ristoranti di
        INCASSA, inclusi il Negozio Online dei singoli ristoranti e gli ordini dei relativi Clienti
        Finali. È distinta dall&apos;{" "}
        <Link href="/privacy" className="text-amber-700 underline underline-offset-2">
          Informativa sulla Privacy del Kit Incassa / abbonamento di gestione crediti
        </Link>
        .
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-stone-900">1. Titolare del trattamento</h2>
          <p className="mt-2">
            Il titolare del trattamento dei dati è Viviane Silva, Italia. Per qualsiasi domanda
            relativa a questa informativa o al trattamento dei tuoi dati, puoi scrivere a{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>{" "}
            o via PEC a{" "}
            <a href={`mailto:${PEC_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {PEC_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">2. Dati raccolti</h2>
          <p className="mt-2">Dal Titolare del Ristorante e dai Membri del Team, raccogliamo:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Email e password per l&apos;accesso all&apos;account</li>
            <li>Nome del ristorante, slug/indirizzo scelto ed eventuale dominio personalizzato</li>
            <li>Dati di fatturazione e stato dell&apos;abbonamento (gestiti da Stripe)</li>
            <li>
              I dati che il Ristorante inserisce per il proprio funzionamento: menu e prezzi,
              magazzino/scorte, costi, tavoli, dati di cassa e dati dei Membri del Team invitati
            </li>
          </ul>
          <p className="mt-2">
            Dai Clienti Finali che effettuano un ordine tramite il Negozio Online, raccogliamo per
            conto del Ristorante:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Nome e numero di telefono</li>
            <li>Indirizzo di consegna e zona/quartiere</li>
            <li>CPF/CNPJ (documento fiscale), richiesto dal fornitore di pagamento Pix per elaborare il pagamento</li>
            <li>Contenuto dell&apos;ordine (prodotti, quantità, note, importo)</li>
          </ul>
          <p className="mt-2">
            Non riceviamo né conserviamo i dati completi della carta di pagamento
            dell&apos;abbonamento: questi sono gestiti interamente da Stripe. I pagamenti Pix degli
            ordini dei Clienti Finali sono elaborati interamente dal fornitore esterno Asaas.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">3. Finalità e base giuridica</h2>
          <p className="mt-2">
            Trattiamo i dati del Titolare del Ristorante e dei Membri del Team per fornire
            l&apos;accesso alla Piattaforma, elaborare il pagamento dell&apos;abbonamento e fornire
            assistenza (base giuridica: esecuzione del contratto, art. 6.1.b GDPR), oltre che per
            adempiere agli obblighi contabili e fiscali previsti dalla legge (base giuridica:
            obbligo legale, art. 6.1.c GDPR).
          </p>
          <p className="mt-2">
            I dati dei Clienti Finali raccolti tramite il Negozio Online vengono trattati
            esclusivamente per consentire al Ristorante di gestire ed evadere l&apos;ordine e per
            elaborare il relativo pagamento. Il Ristorante resta titolare del trattamento di tali
            dati verso i propri Clienti Finali; INCASSA agisce come responsabile del trattamento per
            conto del Ristorante (art. 28 GDPR).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">4. Fornitori e destinatari dei dati</h2>
          <p className="mt-2">Per fornire il servizio ci affidiamo ai seguenti fornitori, che agiscono come responsabili del trattamento:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Stripe</strong> — elaborazione dei pagamenti dell&apos;abbonamento del Ristorante</li>
            <li><strong>Asaas</strong> — elaborazione dei pagamenti Pix degli ordini dei Clienti Finali (riceve nome, CPF/CNPJ e telefono del Cliente Finale)</li>
            <li><strong>Supabase</strong> — hosting del database e autenticazione degli account</li>
            <li><strong>Resend</strong> — invio delle email transazionali</li>
            <li><strong>Vercel</strong> — hosting del sito e instradamento dei domini personalizzati</li>
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
            Conserviamo i dati del Titolare del Ristorante per il tempo necessario a gestire
            l&apos;abbonamento e, successivamente, per il periodo richiesto dagli obblighi contabili
            e fiscali previsti dalla legge. I dati degli ordini dei Clienti Finali sono conservati
            per il tempo necessario a gestire l&apos;ordine e per gli eventuali obblighi contabili e
            fiscali del Ristorante. Se il Titolare del Ristorante elimina il proprio account, i dati
            inseriti sulla Piattaforma vengono cancellati secondo quanto previsto all&apos;art. 18
            dei Termini di Servizio.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">6. I tuoi diritti</h2>
          <p className="mt-2">
            Hai diritto di accedere ai tuoi dati, rettificarli, chiederne la cancellazione, la
            limitazione o l&apos;opposizione al trattamento, e alla portabilità dei dati (artt.
            15–22 GDPR).
          </p>
          <p className="mt-2">
            Se sei il Titolare del Ristorante o un Membro del Team, puoi esercitare questi diritti
            scrivendo a{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>
            . Se sei un Cliente Finale e vuoi esercitare questi diritti sui dati del tuo ordine,
            puoi contattare direttamente il Ristorante presso cui hai effettuato l&apos;ordine,
            oppure scrivere all&apos;indirizzo sopra indicato, che instraderà la richiesta al
            Ristorante competente. Hai inoltre diritto di proporre reclamo al Garante per la
            protezione dei dati personali (www.garanteprivacy.it) o all&apos;autorità di protezione
            dati del tuo paese.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">7. Cookie</h2>
          <p className="mt-2">
            Questo sito non utilizza cookie di profilazione, analytics o marketing. Utilizziamo
            solo cookie tecnici necessari per mantenere la sessione di accesso all&apos;account. Il
            pagamento dell&apos;abbonamento avviene su una pagina ospitata da Stripe (dominio
            stripe.com); il pagamento degli ordini dei Clienti Finali avviene tramite Pix generato
            da Asaas.
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

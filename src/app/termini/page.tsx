import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termini e Condizioni — INCASSA",
};

const SUPPORT_EMAIL = "viverevivi37@gmail.com";
const PEC_EMAIL = "supporto@pec.incassa.eu";
const LAST_UPDATED = "25 agosto 2026";

export default function TerminiPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-stone-700">
      <Link href="/" className="text-sm text-amber-700 underline underline-offset-2">
        ← Torna alla home
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-stone-900">Termini e Condizioni</h1>
      <p className="mt-1 text-sm text-stone-400">Ultimo aggiornamento: {LAST_UPDATED}</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-stone-900">1. Il venditore</h2>
          <p className="mt-2">
            INCASSA e il Kit Incassa sono venduti da Viviane Silva, Italia. Per qualsiasi domanda: {" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>{" "}
            o via PEC:{" "}
            <a href={`mailto:${PEC_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {PEC_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">2. Il prodotto</h2>
          <p className="mt-2">
            INCASSA è una piattaforma in abbonamento (SaaS) che aiuta piccole imprese e artigiani a
            gestire clienti, fatture e preventivi, generare messaggi di sollecito di pagamento —
            anche tramite intelligenza artificiale — e, se attivata dall&apos;utente, inviare
            automaticamente promemoria di pagamento ai propri clienti quando una fattura risulta
            scaduta da alcuni giorni. Il Kit Incassa è un contenuto digitale (non fornito su
            supporto materiale) composto da 37 messaggi pronti per sollecitare il pagamento di
            fatture scadute, organizzati per situazione e tono, offerto in acquisto singolo al
            prezzo di €9,00, senza rinnovo automatico. Prezzi e modalità di abbonamento di INCASSA
            sono indicati in fase di acquisto.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">3. Pagamento e consegna</h2>
          <p className="mt-2">
            Il pagamento avviene tramite Stripe. Subito dopo il pagamento, l&apos;accesso al
            contenuto viene fornito immediatamente tramite una pagina web dedicata, e una copia
            viene inviata all&apos;indirizzo email fornito in fase di acquisto.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">4. Diritto di recesso</h2>
          <p className="mt-2">
            Ai sensi dell&apos;art. 59, comma 1, lett. o) del Codice del Consumo (D.Lgs. 206/2005),
            trattandosi della fornitura di contenuto digitale non fornito su supporto materiale, il
            diritto di recesso di 14 giorni previsto per i contratti a distanza <strong>non si
            applica</strong> una volta che l&apos;esecuzione è iniziata con il consenso espresso del
            consumatore. Completando l&apos;acquisto e accettando questi Termini, dichiari di
            richiedere espressamente l&apos;accesso immediato al contenuto digitale e riconosci di
            perdere, di conseguenza, il diritto di recesso.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">5. Garanzia commerciale di rimborso</h2>
          <p className="mt-2">
            Nonostante quanto previsto al punto precedente, offriamo comunque una garanzia
            commerciale volontaria: se il Kit Incassa non fa per te, puoi richiedere il rimborso
            completo entro 7 giorni dall&apos;acquisto scrivendo a{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>{" "}
            o via PEC a{" "}
            <a href={`mailto:${PEC_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {PEC_EMAIL}
            </a>
            , senza necessità di motivazione.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">6. Uso consentito</h2>
          <p className="mt-2">
            Il contenuto è concesso in licenza d&apos;uso personale o professionale
            all&apos;acquirente, per l&apos;utilizzo nella propria attività. Non è consentita la
            rivendita, redistribuzione o pubblicazione del contenuto a terzi, in tutto o in parte.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">
            7. Nessuna consulenza legale o finanziaria — Limitazione di responsabilità
          </h2>
          <p className="mt-2">
            INCASSA e il Kit Incassa forniscono modelli di messaggio generici e uno strumento per
            la gestione delle fatture e dei solleciti di pagamento, a scopo esclusivamente
            informativo e pratico. Non costituiscono consulenza legale, fiscale, finanziaria o di
            recupero crediti di alcun tipo, e non garantiamo l&apos;effettivo recupero delle somme
            dovute all&apos;utente. INCASSA non è un&apos;agenzia di recupero crediti e non agisce
            come tale.
          </p>
          <p className="mt-2">
            <strong>Esattezza dei dati inseriti.</strong> L&apos;utente è l&apos;unico responsabile
            dell&apos;esattezza, completezza e aggiornamento dei dati che inserisce nel Servizio,
            inclusi — a titolo esemplificativo — nome e contatti dei propri clienti, importi delle
            fatture, date di scadenza e stato dei pagamenti. INCASSA non verifica né garantisce la
            correttezza di tali dati e non è responsabile per solleciti errati, indebiti o
            imbarazzanti generati o inviati a causa di dati inesatti, incompleti o non aggiornati
            forniti dall&apos;utente. È responsabilità dell&apos;utente aggiornare tempestivamente
            lo stato delle fatture (ad esempio segnandole come pagate) per evitare l&apos;invio di
            solleciti non dovuti.
          </p>
          <p className="mt-2">
            <strong>Contenuto e invio dei solleciti.</strong> L&apos;utente è l&apos;unico
            responsabile del contenuto, del tono e delle conseguenze di ciascun messaggio di
            sollecito inviato ai propri clienti tramite INCASSA — sia che il messaggio sia stato
            generato tramite intelligenza artificiale, modificato dall&apos;utente e inviato
            manualmente, sia che sia stato inviato automaticamente tramite la funzione opzionale di
            invio automatico attivata dall&apos;utente. L&apos;utente riconosce e accetta che, una
            volta attivata, la funzione di invio automatico genera e invia i messaggi sulla base
            dei dati presenti nel proprio account, <strong>senza revisione umana preventiva</strong>{" "}
            da parte dell&apos;utente prima dell&apos;invio, e che tale invio è una conseguenza
            diretta della configurazione da lui scelta e dei dati da lui inseriti o non aggiornati.
            L&apos;utente può in qualsiasi momento rivedere, modificare, sospendere o disattivare la
            funzione di invio automatico dalle impostazioni del proprio account, e resta l&apos;unico
            responsabile di verificare che i messaggi inviati — automaticamente o manualmente —
            rispettino le leggi applicabili alle proprie comunicazioni commerciali e di recupero
            crediti (incluse, a titolo esemplificativo, le norme in materia di tutela del
            consumatore, comunicazioni commerciali indesiderate e trattamento dei dati personali
            dei propri clienti).
          </p>
          <p className="mt-2">
            <strong>Manleva.</strong> L&apos;utente si impegna a manlevare e tenere indenne INCASSA
            da qualsiasi pretesa, richiesta di risarcimento, sanzione, costo o spesa (incluse le
            spese legali) derivante da: (i) dati inesatti, incompleti o non aggiornati inseriti nel
            Servizio dall&apos;utente; (ii) contenuto, tono o conseguenze dei solleciti inviati ai
            propri clienti, manualmente o tramite la funzione di invio automatico; (iii) violazione
            da parte dell&apos;utente delle leggi applicabili alle proprie comunicazioni
            commerciali.
          </p>
          <p className="mt-2">
            Nella misura massima consentita dalla legge applicabile, INCASSA è fornito
            &quot;così com&apos;è&quot; (&quot;as is&quot;), e decliniamo ogni responsabilità per
            danni diretti o indiretti, mancato guadagno o pretese legali derivanti dall&apos;uso
            del Servizio o dalle comunicazioni inviate tramite esso.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">8. Legge applicabile</h2>
          <p className="mt-2">
            Questi Termini sono regolati dalla legge italiana. Per i consumatori, resta fermo il
            foro competente del luogo di residenza o domicilio del consumatore, secondo le norme
            inderogabili del Codice del Consumo.
          </p>
        </section>
      </div>
    </main>
  );
}

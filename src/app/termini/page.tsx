import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termini e Condizioni — Kit Incassa",
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

      <h1 className="mt-6 text-2xl font-bold text-stone-900">Termini e Condizioni di Vendita</h1>
      <p className="mt-1 text-sm text-stone-400">Ultimo aggiornamento: {LAST_UPDATED}</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-stone-900">1. Il venditore</h2>
          <p className="mt-2">
            Il Kit Incassa è venduto da Viviane Silva, Italia. Per qualsiasi domanda: {" "}
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
            Il Kit Incassa è un contenuto digitale (non fornito su supporto materiale) composto da
            37 messaggi pronti per sollecitare il pagamento di fatture scadute, organizzati per
            situazione e tono. Il prezzo è di €9,00, pagamento unico, senza rinnovo automatico.
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
          <h2 className="text-base font-semibold text-stone-900">7. Limitazione di responsabilità</h2>
          <p className="mt-2">
            Il Kit Incassa fornisce modelli di messaggi generici a scopo informativo e pratico. Non
            costituisce consulenza legale, fiscale o professionale, e non garantisce l&apos;effettivo
            recupero dei crediti da parte dell&apos;acquirente.
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

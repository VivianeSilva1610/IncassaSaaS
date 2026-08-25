import { messages } from "@/content/kit-incassa";
import { CheckoutButton } from "@/components/CheckoutButton";

const SUPPORT_EMAIL = "viverevivi37@gmail.com";

const galleryIds = [
  "ritardo-lieve-gentile",
  "secondo-sollecito-diretto",
  "cliente-abituale-gentile",
  "azienda-formale",
  "pagamento-parziale-gentile",
  "sollecito-finale-formale",
];
const galleryMessages = galleryIds.map((id) => messages.find((m) => m.id === id)!);

const benefits = [
  {
    icon: "😊🙂😐⚠️",
    title: "4 toni diversi",
    text: "Gentile, Cordiale, Diretto o Formale: scegli il tono giusto in base al cliente e al rapporto che hai con lui.",
  },
  {
    icon: "📋",
    title: "17 situazioni coperte",
    text: "Dal primo ritardo al sollecito finale, passando per aziende, privati, pagamenti parziali e promesse non mantenute.",
  },
  {
    icon: "⚡",
    title: "Accesso immediato",
    text: "Ricevi tutto subito dopo il pagamento, direttamente sul sito. Nessuna attesa, nessun login da creare.",
  },
  {
    icon: "📱",
    title: "Pronto per WhatsApp ed email",
    text: "Copia, incolla, personalizza con i dati del cliente e invia in pochi secondi.",
  },
];

const situations = [
  "Ritardo lieve (3 giorni)",
  "Ritardo medio (7 giorni)",
  "Cliente ha visualizzato e non risponde",
  "Primo e secondo sollecito",
  "Sollecito finale",
  "Ha promesso un bonifico",
  "Ha promesso di pagare \"venerdì\"",
  "Pagamento parziale ricevuto",
  "Cliente abituale vs. nuovo",
  "Azienda (B2B) vs. privato (B2C)",
  "Dopo un lungo silenzio",
  "Richiesta di conferma pagamento",
  "Cliente chiede sconto o rateizzazione",
  "Ringraziamento dopo il pagamento",
];

const faqs = [
  {
    q: "Devo personalizzare i messaggi?",
    a: "Sì. Sostituisci le parti tra [parentesi quadre] (nome, importo, data...) con i dati reali del cliente. Ci vogliono pochi secondi.",
  },
  {
    q: "Funziona su WhatsApp?",
    a: "Sì. Copi il messaggio e lo incolli direttamente nella chat. Non è un'automazione: sei sempre tu a decidere quando inviare.",
  },
  {
    q: "Ricevo il kit anche via email?",
    a: "Sì. Oltre alla pagina di accesso immediato, ti mandiamo una copia via email con il file scaricabile.",
  },
  {
    q: "Va bene anche per clienti aziendali (B2B)?",
    a: "Sì, ci sono messaggi specifici sia per aziende che per clienti privati.",
  },
  {
    q: "È un abbonamento?",
    a: "No. È un pagamento unico di €9. Nessun rinnovo automatico.",
  },
  {
    q: "Posso usarlo per più clienti?",
    a: "Sì, senza limiti: usa i messaggi per tutti i clienti che vuoi, quante volte vuoi.",
  },
  {
    q: "Cosa succede se non fa per me?",
    a: `Hai 7 giorni dall'acquisto per chiedere il rimborso completo scrivendo a ${SUPPORT_EMAIL}.`,
  },
  {
    q: "Serve installare qualcosa?",
    a: "No. È tutto accessibile dal browser: nessuna app da scaricare, nessun account da creare.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      {/* Hero */}
      <section className="text-center">
        <p className="mb-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          Per idraulici, elettricisti, imprese edili e artigiani
        </p>
        <h1 className="text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl">
          Kit Incassa
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-600">
          37 messaggi pronti per farti pagare senza rovinare il rapporto con il cliente.
        </p>
        <div className="mt-8 flex flex-col items-center gap-2">
          <CheckoutButton className="rounded-lg bg-neutral-900 px-6 py-3 text-base font-semibold text-white hover:bg-neutral-700 disabled:opacity-60" />
          <span className="text-xs text-neutral-400">Pagamento unico di €9 · accesso immediato</span>
        </div>
      </section>

      {/* Problema */}
      <section className="mt-16 rounded-xl bg-neutral-50 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-neutral-900">Ti suona familiare?</h2>
        <ul className="mt-4 space-y-2 text-neutral-700">
          <li>Un cliente ha visualizzato il tuo messaggio e non ha più risposto.</li>
          <li>Non sai come scrivere un sollecito senza sembrare aggressivo.</li>
          <li>Hai lavori pagati in ritardo di settimane e non sai come chiedere senza rovinare il rapporto.</li>
        </ul>
        <p className="mt-4 text-neutral-700">
          Il Kit Incassa ti dà la frase giusta per ogni situazione: ritardo lieve o grave, cliente
          abituale o nuovo, azienda o privato — in quattro toni diversi, da scegliere in base al
          rapporto che hai con il cliente.
        </p>
      </section>

      {/* Galleria di esempi */}
      <section className="mt-16">
        <h2 className="text-center text-xl font-semibold text-neutral-900">Alcuni esempi</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {galleryMessages.map((message) => (
            <div
              key={message.id}
              className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-700 shadow-sm"
            >
              {message.tone && (
                <span className="mb-2 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                  {message.tone}
                </span>
              )}
              <p>{message.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefici */}
      <section className="mt-16">
        <h2 className="text-center text-xl font-semibold text-neutral-900">Perché il Kit Incassa</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {benefits.map((b) => (
            <div key={b.title} className="flex gap-3">
              <span className="text-2xl leading-none">{b.icon}</span>
              <div>
                <h3 className="font-semibold text-neutral-900">{b.title}</h3>
                <p className="mt-1 text-sm text-neutral-600">{b.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Situazioni coperte */}
      <section className="mt-16 rounded-xl border border-neutral-200 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-neutral-900">Tutte le situazioni coperte</h2>
        <div className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {situations.map((s) => (
            <div key={s} className="flex items-start gap-2 text-neutral-700">
              <span className="mt-0.5 text-emerald-600">✓</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <CheckoutButton className="rounded-lg bg-neutral-900 px-6 py-3 text-base font-semibold text-white hover:bg-neutral-700 disabled:opacity-60" />
        </div>
      </section>

      {/* Prezzo */}
      <section className="mt-16 rounded-xl bg-neutral-900 p-6 text-center text-white sm:p-10">
        <h2 className="text-xl font-semibold">Kit Incassa completo</h2>
        <p className="mt-2 text-4xl font-bold">€9</p>
        <p className="mt-1 text-sm text-neutral-300">pagamento unico, nessun abbonamento</p>
        <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm text-neutral-200">
          <li>✓ 37 messaggi pronti in 4 toni diversi</li>
          <li>✓ Accesso immediato + copia via email</li>
          <li>✓ File scaricabile da copiare e incollare</li>
          <li>✓ Uso illimitato, per tutti i tuoi clienti</li>
        </ul>
        <div className="mt-8">
          <CheckoutButton className="rounded-lg bg-white px-6 py-3 text-base font-semibold text-neutral-900 hover:bg-neutral-100 disabled:opacity-60" />
        </div>
      </section>

      {/* Garanzia */}
      <section className="mt-16 text-center">
        <h2 className="text-xl font-semibold text-neutral-900">Garanzia 7 giorni</h2>
        <p className="mx-auto mt-2 max-w-lg text-neutral-600">
          Se il Kit Incassa non fa per te, scrivici entro 7 giorni dall&apos;acquisto a{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
            {SUPPORT_EMAIL}
          </a>{" "}
          e ti rimborsiamo, senza fare domande.
        </p>
      </section>

      {/* Come funziona */}
      <section className="mt-16">
        <h2 className="text-center text-xl font-semibold text-neutral-900">Come funziona</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {[
            { step: "1", title: "Acquisti", text: "Pagamento sicuro tramite Stripe, carta o Apple/Google Pay." },
            { step: "2", title: "Accedi subito", text: "Vieni reindirizzato alla pagina con tutti i 37 messaggi, già pronta." },
            { step: "3", title: "Copia e invia", text: "Personalizza con i dati del cliente e invia su WhatsApp o email." },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
                {s.step}
              </div>
              <h3 className="mt-3 font-semibold text-neutral-900">{s.title}</h3>
              <p className="mt-1 text-sm text-neutral-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-16">
        <h2 className="text-center text-xl font-semibold text-neutral-900">Domande frequenti</h2>
        <div className="mt-6 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="rounded-lg border border-neutral-200 p-4">
              <summary className="cursor-pointer font-medium text-neutral-900">{f.q}</summary>
              <p className="mt-2 text-sm text-neutral-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-16 text-center">
        <CheckoutButton className="rounded-lg bg-neutral-900 px-6 py-3 text-base font-semibold text-white hover:bg-neutral-700 disabled:opacity-60" />
      </section>

      <footer className="mt-16 border-t border-neutral-200 pt-6 text-center text-xs text-neutral-400">
        <p>© {new Date().getFullYear()} Kit Incassa. Tutti i diritti riservati.</p>
        <p className="mt-1">
          Kit Incassa non è affiliato con WhatsApp Inc. WhatsApp è un marchio registrato di WhatsApp LLC.
        </p>
      </footer>
    </main>
  );
}

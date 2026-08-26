import Link from "next/link";
import { messages } from "@/content/kit-incassa";
import { CheckoutButton } from "@/components/CheckoutButton";
import { Reveal } from "@/components/Reveal";
import { toneBadgeClasses } from "@/lib/tone-styles";

const SUPPORT_EMAIL = "viverevivi37@gmail.com";

const galleryIds = [
  "ritardo-lieve-gentile",
  "secondo-sollecito-diretto",
  "cliente-abituale-gentile",
  "azienda-formale",
];
const galleryMessages = galleryIds.map((id) => messages.find((m) => m.id === id)!);

const problemi = [
  {
    title: "Fatture dimenticate",
    text: "Le fatture scadute si accumulano tra WhatsApp, note e fogli Excel. Nessuno le tiene tutte d'occhio.",
  },
  {
    title: "Solleciti scritti a mano",
    text: "Ogni volta devi capire cosa scrivere, con che tono, senza sembrare aggressivo o rovinare il rapporto.",
  },
  {
    title: "Zero visibilità",
    text: "Non sai quanto hai da recuperare in totale, cosa scade oggi, o quanti dei tuoi solleciti funzionano davvero.",
  },
];

const features = [
  {
    icon: "🤖",
    title: "Sollecito automatico via email",
    text: "Se attivi l'opzione, quando una fattura resta scaduta 5 giorni INCASSA manda da sola l'email di sollecito al cliente. Nessun clic.",
  },
  {
    icon: "😊",
    title: "IA in 4 toni diversi",
    text: "Gentile, Cordiale, Diretto o Formale: un clic e hai il messaggio pronto per WhatsApp o email, scritto su misura per la situazione.",
  },
  {
    icon: "📊",
    title: "Dashboard operativa",
    text: "Quanto devi recuperare in totale, cosa scade oggi, il tasso di recupero degli ultimi 30 giorni — tutto in un colpo d'occhio.",
  },
  {
    icon: "📥",
    title: "Importa fatture e clienti da CSV",
    text: "Carica tutto in blocco invece di inserirlo uno per uno. INCASSA riconosce i clienti già esistenti da telefono o nome.",
  },
  {
    icon: "🗂️",
    title: "Storico comunicazioni",
    text: "Ogni sollecito inviato — manuale o automatico — resta registrato per cliente: cosa hai mandato, quando e come.",
  },
  {
    icon: "📱",
    title: "Pronto per WhatsApp",
    text: "Il messaggio si apre già scritto nella chat del cliente: lo controlli tu, decidi tu quando inviarlo.",
  },
];

const faqs = [
  {
    q: "È completamente automatico?",
    a: "L'email di sollecito può essere automatica (opzionale, la attivi tu quando vuoi). Il messaggio WhatsApp oggi si apre pronto nella chat, ma sei sempre tu a premere invio.",
  },
  {
    q: "Posso importare le fatture che ho già?",
    a: "Sì, via CSV: carichi il file e INCASSA le aggiunge tutte insieme, riconoscendo i clienti già presenti.",
  },
  {
    q: "Quanto costa?",
    a: "€19,90 al mese, con 7 giorni di prova gratuita. Nessun vincolo: cancelli quando vuoi dalle impostazioni dell'account.",
  },
  {
    q: "Devo installare qualcosa?",
    a: "No. È tutto accessibile dal browser, anche da telefono. Se vuoi, puoi aggiungere INCASSA alla schermata Home del cellulare per aprirlo come un'app: su iPhone tocca Condividi → \"Aggiungi a Home\", su Android tocca i tre puntini del browser → \"Aggiungi a schermata Home\".",
  },
  {
    q: "E se non ho ancora clienti/fatture da gestire, solo bisogno dei messaggi pronti?",
    a: `C'è anche il Kit Incassa: 37 messaggi pronti da copiare e incollare, pagamento unico di €9, senza dashboard né abbonamento.`,
  },
  {
    q: "I miei dati sono al sicuro?",
    a: "Sì. I dati restano tuoi: puoi esportarli o eliminare l'account in qualsiasi momento dalle impostazioni.",
  },
];

const primaryButton =
  "rounded-lg bg-gradient-to-b from-amber-500 to-orange-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-orange-900/20 transition-transform hover:from-amber-400 hover:to-orange-500 active:scale-[0.98] disabled:opacity-60";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold text-stone-900">INCASSA</span>
        <Link href="/login" className="text-stone-500 hover:text-stone-900">
          Accedi
        </Link>
      </div>

      {/* Hero */}
      <section className="relative mt-10 overflow-hidden text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-300/30 blur-3xl"
        />
        <Reveal mode="load" stagger={0.1} className="relative">
          <p className="mb-3 inline-block rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            Per idraulici, elettricisti, imprese edili e artigiani
          </p>
          <h1 className="text-3xl font-bold leading-tight text-stone-900 sm:text-4xl">
            Hai lavorato. Ora fatti pagare.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-stone-600">
            INCASSA ti aiuta a ricordare chi deve pagarti e quali preventivi aspettano ancora una
            risposta — senza perdere tempo tra WhatsApp, note e fogli Excel.
          </p>
          <div className="mt-8 flex flex-col items-center gap-2">
            <Link href="/signup" className={primaryButton}>
              Inizia la prova gratuita di 7 giorni
            </Link>
            <span className="text-xs text-stone-400">Poi €19,90/mese · cancelli quando vuoi</span>
          </div>
        </Reveal>
      </section>

      {/* Problema */}
      <section className="mt-16">
        <Reveal>
          <h2 className="text-center text-xl font-semibold text-stone-900">Ti suona familiare?</h2>
        </Reveal>
        <Reveal stagger={0.1} className="mt-6 grid gap-6 sm:grid-cols-3">
          {problemi.map((p) => (
            <div key={p.title} className="rounded-xl border border-stone-200 bg-stone-50 p-5">
              <h3 className="font-semibold text-stone-900">{p.title}</h3>
              <p className="mt-1 text-sm text-stone-600">{p.text}</p>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Funzionalità */}
      <section className="mt-16">
        <Reveal>
          <h2 className="text-center text-xl font-semibold text-stone-900">
            Tutto quello che serve per farti pagare
          </h2>
        </Reveal>
        <Reveal stagger={0.1} className="mt-6 grid gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xl">
                {f.icon}
              </span>
              <div>
                <h3 className="font-semibold text-stone-900">{f.title}</h3>
                <p className="mt-1 text-sm text-stone-600">{f.text}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Galleria di esempi */}
      <section className="mt-16">
        <Reveal>
          <h2 className="text-center text-xl font-semibold text-stone-900">Il tono giusto per ogni cliente</h2>
        </Reveal>
        <Reveal stagger={0.08} className="mt-6 grid gap-4 sm:grid-cols-2">
          {galleryMessages.map((message) => (
            <div
              key={message.id}
              className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-700 shadow-sm transition-shadow hover:shadow-md"
            >
              {message.tone && (
                <span
                  className={`mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${toneBadgeClasses[message.tone]}`}
                >
                  {message.tone}
                </span>
              )}
              <p>{message.text}</p>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Come funziona */}
      <section className="mt-16">
        <Reveal>
          <h2 className="text-center text-xl font-semibold text-stone-900">Come funziona</h2>
        </Reveal>
        <Reveal stagger={0.12} className="mt-6 grid gap-6 sm:grid-cols-3">
          {[
            { step: "1", title: "Importa", text: "Carica fatture e clienti da CSV, o aggiungili man mano che lavori." },
            { step: "2", title: "Attiva o genera", text: "Lascia che INCASSA solleciti da sola via email, oppure genera il messaggio quando vuoi." },
            { step: "3", title: "Segui dalla dashboard", text: "Scadenze del giorno, tasso di recupero, storico di tutto quello che hai inviato." },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-amber-500 to-orange-600 text-sm font-semibold text-white shadow-md shadow-orange-900/20">
                {s.step}
              </div>
              <h3 className="mt-3 font-semibold text-stone-900">{s.title}</h3>
              <p className="mt-1 text-sm text-stone-600">{s.text}</p>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Prezzo */}
      <Reveal className="mt-16 rounded-xl bg-gradient-to-b from-stone-900 to-stone-800 p-6 text-center text-white shadow-xl sm:p-10">
        <h2 className="text-xl font-semibold">INCASSA</h2>
        <p className="mt-2 text-4xl font-bold">€19,90</p>
        <p className="mt-1 text-sm text-stone-300">al mese, 7 giorni di prova gratuita</p>
        <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm text-stone-200">
          <li>✓ Dashboard con scadenze e tasso di recupero</li>
          <li>✓ Solleciti IA in 4 toni, per WhatsApp ed email</li>
          <li>✓ Sollecito automatico via email (opzionale)</li>
          <li>✓ Import CSV di fatture e clienti</li>
          <li>✓ Storico comunicazioni per cliente</li>
        </ul>
        <div className="mt-8">
          <Link
            href="/signup"
            className="inline-block rounded-lg bg-white px-6 py-3 text-base font-semibold text-stone-900 shadow-lg transition-transform hover:bg-stone-100 active:scale-[0.98]"
          >
            Inizia la prova gratuita
          </Link>
        </div>
      </Reveal>

      {/* FAQ */}
      <section className="mt-16">
        <Reveal>
          <h2 className="text-center text-xl font-semibold text-stone-900">Domande frequenti</h2>
        </Reveal>
        <Reveal stagger={0.05} className="mt-6 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-lg border border-stone-200 bg-white p-4 open:shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-stone-900">
                {f.q}
                <span className="ml-4 shrink-0 text-stone-400 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm text-stone-600">{f.a}</p>
            </details>
          ))}
        </Reveal>
      </section>

      <Reveal className="mt-16 text-center">
        <Link href="/signup" className={primaryButton}>
          Inizia la prova gratuita di 7 giorni
        </Link>
      </Reveal>

      {/* Kit Incassa - offerta secondaria */}
      <Reveal className="mt-16 rounded-xl border border-stone-200 bg-stone-50 p-6 text-center sm:p-8">
        <h2 className="text-lg font-semibold text-stone-900">Ti serve solo qualche messaggio pronto?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
          Il Kit Incassa ti dà 37 messaggi pronti da copiare e incollare, in 4 toni diversi.
          Pagamento unico di €9, nessun abbonamento.
        </p>
        <div className="mt-4">
          <CheckoutButton className="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:bg-stone-700 active:scale-[0.98] disabled:opacity-60" />
        </div>
      </Reveal>

      <footer className="mt-16 border-t border-stone-200 pt-6 text-center text-xs text-stone-400">
        <p>© {new Date().getFullYear()} INCASSA. Tutti i diritti riservati.</p>
        <p className="mt-1">
          INCASSA non è affiliato con WhatsApp Inc. WhatsApp è un marchio registrato di WhatsApp LLC.
        </p>
        <p className="mt-2">
          Domande? Scrivici a{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="underline underline-offset-2 hover:text-stone-600">
            {SUPPORT_EMAIL}
          </a>
        </p>
        <p className="mt-2 space-x-3">
          <Link href="/privacy" className="underline underline-offset-2 hover:text-stone-600">
            Privacy
          </Link>
          <Link href="/termini" className="underline underline-offset-2 hover:text-stone-600">
            Termini e Condizioni
          </Link>
        </p>
      </footer>
    </main>
  );
}

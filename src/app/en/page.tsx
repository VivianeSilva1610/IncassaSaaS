import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { messagesEn } from "@/content/kit-incassa.en";
import { CheckoutButton } from "@/components/CheckoutButton";
import { Reveal } from "@/components/Reveal";
import { DemoDashboard } from "@/components/DemoDashboard";
import { toneBadgeClasses } from "@/lib/tone-styles";

export const metadata: Metadata = {
  title: "INCASSA — You did the work. Now get paid.",
  description:
    "A dashboard, AI-generated reminders, and automatic follow-ups to help you get paid without losing time. For plumbers, electricians, contractors and small businesses.",
};

const SUPPORT_EMAIL = "viverevivi37@gmail.com";
const PEC_EMAIL = "supporto@pec.incassa.eu";

const toneLabelEn = {
  Gentile: "Friendly",
  Cordiale: "Polite",
  Diretto: "Direct",
  Formale: "Formal",
};

const galleryIds = [
  "ritardo-lieve-gentile",
  "secondo-sollecito-diretto",
  "cliente-abituale-gentile",
  "azienda-formale",
];
const galleryMessages = galleryIds.map((id) => {
  const m = messagesEn.find((msg) => msg.id === id)!;
  return {
    tone: m.tone ? toneLabelEn[m.tone] : undefined,
    badgeClass: m.tone ? toneBadgeClasses[m.tone] : "",
    text: m.text,
  };
});

const problemi = [
  {
    title: "Forgotten invoices",
    text: "Overdue invoices pile up across WhatsApp, notes and spreadsheets. Nobody keeps an eye on all of them.",
  },
  {
    title: "Reminders written by hand",
    text: "Every time you have to figure out what to say, in what tone, without sounding aggressive or damaging the relationship.",
  },
  {
    title: "Zero visibility",
    text: "You don't know how much you have to collect in total, what's due today, or how many of your reminders actually work.",
  },
];

const features = [
  {
    icon: "/feature-icons/sollecito-automatico-email.png",
    title: "Automatic email reminders",
    text: "If you turn it on, when an invoice stays unpaid for 5 days INCASSA sends the reminder email to the client on its own. No clicks needed.",
  },
  {
    icon: "/feature-icons/ia-quattro-toni.png",
    title: "AI in 4 different tones",
    text: "Friendly, Polite, Direct or Formal: one click and you have the message ready for WhatsApp or email, written for the situation.",
  },
  {
    icon: "/feature-icons/dashboard-operativa.png",
    title: "Operational dashboard",
    text: "How much you have to collect, what's due today, your 30-day recovery rate, and your estimated net balance after expenses — all at a glance.",
  },
  {
    icon: "/feature-icons/importa-csv.png",
    title: "Import invoices and clients from CSV or Excel",
    text: "Upload everything in bulk instead of entering it one by one. INCASSA recognizes clients you already have by phone or name.",
  },
  {
    icon: "/feature-icons/storico-comunicazioni.png",
    title: "Communication history",
    text: "Every reminder sent — manual or automatic — is logged per client: what you sent, when, and how.",
  },
  {
    icon: "/feature-icons/pronto-whatsapp.png",
    title: "Ready for WhatsApp",
    text: "The message opens already written in the client's chat: you're always the one who checks it and decides when to send.",
  },
];

const faqs = [
  {
    q: "Is it fully automatic?",
    a: "The email reminder can be automatic (optional, you turn it on whenever you want). The WhatsApp message today opens ready in the chat, but you always press send.",
  },
  {
    q: "Can I import invoices I already have?",
    a: "Yes, via CSV or Excel: you upload the file and INCASSA adds them all at once, recognizing clients you already have.",
  },
  {
    q: "How much does it cost?",
    a: "€19.90/month, with a 7-day free trial. No commitment: cancel anytime from your account settings.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. Everything is accessible from the browser, including on your phone. If you want, you can add INCASSA to your phone's home screen to open it like an app.",
  },
  {
    q: "What if I don't have clients/invoices to manage yet, I just need ready-made messages?",
    a: "There's also the Kit Incassa: 37 ready-to-send messages you can copy and paste, one-time payment, no dashboard or subscription.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. Your data stays yours: you can export it or delete your account at any time from settings.",
  },
];

const primaryButton =
  "rounded-lg bg-gradient-to-b from-amber-500 to-orange-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-orange-900/20 transition-transform hover:from-amber-400 hover:to-orange-500 active:scale-[0.98] disabled:opacity-60";

export default function HomeEn() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between text-sm">
        <Image src="/logo.png" alt="INCASSA" width={96} height={96} className="rounded-full" priority />
        <div className="flex items-center gap-4">
          <Link href="/" className="text-stone-400 hover:text-stone-900">
            Italiano
          </Link>
          <Link href="/en/login" className="text-stone-500 hover:text-stone-900">
            Log in
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="relative mt-10 overflow-hidden text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-300/30 blur-3xl"
        />
        <Reveal mode="load" stagger={0.1} className="relative">
          <p className="mb-3 inline-block rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            For plumbers, electricians, contractors and small businesses
          </p>
          <h1 className="text-3xl font-bold leading-tight text-stone-900 sm:text-4xl">
            You did the work. Now get paid.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-stone-600">
            INCASSA helps you remember who owes you money and which quotes are still waiting for a
            reply — without losing time between WhatsApp, notes and spreadsheets.
          </p>
        </Reveal>
      </section>

      {/* Problema */}
      <section className="mt-16">
        <Reveal>
          <h2 className="text-center text-xl font-semibold text-stone-900">Sound familiar?</h2>
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
            Everything you need to get paid
          </h2>
        </Reveal>
        <Reveal stagger={0.1} className="mt-6 grid gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="flex gap-4">
              <Image
                src={f.icon}
                alt=""
                width={56}
                height={56}
                className="h-14 w-14 shrink-0 rounded-xl border border-stone-200 object-cover"
              />
              <div>
                <h3 className="font-semibold text-stone-900">{f.title}</h3>
                <p className="mt-1 text-sm text-stone-600">{f.text}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Demo dashboard */}
      <section className="mt-16">
        <Reveal>
          <h2 className="text-center text-xl font-semibold text-stone-900">Your dashboard, in practice</h2>
          <p className="mx-auto mt-1 max-w-md text-center text-sm text-stone-500">
            Example with sample data — this is what you see once you log in.
          </p>
        </Reveal>
        <Reveal className="mx-auto mt-6 max-w-lg">
          <DemoDashboard locale="en" />
        </Reveal>
      </section>

      {/* Galleria di esempi */}
      <section className="mt-16">
        <Reveal>
          <h2 className="text-center text-xl font-semibold text-stone-900">The right tone for every client</h2>
        </Reveal>
        <Reveal stagger={0.08} className="mt-6 grid gap-4 sm:grid-cols-2">
          {galleryMessages.map((message, i) => (
            <div
              key={i}
              className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-700 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className={`mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${message.badgeClass}`}>
                {message.tone}
              </span>
              <p>{message.text}</p>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Come funziona */}
      <section className="mt-16">
        <Reveal>
          <h2 className="text-center text-xl font-semibold text-stone-900">How it works</h2>
        </Reveal>
        <Reveal stagger={0.12} className="mt-6 grid gap-6 sm:grid-cols-3">
          {[
            { step: "1", title: "Import", text: "Upload invoices and clients from CSV or Excel, or add them as you go." },
            { step: "2", title: "Activate or generate", text: "Let INCASSA send reminders by email on its own, or generate a message whenever you want." },
            { step: "3", title: "Track it from the dashboard", text: "Today's deadlines, recovery rate, and a history of everything you've sent." },
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
        <p className="mt-2 text-4xl font-bold">€19.90</p>
        <p className="mt-1 text-sm text-stone-300">per month, 7-day free trial</p>
        <p className="mt-3 inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
          No limit on clients, invoices or messages
        </p>
        <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm text-stone-200">
          <li>✓ Unlimited clients, invoices and messages</li>
          <li>✓ Dashboard with deadlines and recovery rate</li>
          <li>✓ AI reminders in 4 tones, for WhatsApp and email</li>
          <li>✓ Automatic email reminders (optional)</li>
          <li>✓ CSV/Excel import for invoices and clients</li>
          <li>✓ Communication history per client</li>
          <li>✓ Expenses and estimated net balance</li>
        </ul>
        <div className="mt-8">
          <Link
            href="/en/signup"
            className="inline-block rounded-lg bg-white px-6 py-3 text-base font-semibold text-stone-900 shadow-lg transition-transform hover:bg-stone-100 active:scale-[0.98]"
          >
            Start free trial
          </Link>
        </div>
      </Reveal>

      {/* FAQ */}
      <section className="mt-16">
        <Reveal>
          <h2 className="text-center text-xl font-semibold text-stone-900">Frequently asked questions</h2>
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
        <Link href="/en/signup" className={primaryButton}>
          Start your 7-day free trial
        </Link>
      </Reveal>

      {/* Kit Incassa - offerta secondaria */}
      <Reveal className="mt-16 rounded-xl border border-stone-200 bg-stone-50 p-6 text-center sm:p-8">
        <h2 className="text-lg font-semibold text-stone-900">Just need a few ready-made messages?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
          The Kit Incassa gives you 37 ready-to-send messages you can copy and paste, in 4
          different tones. One-time payment, no subscription.
        </p>
        <div className="mt-4">
          <CheckoutButton
            locale="en"
            className="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:bg-stone-700 active:scale-[0.98] disabled:opacity-60"
          />
        </div>
      </Reveal>

      <footer className="mt-16 border-t border-stone-200 pt-6 text-center text-xs text-stone-400">
        <p>© {new Date().getFullYear()} INCASSA. All rights reserved.</p>
        <p className="mt-1">INCASSA is not affiliated with WhatsApp Inc. WhatsApp is a registered trademark of WhatsApp LLC.</p>
        <p className="mt-2">
          Questions? Email us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="underline underline-offset-2 hover:text-stone-600">
            {SUPPORT_EMAIL}
          </a>{" "}
          or via certified email (PEC) at{" "}
          <a href={`mailto:${PEC_EMAIL}`} className="underline underline-offset-2 hover:text-stone-600">
            {PEC_EMAIL}
          </a>
        </p>
        <p className="mt-2 space-x-3">
          <Link href="/en/privacy" className="underline underline-offset-2 hover:text-stone-600">
            Privacy
          </Link>
          <Link href="/en/termini" className="underline underline-offset-2 hover:text-stone-600">
            Terms &amp; Conditions
          </Link>
          <Link href="/en/recesso" className="underline underline-offset-2 hover:text-stone-600">
            Right of withdrawal
          </Link>
        </p>
      </footer>
    </main>
  );
}

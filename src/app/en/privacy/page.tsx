import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — INCASSA",
};

const SUPPORT_EMAIL = "viverevivi37@gmail.com";
const PEC_EMAIL = "supporto@pec.incassa.eu";
const LAST_UPDATED = "August 26, 2026";

export default function PrivacyPageEn() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-stone-700">
      <Link href="/en" className="text-sm text-amber-700 underline underline-offset-2">
        ← Back to home
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-stone-900">Privacy Policy</h1>
      <p className="mt-1 text-sm text-stone-400">Last updated: {LAST_UPDATED}</p>
      <p className="mt-2 text-sm text-stone-500">
        This policy covers both the Kit Incassa (one-time purchase) and the INCASSA subscription
        (dashboard with account).
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-stone-900">1. Data controller</h2>
          <p className="mt-2">
            The data controller is Viviane Silva, Italy. For any question about this policy or the
            processing of your data, you can write to{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>{" "}
            or via certified email (PEC) at{" "}
            <a href={`mailto:${PEC_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {PEC_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">2. Data we collect</h2>
          <p className="mt-2">For the Kit Incassa, through the payment page hosted by Stripe, we collect:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Email address</li>
            <li>Payment session identifier and payment status</li>
          </ul>
          <p className="mt-2">For the INCASSA subscription, we also collect:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Email and password for account access</li>
            <li>Billing data and subscription status (managed by Stripe)</li>
            <li>
              The data you enter yourself about your clients (name, phone, email, address) and
              their invoices and quotes (amounts, due dates, numbers, job location), needed to run
              the dashboard and generate reminder messages
            </li>
          </ul>
          <p className="mt-2">
            We never receive or store your payment card details: these are handled entirely by
            Stripe.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">3. Purpose and legal basis</h2>
          <p className="mt-2">
            We process your data to handle payment, provide the product or service requested, and
            offer support (legal basis: performance of a contract, art. 6.1.b GDPR), as well as to
            comply with legal accounting and tax obligations (legal basis: legal obligation, art.
            6.1.c GDPR). Your clients&apos; data that you enter into the dashboard is processed
            solely to provide the service (generating reminder messages): you remain the data
            controller for that data toward your own clients, and we act as data processor on your
            behalf.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">4. Providers and data recipients</h2>
          <p className="mt-2">To provide the service we rely on the following providers, acting as data processors:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Stripe</strong> — payment and subscription processing</li>
            <li><strong>Supabase</strong> — database hosting and account authentication</li>
            <li>
              <strong>Anthropic</strong> — generation of reminder messages via artificial
              intelligence (INCASSA subscription only; receives client name, amount and
              invoice/quote dates, never payment data)
            </li>
            <li><strong>Resend</strong> — sending of transactional emails</li>
            <li><strong>Vercel</strong> — site hosting</li>
          </ul>
          <p className="mt-2">
            Some of these providers may process data outside the European Economic Area, under
            appropriate safeguards described in their respective privacy policies (e.g. standard
            contractual clauses).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">5. Data retention</h2>
          <p className="mt-2">
            We keep your data for as long as needed to manage your purchase or subscription and,
            afterward, for the period required by Italian accounting and tax law. If you delete
            your INCASSA account, your account, subscription access, and all data you entered about
            clients, invoices and quotes are immediately and permanently deleted from our systems.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">6. Your rights</h2>
          <p className="mt-2">
            You have the right to access your data, correct it, request its deletion, restrict or
            object to its processing, and to data portability (GDPR art. 15–22).
          </p>
          <p className="mt-2">
            If you have an INCASSA subscription, you can delete your account and all associated
            data yourself at any time, from Settings inside the dashboard (&quot;Danger zone&quot;
            section). For any other request, or for the Kit Incassa, write to{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>{" "}
            or via PEC at{" "}
            <a href={`mailto:${PEC_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {PEC_EMAIL}
            </a>
            . You also have the right to lodge a complaint with the Italian data protection
            authority, the Garante per la protezione dei dati personali (www.garanteprivacy.it).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">7. Cookies</h2>
          <p className="mt-2">
            This site does not use profiling, analytics or marketing cookies. We only use
            technical cookies necessary to keep your INCASSA subscription session active. Payment
            takes place on a page hosted by Stripe (stripe.com domain), subject to{" "}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-700 underline underline-offset-2"
            >
              Stripe&apos;s privacy policy
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">8. Changes to this policy</h2>
          <p className="mt-2">
            This policy may be updated over time. The most recent version is always available at
            this address.
          </p>
        </section>
      </div>
    </main>
  );
}

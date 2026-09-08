import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions — INCASSA",
};

const SUPPORT_EMAIL = "viverevivi37@gmail.com";
const PEC_EMAIL = "supporto@pec.incassa.eu";
const LAST_UPDATED = "August 26, 2026";

export default function TerminiPageEn() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-stone-700">
      <Link href="/en" className="text-sm text-amber-700 underline underline-offset-2">
        ← Back to home
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-stone-900">Terms &amp; Conditions</h1>
      <p className="mt-1 text-sm text-stone-400">Last updated: {LAST_UPDATED}</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-stone-900">1. The seller</h2>
          <p className="mt-2">
            INCASSA and the Kit Incassa are sold by Viviane Silva, Italy. For any question:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>{" "}
            or via certified email (PEC):{" "}
            <a href={`mailto:${PEC_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {PEC_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">2. The product</h2>
          <p className="mt-2">
            INCASSA is a subscription dashboard that helps small businesses track unpaid invoices
            and generate payment-reminder messages. The Kit Incassa is a digital content bundle (not
            supplied on physical media) made of 37 ready-to-send messages for following up on
            overdue invoices, organized by situation and tone. Prices are shown at checkout in USD
            or EUR depending on the version you purchase from.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">3. Payment and delivery</h2>
          <p className="mt-2">
            Payment is processed through Stripe. Immediately after payment, access is provided
            through a dedicated page and, for the Kit Incassa, a copy is also sent to the email
            address provided at checkout.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">4. Right of withdrawal</h2>
          <p className="mt-2">
            Where EU consumer law applies (Italian Consumer Code, art. 59, para. 1, letter o) —
            Legislative Decree 206/2005), because this involves the supply of digital content not
            on physical media, the standard 14-day withdrawal right for distance contracts{" "}
            <strong>does not apply</strong> once performance has begun with your express consent.
            By completing your purchase and accepting these Terms, you expressly request immediate
            access to the digital content and acknowledge that you consequently lose the right of
            withdrawal, to the extent it would otherwise apply under your jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">5. Voluntary refund guarantee</h2>
          <p className="mt-2">
            Regardless of the above, we offer a voluntary commercial guarantee: if the Kit Incassa
            isn&apos;t right for you, you can request a full refund within 7 days of purchase by
            writing to{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>{" "}
            or via PEC at{" "}
            <a href={`mailto:${PEC_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {PEC_EMAIL}
            </a>
            , no reason required.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">6. Permitted use</h2>
          <p className="mt-2">
            The content is licensed for the buyer&apos;s personal or professional use in their own
            business. Resale, redistribution or publication of the content to third parties, in
            whole or in part, is not permitted.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">7. No legal or financial advice — limitation of liability</h2>
          <p className="mt-2">
            INCASSA and the Kit Incassa provide generic message templates and a tool for tracking
            invoices, for informational and practical purposes only. They do not constitute legal,
            tax, financial, or debt-collection advice of any kind, and we do not guarantee that you
            will actually recover any amount owed to you.
          </p>
          <p className="mt-2">
            <strong>You are solely responsible</strong> for how you use INCASSA and the messages it
            generates or sends — including making sure that your communications with your own
            clients or debtors comply with the laws applicable to you, your business, and your
            clients (for example, rules on debt-collection communications, consumer protection, or
            unsolicited commercial messages in your country or state). This applies whether a
            message is sent manually by you or automatically by the optional automated-reminder
            feature you choose to activate. We are not a debt-collection agency and do not act as
            one.
          </p>
          <p className="mt-2">
            To the maximum extent permitted by applicable law, INCASSA is provided &quot;as
            is&quot;, and we disclaim all liability for any direct or indirect damages, lost
            revenue, or legal claims arising from your use of the service or from communications
            sent through it.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">8. Governing law</h2>
          <p className="mt-2">
            These Terms are governed by Italian law, regardless of the country you access the
            service from. For consumers protected by mandatory local law, any such mandatory
            protections remain unaffected where applicable.
          </p>
        </section>
      </div>
    </main>
  );
}

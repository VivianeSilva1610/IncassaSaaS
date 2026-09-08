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
          <h2 className="text-base font-semibold text-stone-900">
            7. No legal or financial advice — limitation of liability
          </h2>
          <p className="mt-2">
            INCASSA and the Kit Incassa provide generic message templates and a tool for managing
            invoices and payment reminders, for informational and practical purposes only. They do
            not constitute legal, tax, financial, or debt-collection advice of any kind, and we do
            not guarantee that you will actually recover any amount owed to you. INCASSA is not a
            debt-collection agency and does not act as one.
          </p>
          <p className="mt-2">
            <strong>Accuracy of the data you enter.</strong> You are solely responsible for the
            accuracy, completeness, and up-to-date status of the data you enter into the Service —
            including, for example, your clients&apos; names and contact details, invoice amounts,
            due dates, and payment status. INCASSA does not verify or guarantee the correctness of
            that data and is not responsible for incorrect, unwarranted, or embarrassing reminders
            generated or sent because of inaccurate, incomplete, or outdated data you provided. It
            is your responsibility to update invoice status promptly (for example, marking an
            invoice as paid) to avoid sending reminders that are no longer owed.
          </p>
          <p className="mt-2">
            <strong>Content and sending of reminders.</strong> You are solely responsible for the
            content, tone, and consequences of every reminder message sent to your clients through
            INCASSA — whether it was AI-generated, edited by you, and sent manually, or sent
            automatically through the optional automated-sending feature you chose to activate. You
            acknowledge and accept that, once activated, the automated-sending feature generates and
            sends messages based on the data in your account <strong>without human review by you
            before sending</strong>, and that such sending is a direct consequence of the
            configuration you chose and the data you entered or failed to update. You can review,
            modify, pause, or turn off automated sending at any time from your account settings, and
            you remain solely responsible for making sure that every reminder sent — automatically or
            manually — complies with the laws applicable to your own commercial and debt-collection
            communications (including, for example, consumer-protection rules, unsolicited commercial
            communications, and the handling of your clients&apos; personal data).
          </p>
          <p className="mt-2">
            <strong>Indemnification.</strong> You agree to indemnify and hold INCASSA harmless from
            any claim, damages, penalty, cost, or expense (including legal fees) arising from: (i)
            inaccurate, incomplete, or outdated data you entered into the Service; (ii) the content,
            tone, or consequences of reminders sent to your clients, whether manually or through
            automated sending; or (iii) your violation of the laws applicable to your own commercial
            communications.
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

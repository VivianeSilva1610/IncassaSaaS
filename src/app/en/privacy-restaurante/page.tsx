import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Restaurant (draft) — INCASSA",
};

const SUPPORT_EMAIL = "viverevivi37@gmail.com";
const PEC_EMAIL = "supporto@pec.incassa.eu";
const LAST_UPDATED = "October 7, 2026 (draft)";

export default function PrivacyRestauranteEnPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-stone-700">
      <Link href="/en" className="text-sm text-amber-700 underline underline-offset-2">
        ← Back to home
      </Link>

      <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Draft pending legal review.</strong> This text has not yet been validated by a
        lawyer and must not be treated as final or binding until further notice.
      </div>

      <h1 className="mt-6 text-2xl font-bold text-stone-900">
        Privacy Policy — Restaurant Platform
      </h1>
      <p className="mt-1 text-sm text-stone-400">Last updated: {LAST_UPDATED}</p>
      <p className="mt-2 text-sm text-stone-500">
        This policy covers the INCASSA restaurant management platform subscription, including each
        restaurant&apos;s Online Store and its End Customers&apos; orders. It is separate from the{" "}
        <Link href="/en/privacy" className="text-amber-700 underline underline-offset-2">
          Privacy Policy of the Kit Incassa / invoice-collection subscription
        </Link>
        .
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-stone-900">1. Data Controller</h2>
          <p className="mt-2">
            The controller of your personal data is Viviane Silva, Italy. For any question about
            this policy or about how we handle your data, you can write to{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>{" "}
            or by certified mail (PEC) to{" "}
            <a href={`mailto:${PEC_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {PEC_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">2. Data We Collect</h2>
          <p className="mt-2">From the Restaurant Owner and Team Members, we collect:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Email and password for account access</li>
            <li>Restaurant name, chosen slug/address, and any custom domain</li>
            <li>Billing data and subscription status (handled by Stripe)</li>
            <li>
              Data the Restaurant enters to operate: menu and prices, stock, costs, tables, cash
              register data, and data of invited Team Members
            </li>
          </ul>
          <p className="mt-2">From End Customers who place an order through the Online Store, we collect on the Restaurant&apos;s behalf:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Name and phone number</li>
            <li>Delivery address and neighborhood/zone</li>
            <li>Tax ID (CPF/CNPJ), required by the Pix payment provider to process payment</li>
            <li>Order contents (products, quantities, notes, amount)</li>
          </ul>
          <p className="mt-2">
            We do not receive or store full subscription payment card data: this is handled entirely
            by Stripe. Pix payments for End Customer orders are processed entirely by the external
            provider Asaas.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">3. Purpose and Legal Basis</h2>
          <p className="mt-2">
            We process the Restaurant Owner&apos;s and Team Members&apos; data to provide access to
            the Platform, process the subscription payment, and provide support (legal basis:
            performance of a contract, GDPR Art. 6.1.b), as well as to comply with accounting and
            tax obligations required by law (legal basis: legal obligation, GDPR Art. 6.1.c).
          </p>
          <p className="mt-2">
            End Customer data collected through the Online Store is processed solely to allow the
            Restaurant to manage and fulfill the order and to process the related payment. The
            Restaurant remains the controller of this data towards its own End Customers; INCASSA
            acts as a processor on the Restaurant&apos;s behalf (GDPR Art. 28).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">4. Providers and Data Recipients</h2>
          <p className="mt-2">To provide the Service, we rely on the following providers, which act as processors:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Stripe</strong> — processing of the Restaurant&apos;s subscription payments</li>
            <li><strong>Asaas</strong> — processing of End Customer Pix order payments (receives the End Customer&apos;s name, tax ID, and phone number)</li>
            <li><strong>Supabase</strong> — database hosting and account authentication</li>
            <li><strong>Resend</strong> — transactional email delivery</li>
            <li><strong>Vercel</strong> — site hosting and custom domain routing</li>
          </ul>
          <p className="mt-2">
            Some of these providers may process data outside the European Economic Area, based on
            appropriate safeguards described in their respective policies (e.g., standard
            contractual clauses).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">5. Data Retention</h2>
          <p className="mt-2">
            We retain the Restaurant Owner&apos;s data for as long as needed to manage the
            subscription and, afterward, for the period required by applicable accounting and tax
            obligations. End Customer order data is retained for as long as needed to manage the
            order and for the Restaurant&apos;s applicable accounting and tax obligations. If the
            Restaurant Owner deletes their account, data entered on the Platform is deleted as
            described in Section 18 of the Terms of Service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">6. Your Rights</h2>
          <p className="mt-2">
            You have the right to access your data, rectify it, request its deletion, restrict or
            object to its processing, and request data portability (GDPR Arts. 15–22).
          </p>
          <p className="mt-2">
            If you are the Restaurant Owner or a Team Member, you can exercise these rights by
            writing to{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>
            . If you are an End Customer and want to exercise these rights over your order data, you
            can contact the Restaurant where you placed the order directly, or write to the address
            above, which will route the request to the relevant Restaurant. You also have the right
            to lodge a complaint with the Italian Data Protection Authority (www.garanteprivacy.it)
            or your own country&apos;s data protection authority.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">7. Cookies</h2>
          <p className="mt-2">
            This site does not use profiling, analytics, or marketing cookies. We only use technical
            cookies necessary to maintain your account login session. Subscription payment happens
            on a page hosted by Stripe (stripe.com); End Customer order payments happen via Pix
            generated by Asaas.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">8. Changes to This Policy</h2>
          <p className="mt-2">
            This policy may be updated over time. The most recent version is always available at
            this address.
          </p>
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions — Restaurant (draft) — INCASSA",
};

const SUPPORT_EMAIL = "viverevivi37@gmail.com";
const PEC_EMAIL = "supporto@pec.incassa.eu";
const LAST_UPDATED = "October 7, 2026 (draft)";

export default function TerminiRestauranteEnPage() {
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
        Terms and Conditions of Service — Restaurant Platform
      </h1>
      <p className="mt-1 text-sm text-stone-400">Last updated: {LAST_UPDATED}</p>
      <p className="mt-2 text-sm text-stone-500">
        These Terms and Conditions (&quot;Terms&quot;) govern access to and use of the restaurant
        management platform provided by INCASSA (the &quot;Platform&quot; or &quot;Service&quot;),
        available through incassa.eu and the subdomains or custom domains of individual
        restaurants. These Terms are separate and distinct from the{" "}
        <Link href="/en/termini" className="text-amber-700 underline underline-offset-2">
          Terms of the Kit Incassa / invoice-collection subscription
        </Link>
        , which remain unchanged for their respective users.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-stone-900">1. Service Provider</h2>
          <p className="mt-2">
            The Service is provided by Viviane Silva, a natural person based in Catanzaro, Italy
            (&quot;INCASSA&quot;, the &quot;Provider&quot;, or the &quot;Controller&quot;).
          </p>
          <p className="mt-2">
            Email:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>{" "}
            — Certified mail (PEC):{" "}
            <a href={`mailto:${PEC_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {PEC_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">2. Definitions</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>&quot;Platform&quot;</strong> means the multi-tenant restaurant management
              software provided by INCASSA.
            </li>
            <li>
              <strong>&quot;Restaurant&quot;</strong> means the food-service business that
              subscribes to the Service and creates its own space (&quot;tenant&quot;) on the
              Platform.
            </li>
            <li>
              <strong>&quot;Restaurant Owner&quot;</strong> means the natural or legal person who
              creates the Restaurant&apos;s initial Account and is recorded as its owner.
            </li>
            <li>
              <strong>&quot;Team Member&quot;</strong> means a person invited by the Restaurant
              Owner or a Manager to access the Platform with specific permissions.
            </li>
            <li>
              <strong>&quot;Manager&quot;</strong> means a Team Member granted management
              permissions (for example, editing or deleting records and granting the role to other
              Team Members).
            </li>
            <li>
              <strong>&quot;End Customer&quot;</strong> means a person who places an order through
              the Restaurant&apos;s online store without creating an Account on the Platform.
            </li>
            <li>
              <strong>&quot;Online Store&quot;</strong> means the Restaurant&apos;s public page
              (incassa.eu subdomain or custom domain) where End Customers can browse the menu and
              place orders.
            </li>
            <li>
              <strong>&quot;Subscription&quot;</strong> means the paid plan that grants access to
              the Platform&apos;s features reserved for the Restaurant.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">3. Purpose of the Service</h2>
          <p className="mt-2">
            The Platform is a digital operational management tool for restaurants. Depending on the
            plan and the features enabled, it may include, by way of example: menu and product
            catalog management; order management; kitchen workflow organization; stock/inventory
            control; table management; cost tracking; a cash register log; team management with
            differentiated permissions; a public online store allowing End Customers to place and
            pay for orders; a module related to fiscal/tax documents (see Section 11); and, where
            activated by the Restaurant Owner, the ability to connect a custom domain.
          </p>
          <p className="mt-2">
            INCASSA is an organizational and management tool. INCASSA is not a bank, a payment
            institution, a financial intermediary, a law firm, or an accounting firm, and does not
            provide legal, tax, accounting, or financial advice.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">4. Registration, Account and Roles</h2>
          <p className="mt-2">
            To activate a Restaurant on the Platform, the Restaurant Owner must create an Account
            providing accurate, complete, and up-to-date information, including the Restaurant&apos;s
            name and the address (&quot;slug&quot;) chosen for its space.
          </p>
          <p className="mt-2">
            The Restaurant Owner may invite Team Members and grant one or more of them the Manager
            role. The Restaurant Owner is responsible for the actions of invited Team Members, within
            the limits of the permissions actually granted.
          </p>
          <p className="mt-2">
            Login credentials are personal and must not be shared with third parties. The user must
            promptly notify INCASSA of any unauthorized access or suspected compromise of the
            Account.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">5. Domain and Restaurant Identity</h2>
          <p className="mt-2">
            Each Restaurant has a public address in the form incassa.eu/loja/[slug]. Where available
            and enabled by the Restaurant Owner, the Platform allows connecting a custom domain
            owned by the Restaurant, subject to technical verification of control over that domain.
            Management, renewal, and costs of the custom domain remain the responsibility of the
            Restaurant Owner.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">6. Subscription and Pricing</h2>
          <p className="mt-2">
            Access to the Platform&apos;s features reserved for the Restaurant requires a
            Subscription. Price, billing period, included features, and applicable economic
            conditions are clearly disclosed before the purchase is completed.
          </p>
          <p className="mt-2">
            Where applicable, the Subscription may include a free trial period of the duration
            indicated at activation (currently 7 days), after which, unless cancelled, the
            Subscription price will be automatically charged to the payment method provided.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">7. Subscription Payments</h2>
          <p className="mt-2">
            Subscription payments are processed by the external provider Stripe. INCASSA does not
            directly store full payment card data. If a payment is declined, expired, or not
            completed, INCASSA may request an updated payment method and, after appropriate notice
            where required, limit or suspend access to paid features.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">8. End Customer Order Payments</h2>
          <p className="mt-2">
            Where the Restaurant activates the Online Store, End Customer orders may be paid via
            Pix through the external provider Asaas. INCASSA is not a party to the sales contract
            between the Restaurant and the End Customer, does not hold custody of funds related to
            such payments, and does not guarantee the outcome, receipt, or settlement of payment.
            The Restaurant is solely responsible to its End Customers for fulfilling orders, product
            quality, and handling any refunds or complaints related to orders.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">9. Subscription Term, Renewal and Cancellation</h2>
          <p className="mt-2">
            Where the Subscription provides for automatic renewal, it will renew according to the
            billing period indicated at checkout, unless cancelled before renewal through the
            features available in the Account or other channels indicated by INCASSA.
          </p>
          <p className="mt-2">
            Unless otherwise stated or required by mandatory law, cancellation prevents future
            renewals but does not automatically entitle the user to a refund of the period already
            paid. Cancelling the Subscription is not the same as exercising the legal right of
            withdrawal, where applicable (see Section 10).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">10. Consumer Right of Withdrawal</h2>
          <p className="mt-2">
            <strong>10.1 14-day period.</strong> Where the Restaurant Owner qualifies as a
            Consumer, for distance contracts they have, subject to statutory exceptions, 14 days to
            withdraw from the contract without giving any reason, pursuant to Articles 52 et seq. of
            the Italian Consumer Code.
          </p>
          <p className="mt-2">
            <strong>10.2 Starting the Service during the withdrawal period.</strong> Where the
            Consumer wants to use the Platform immediately, including during a free trial, before
            the withdrawal period expires, they may expressly request that performance of the
            Service begin during that period. Where provided by law, if the Consumer withdraws after
            expressly requesting that performance begin, they may be required to pay an amount
            proportionate to what was supplied up to the time of withdrawal.
          </p>
          <p className="mt-2">
            <strong>10.3 How to exercise withdrawal.</strong> The Consumer may communicate their
            decision to withdraw through an explicit statement sent to{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>
            , indicating at least the information needed to identify the Account and the Restaurant.
            INCASSA will send, without undue delay, a confirmation on a durable medium (email)
            containing the information required by law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">11. Fiscal Module — Current Status and Limits</h2>
          <p className="mt-2">
            The Platform may include a module related to fiscal/tax documents (for example, fiscal
            classification of products, document drafts, or, in the future, issuance of documents
            such as the Brazilian NFC-e). <strong>Until INCASSA explicitly communicates
            otherwise</strong>, these features may operate in a simulated or test mode and do not
            constitute the issuance of valid fiscal documents, do not replace the Restaurant&apos;s
            tax obligations before the competent authorities, and do not replace the work of a
            licensed accountant or tax advisor.
          </p>
          <p className="mt-2">
            The Restaurant remains solely responsible for complying with its own tax, accounting,
            and documentation obligations under the laws of its country, even when using tools or
            automations made available by the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">
            12. Data Entered by the Restaurant and End Customers
          </h2>
          <p className="mt-2">
            INCASSA does not automatically verify the accuracy, completeness, or lawfulness of data
            entered by the Restaurant or collected from End Customers through the Online Store,
            except where expressly stated for a specific feature. The Restaurant is responsible for
            ensuring that such data is accurate, up to date, and collected in compliance with
            applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">13. Acceptable Use</h2>
          <p className="mt-2">The Restaurant Owner and Team Members agree not to use the Platform:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>for unlawful or fraudulent activity;</li>
            <li>to harass, threaten, or deceive third parties, including End Customers;</li>
            <li>to intentionally enter false information, including about products, prices, or payments;</li>
            <li>to compromise the security, availability, or integrity of the Platform;</li>
            <li>to attempt unauthorized access to other tenants&apos; spaces;</li>
            <li>to copy, decompile, or misuse the software and infrastructure, beyond what the law allows;</li>
            <li>in violation of third-party rights.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">14. Service Availability</h2>
          <p className="mt-2">
            INCASSA takes reasonable measures to ensure continuity and security of the Service.
            However, interruptions may occur due to maintenance, updates, technical issues,
            third-party services (including Stripe, Asaas, and DNS/hosting providers), force
            majeure, or security needs.
          </p>
          <p className="mt-2">
            Nothing in these Terms excludes or limits any mandatory rights granted to the Consumer.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">15. Changes to the Service</h2>
          <p className="mt-2">
            INCASSA may update or modify Platform features for technical, security, regulatory,
            operational, or product-improvement reasons. Where a change significantly affects a
            service already purchased, applicable notice obligations and any user rights under
            applicable law will be respected.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">16. Intellectual Property</h2>
          <p className="mt-2">
            Software, design, trademarks, logos, text, graphic elements, databases, documentation,
            and other content belonging to INCASSA are protected under applicable intellectual
            property laws. The Subscription grants only a personal, limited, non-exclusive,
            non-transferable right to use the Service in accordance with these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">17. Restaurant Data and Processing Roles</h2>
          <p className="mt-2">
            The Restaurant retains its rights over the data and content it enters on the Platform
            (menu, prices, kitchen/stock data) and remains the controller of the personal data of
            its own End Customers collected through the Online Store (name, phone number, delivery
            address, tax identification document where required for payment). INCASSA acts as a
            processor of such data on behalf of the Restaurant, to the extent necessary to provide
            the Service.
          </p>
          <p className="mt-2">
            Processing of the Restaurant Owner&apos;s and Team Members&apos; personal data is
            governed by the{" "}
            <Link href="/en/privacy-restaurante" className="text-amber-700 underline underline-offset-2">
              Privacy Policy — Restaurant Platform
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">18. Data Export and Deletion</h2>
          <p className="mt-2">
            Where technically available, the Restaurant may export its own data using the features
            offered by the Platform. Upon termination of the Account, data will be handled in
            accordance with the Privacy Policy, applicable law, and any legal retention obligations.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">19. Account Suspension</h2>
          <p className="mt-2">
            INCASSA may suspend or limit access to the Account where reasonably necessary, in
            particular in the event of: serious breach of these Terms; fraudulent or unlawful use;
            risk to the security of the Platform, other tenants, or other users; non-payment; or an
            obligation imposed by law or a competent authority.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">20. Liability</h2>
          <p className="mt-2">
            INCASSA provides a technological tool to support the Restaurant&apos;s business
            management. INCASSA does not guarantee receipt of order payments, the fiscal validity
            of documents generated through the fiscal module described in Section 11, or the
            Restaurant&apos;s commercial success.
          </p>
          <p className="mt-2">
            <strong>Accuracy of entered data.</strong> The Restaurant is solely responsible for the
            accuracy, completeness, and timeliness of data it enters or collects through the
            Service, including prices, availability, fiscal data, and End Customer data. INCASSA
            does not verify or guarantee the accuracy of such data.
          </p>
          <p className="mt-2">
            Towards Restaurant Owners acting within their business activity, and to the extent
            permitted by law, INCASSA is not liable for indirect damages, loss of business
            opportunity, loss of profit, or consequences arising from inaccurate information entered
            by the user or from use of the Service in breach of these Terms.
          </p>
          <p className="mt-2">
            No limitation or exclusion under these Terms applies where liability cannot be excluded
            or limited by law, nor does it limit any mandatory rights of the Consumer.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">21. Indemnification — Restaurant Owner</h2>
          <p className="mt-2">
            To the extent permitted by law, a Restaurant Owner acting within their business activity
            agrees to indemnify INCASSA against third-party claims, including from End Customers,
            arising from unlawful use of the Service attributable to the Restaurant, from entering
            data that violates third-party rights, from failure to fulfill or the quality of orders,
            or from the Restaurant&apos;s failure to meet its own tax obligations.
          </p>
          <p className="mt-2">This provision does not apply to the extent the damage is attributable to INCASSA.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">22. Support</h2>
          <p className="mt-2">
            Support requests can be sent to{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">23. Changes to These Terms</h2>
          <p className="mt-2">
            INCASSA may modify these Terms for regulatory, technical, security reasons, or due to
            substantial changes to the Service. Where required by law or where the change
            significantly affects the ongoing contractual relationship, the user will be notified
            with reasonable advance notice.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">24. Governing Law</h2>
          <p className="mt-2">
            These Terms are governed by Italian law, regardless of the country where the Restaurant
            or its End Customers are established or resident. For the Consumer, mandatory consumer
            protection provisions and any non-waivable jurisdiction under applicable law remain
            unaffected. For users acting within their business activity, the competent court is that
            of Catanzaro, unless otherwise required by mandatory law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">25. Severability</h2>
          <p className="mt-2">
            Should any provision of these Terms be held invalid, ineffective, or unenforceable, the
            remaining provisions will continue in effect to the extent permitted by law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">26. Contact</h2>
          <p className="mt-2">
            For questions about these Terms: INCASSA — Email:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>{" "}
            — PEC:{" "}
            <a href={`mailto:${PEC_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {PEC_EMAIL}
            </a>{" "}
            — Registered location: Catanzaro, Italy.
          </p>
        </section>

        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-base font-semibold text-stone-900">
            Specific approval under Articles 1341 and 1342 of the Italian Civil Code
          </h2>
          <p className="mt-2">
            Under Articles 1341 and 1342 of the Italian Civil Code, the user declares to have
            carefully read and specifically approved the following clauses: Section 9 (term,
            renewal, and cancellation); Section 11 (fiscal module — current status and limits);
            Section 12 (data entered by the Restaurant and End Customers); Section 14 (service
            availability); Section 15 (changes to the Service); Section 19 (account suspension);
            Section 20 (limitations of liability); Section 21 (indemnification); Section 23
            (changes to these Terms); Section 24 (governing law and jurisdiction).
          </p>
          <p className="mt-2 text-xs text-stone-500">
            This specific approval is requested separately during account creation, where
            applicable.
          </p>
        </section>
      </div>
    </main>
  );
}

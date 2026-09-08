import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions — INCASSA",
};

const SUPPORT_EMAIL = "viverevivi37@gmail.com";
const PEC_EMAIL = "supporto@pec.incassa.eu";
const LAST_UPDATED = "September 8, 2026";

export default function TerminiPageEn() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-stone-700">
      <Link href="/en" className="text-sm text-amber-700 underline underline-offset-2">
        ← Back to home
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-stone-900">Terms &amp; Conditions of Service</h1>
      <p className="mt-1 text-sm text-stone-400">Last updated: {LAST_UPDATED}</p>
      <p className="mt-2 text-sm text-stone-500">
        These Terms &amp; Conditions (&quot;Terms&quot;) govern access to and use of the INCASSA
        platform, available at incassa.eu, as well as the purchase of the digital product known as
        &quot;Kit Incassa&quot;. Using the Services means you accept these Terms in the manner
        indicated during signup or purchase.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-stone-900">1. Service provider</h2>
          <p className="mt-2">
            The INCASSA Service is provided by Viviane Silva, a sole individual, based in
            Catanzaro, Italy (referred to as &quot;INCASSA&quot;, &quot;Provider&quot;, or
            &quot;we&quot;).
          </p>
          <p className="mt-2">
            Email:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>{" "}
            — certified email (PEC):{" "}
            <a href={`mailto:${PEC_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {PEC_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">2. Definitions</h2>
          <p className="mt-2">For the purposes of these Terms:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>&quot;INCASSA&quot;</strong> or <strong>&quot;Platform&quot;</strong> means
              the software made available online by the Provider.
            </li>
            <li>
              <strong>&quot;Service&quot;</strong> means the SaaS functionality made available
              through INCASSA.
            </li>
            <li>
              <strong>&quot;User&quot;</strong> means any individual or entity that accesses or uses
              INCASSA.
            </li>
            <li>
              <strong>&quot;Consumer&quot;</strong> means an individual acting for purposes outside
              their trade, business, craft, or profession, under applicable law.
            </li>
            <li>
              <strong>&quot;Business User&quot;</strong> means a User who uses INCASSA within their
              trade, business, craft, or profession.
            </li>
            <li>
              <strong>&quot;Account&quot;</strong> means the User&apos;s personal area.
            </li>
            <li>
              <strong>&quot;Subscription&quot;</strong> means the paid plan giving access to the
              features included in that plan.
            </li>
            <li>
              <strong>&quot;Kit Incassa&quot;</strong> means any digital materials or content
              available for separate purchase.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">3. Purpose of the Service</h2>
          <p className="mt-2">
            INCASSA is a digital platform designed to help organize and track invoices,
            receivables, due dates, payments, and follow-up (reminder) activity.
          </p>
          <p className="mt-2">
            Depending on the plan and available features, the Platform may allow, for example:
            recording and managing invoice information; tracking due dates; marking invoices as
            paid, overdue, or outstanding; managing client information; preparing and/or managing
            payment reminders; automating certain activities; viewing dashboards, statistics, or
            reports; and using features assisted by automated systems or artificial intelligence,
            where available.
          </p>
          <p className="mt-2">
            INCASSA is an organizational and management tool. INCASSA is not a bank, a payment
            institution, a financial intermediary, a debt-collection agency, a law firm, or an
            accounting firm, and does not provide legal, tax, accounting, or financial advice.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">4. Registration and Account</h2>
          <p className="mt-2">
            To use certain features, the User must create an Account by providing accurate,
            complete, and up-to-date information.
          </p>
          <p className="mt-2">
            The User is responsible for keeping their credentials secure and for activity carried
            out through their Account. Credentials are personal and must not be shared with third
            parties, except where a subscribed plan expressly provides for it.
          </p>
          <p className="mt-2">
            The User must promptly notify INCASSA of any unauthorized access or suspected
            compromise of the Account. INCASSA may take reasonable security measures, including
            temporarily suspending access, if it detects potentially fraudulent or risky activity.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">5. Subscriptions and pricing</h2>
          <p className="mt-2">
            Some INCASSA features may require a paid Subscription. Price, billing period, included
            features, and applicable economic terms are clearly shown before you complete a
            purchase. The price shown at the time of the order is the price applicable to the
            Subscription purchased, subject to manifest errors.
          </p>
          <p className="mt-2">
            Before the contract is concluded, the User is informed of the Subscription&apos;s
            duration and whether it renews automatically.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">6. Payments</h2>
          <p className="mt-2">
            Payments may be handled through third-party payment providers shown at checkout.
            INCASSA does not directly store full payment-card data when payment is processed by the
            external provider. The User is responsible for providing valid, up-to-date payment
            information.
          </p>
          <p className="mt-2">
            If a payment is declined, expired, or not completed, INCASSA may request that the
            payment method be updated and, after appropriate notice where required, may restrict or
            suspend access to paid features.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">7. Duration, renewal and cancellation</h2>
          <p className="mt-2">
            The Subscription lasts for the period shown at purchase. Where a plan renews
            automatically, the Subscription will renew at the frequency shown at checkout, unless
            cancelled before renewal through the means made available to the User.
          </p>
          <p className="mt-2">
            The User can turn off automatic renewal through the features available in their
            Account, or through any other channel INCASSA makes available.
          </p>
          <p className="mt-2">
            Unless otherwise stated or required by a mandatory legal right, cancellation prevents
            future renewals but does not automatically entitle the User to a refund of a period
            already paid for. The User will keep access to the features included in their plan
            until the end of the period already paid for, subject to any lawful suspension under
            these Terms.
          </p>
          <p className="mt-2">
            Cancelling a Subscription is not the same as exercising the legal right of withdrawal,
            where that right applies (see Section 8).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">8. Consumer right of withdrawal</h2>
          <p className="mt-2">
            <strong>8.1 The 14-day period.</strong> Where the User qualifies as a Consumer, for
            contracts concluded at a distance you have, subject to the exceptions set out by law, 14
            days to withdraw from the contract without giving any reason. For service contracts, the
            period runs from the conclusion of the contract. This is governed, where EU/Italian
            consumer law applies, by the relevant provisions of the Italian Consumer Code
            (implementing Directive 2011/83/EU); consumers in other jurisdictions may have
            equivalent rights under their own local law.
          </p>
          <p className="mt-2">
            <strong>8.2 Starting the Service during the withdrawal period.</strong> If a Consumer
            wants to use INCASSA immediately, before the withdrawal period ends, they may expressly
            request that performance of the Service begin during that period. Starting the Service
            immediately does not automatically cause the loss of the right of withdrawal. Where the
            law provides for it, if the Consumer withdraws after expressly requesting that
            performance begin, they may be required to pay an amount proportional to what was
            supplied up to the moment of withdrawal. Loss of the right of withdrawal for a paid
            service contract can occur, under the applicable exception, after performance is fully
            completed and the required consent and acknowledgment conditions are met.
          </p>
          <p className="mt-2">
            <strong>8.3 How to exercise withdrawal.</strong> The Consumer can communicate their
            decision to withdraw through an explicit statement sent to{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>
            , including at least the information needed to identify the User and the contract. The
            Consumer may also use any standard withdrawal form provided under applicable law,
            without being required to.
          </p>
          <p className="mt-2">
            <strong>8.4 Online withdrawal function.</strong> For distance contracts concluded
            through an online interface, INCASSA provides Consumers, where and to the extent
            required by applicable law, with an easily accessible online function to exercise the
            right of withdrawal, available at all times at{" "}
            <Link href="/en/recesso" className="text-amber-700 underline underline-offset-2">
              incassa.eu/en/recesso
            </Link>
            . After confirming an online withdrawal, INCASSA will send, without undue delay, a
            confirmation on a durable medium (email) containing the information required by law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">9. Kit Incassa and digital content</h2>
          <p className="mt-2">
            Where available, the Kit Incassa can be purchased separately from the SaaS Service. The
            Kit may include files, templates, guides, documents, or other digital content.
          </p>
          <p className="mt-2">
            Where the Kit is digital content supplied on a non-material medium, performance may
            begin immediately after purchase. Where required by law, before immediate supply
            begins, the Consumer is asked for their prior express consent to performance starting
            during the withdrawal period and acknowledgment that they will consequently lose the
            right of withdrawal, and the corresponding confirmation required by applicable law is
            provided. Under the digital-content exception found in EU consumer law (and its
            Italian implementation, art. 59, letter o) of the Consumer Code), losing the right of
            withdrawal for non-material digital content is conditioned on specific requirements,
            including express consent, acknowledgment of the loss of the right, and confirmation.
          </p>
          <p className="mt-2">
            Regardless of the above, for the Kit Incassa we also offer a voluntary commercial
            guarantee: if the Kit Incassa isn&apos;t right for you, you can request a full refund
            within 7 days of purchase by writing to{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>
            , no reason required.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">
            10. Invoices, receivables and data you enter
          </h2>
          <p className="mt-2">
            INCASSA does not automatically verify the existence, validity, enforceability, or legal
            correctness of invoices or receivables recorded by the User, except where expressly
            stated for a specific feature.
          </p>
          <p className="mt-2">
            The User is responsible for the information entered into the Platform and must verify
            that it is correct and up to date. The status shown for invoices, payments, or
            receivables also depends on the data available and the information provided or
            confirmed by the User and/or any active integrations.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">11. Payment reminders</h2>
          <p className="mt-2">
            INCASSA may provide tools to prepare, schedule, or manage communications relating to
            payments and invoices. The User is responsible for checking, before use, that the
            recipient, amount, due date, and other relevant information are correct.
          </p>
          <p className="mt-2">
            The User must use the reminder features in compliance with the law, the rights of
            recipients, and the rules applicable to commercial and contractual communications.
            INCASSA does not guarantee that sending a reminder will result in an invoice being paid.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">12. Automation and artificial intelligence</h2>
          <p className="mt-2">
            Some INCASSA features may use automated systems or artificial-intelligence technology.
            These tools may, for example, assist with generating, organizing, classifying, or
            processing information and communications.
          </p>
          <p className="mt-2">
            Automatically generated output may contain errors, omissions, or information not suited
            to the User&apos;s specific situation. The User must therefore verify relevant
            information before relying on it for professional, financial, tax, or legal decisions.
            INCASSA does not replace the professional judgment of the User or of accountants, tax
            advisors, lawyers, or other qualified professionals.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">13. Permitted use</h2>
          <p className="mt-2">The User agrees not to use INCASSA:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>for unlawful or fraudulent activity;</li>
            <li>to harass, threaten, or deceive third parties;</li>
            <li>to send unlawful communications;</li>
            <li>to intentionally enter false information;</li>
            <li>to compromise the security, availability, or integrity of the Platform;</li>
            <li>to attempt unauthorized access;</li>
            <li>
              to copy, decompile, or improperly exploit the software and infrastructure, beyond
              what is permitted by law;
            </li>
            <li>in violation of third-party rights.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">14. Service availability</h2>
          <p className="mt-2">
            INCASSA takes reasonable measures to keep the Service continuous and secure. However,
            interruptions may occur due to maintenance, updates, technical issues, third-party
            services, force majeure, or security needs.
          </p>
          <p className="mt-2">
            Nothing in these Terms excludes or limits any mandatory right of the Consumer, including
            legal guarantees applicable to services and digital content.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">15. Changes to the Service</h2>
          <p className="mt-2">
            INCASSA may update or change Platform features for technical, security, regulatory,
            operational, or product-improvement reasons. Where a change significantly affects a
            service already purchased, we will meet any information obligations and User rights
            required by applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">16. Intellectual property</h2>
          <p className="mt-2">
            Software, design, trademarks, logos, text, graphic elements, databases, documentation,
            and other content belonging to INCASSA are protected under applicable intellectual
            property law.
          </p>
          <p className="mt-2">
            Subscribing grants only a personal, limited, non-exclusive, non-transferable right to
            use the Service under these Terms. No ownership right in the software is transferred to
            the User.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">17. User data</h2>
          <p className="mt-2">
            The User keeps their rights over their own data and content entered into the Platform.
            The User grants INCASSA the technical permissions strictly necessary to host, process,
            transmit, and otherwise handle that data to the extent necessary to provide the Service
            and as required by applicable law.
          </p>
          <p className="mt-2">
            Personal data processing is governed by INCASSA&apos;s{" "}
            <Link href="/en/privacy" className="text-amber-700 underline underline-offset-2">
              Privacy Notice
            </Link>{" "}
            and, where necessary for B2B relationships or processing carried out on the User&apos;s
            behalf, by any further applicable agreements.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">18. Data export and deletion</h2>
          <p className="mt-2">
            Where technically available and provided by the Service, the User can export their own
            data using the features offered by the Platform.
          </p>
          <p className="mt-2">
            If the Account is closed, data will be handled as described in the Privacy Notice, under
            applicable law, and under any legal retention obligations. Closing the Service does not
            necessarily mean all information is deleted immediately where retention is necessary
            for legal obligations, security, accounting, disputes, or the protection of rights.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">19. Account suspension</h2>
          <p className="mt-2">
            INCASSA may suspend or restrict access to an Account when reasonably necessary, in
            particular in case of: a serious breach of these Terms; fraudulent or unlawful use; a
            risk to the security of the Platform or other users; non-payment; or an obligation
            imposed by law or a competent authority.
          </p>
          <p className="mt-2">
            Where possible, and subject to urgent, security, or legal needs, the User will be
            informed of the suspension and the reasons for it.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">20. Liability</h2>
          <p className="mt-2">
            INCASSA provides a technology tool to support the management of the User&apos;s
            activity. INCASSA does not guarantee payment of invoices or recovery of receivables
            recorded on the Platform. INCASSA is not responsible for the solvency of the User&apos;s
            clients, nor for business decisions made on the basis of data held on the Platform.
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
            you remain solely responsible for making sure that every reminder sent — automatically
            or manually — complies with the laws applicable to your own commercial and
            debt-collection communications (including, for example, consumer-protection rules,
            unsolicited commercial communications, and the handling of your clients&apos; personal
            data).
          </p>
          <p className="mt-2">
            Toward Business Users, and to the extent permitted by law, INCASSA is not liable for
            indirect damages, lost business opportunity, lost profit, or consequences arising from
            inaccurate information entered by the User or from using the Service in breach of these
            Terms.
          </p>
          <p className="mt-2">
            No limitation or exclusion in these Terms applies where liability cannot be excluded or
            limited by law. In particular, nothing in these Terms limits any mandatory right of the
            Consumer.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">21. Indemnification — Business Users</h2>
          <p className="mt-2">
            To the extent permitted by law, the Business User agrees to indemnify and hold INCASSA
            harmless from third-party claims arising from unlawful use of the Service attributable
            to the User, from entering data that violates third-party rights, or from sending
            unlawful communications through the tools made available on the Platform, as well as
            from inaccurate, incomplete, or outdated data entered into the Service and from the
            content, tone, or consequences of reminders sent to their clients, whether manually or
            through automated sending.
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
            . INCASSA will try to handle requests within a reasonable time given their nature and
            complexity.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">23. Changes to these Terms</h2>
          <p className="mt-2">
            INCASSA may amend these Terms for regulatory, technical, security reasons, or due to
            substantial changes to the Service. Where required by law, or where a change
            significantly affects an ongoing contractual relationship, the User will be given
            reasonable advance notice.
          </p>
          <p className="mt-2">
            Changes will not retroactively limit rights the User has already acquired, except where
            permitted by law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">24. Governing law</h2>
          <p className="mt-2">
            These Terms are governed by Italian law, regardless of the country you access the
            Service from. For Consumers, any mandatory protective provisions applicable under your
            own local law, and any mandatory venue, remain unaffected. For Business Users, the
            competent court is that of Catanzaro, Italy, unless a mandatory legal provision states
            otherwise.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">25. Severability</h2>
          <p className="mt-2">
            If any provision of these Terms is held invalid, ineffective, or unenforceable, the
            remaining provisions will continue to apply to the extent permitted by law.
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
            — Based in: Catanzaro, Italy.
          </p>
        </section>

        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-base font-semibold text-stone-900">
            Specific approval under Italian Civil Code arts. 1341–1342
          </h2>
          <p className="mt-2">
            For Users subject to Italian law, under arts. 1341 and 1342 of the Italian Civil Code,
            the User states that they have carefully read and specifically approve the following
            clauses: Section 7 (duration, renewal and cancellation); Sections 10 and 11 (data you
            enter and reminders); Section 12 (automation and artificial intelligence); Section 14
            (Service availability); Section 15 (changes to the Service); Section 19 (account
            suspension); Section 20 (limitation of liability); Section 21 (indemnification);
            Section 23 (changes to these Terms); Section 24 (governing law and venue).
          </p>
          <p className="mt-2 text-xs text-stone-500">
            This specific approval is requested separately when creating an account or completing a
            purchase, where applicable.
          </p>
        </section>
      </div>
    </main>
  );
}

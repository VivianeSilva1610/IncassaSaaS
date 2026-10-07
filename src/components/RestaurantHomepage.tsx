import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";

const SUPPORT_EMAIL = "viverevivi37@gmail.com";

type Problem = { title: string; text: string };
type Feature = { title: string; text: string };
type Step = { step: string; title: string; text: string };
type Faq = { q: string; a: string };

export type HomepageContent = {
  login: string;
  badge: string;
  heroTitle: string;
  heroText: string;
  problemsTitle: string;
  problems: readonly Problem[];
  featuresTitle: string;
  features: readonly Feature[];
  stepsTitle: string;
  steps: readonly Step[];
  pricingTitle: string;
  pricingText: string;
  pricingBullets: readonly string[];
  pricingCta: string;
  faqTitle: string;
  faqs: readonly Faq[];
  finalCta: string;
  footerRights: string;
};

export function RestaurantHomepage({
  content,
  langLinks,
  loginHref = "/login",
  legalLinks,
}: {
  content: HomepageContent;
  langLinks: { href: string; label: string }[];
  loginHref?: string;
  legalLinks: { privacyHref: string; termsHref: string; privacyLabel: string; termsLabel: string };
}) {
  const contactHref = `mailto:${SUPPORT_EMAIL}`;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between text-sm">
        <Image src="/logo.png" alt="INCASSA" width={96} height={96} className="rounded-full" priority />
        <div className="flex items-center gap-4">
          {langLinks.map((l) => (
            <Link key={l.href} href={l.href} className="text-stone-400 hover:text-stone-900">
              {l.label}
            </Link>
          ))}
          <Link href={loginHref} className="text-stone-500 hover:text-stone-900">
            {content.login}
          </Link>
        </div>
      </div>

      <section className="relative mt-10 overflow-hidden text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-300/30 blur-3xl"
        />
        <Reveal mode="load" stagger={0.1} className="relative">
          <p className="mb-3 inline-block rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            {content.badge}
          </p>
          <h1 className="text-3xl font-bold leading-tight text-stone-900 sm:text-4xl">{content.heroTitle}</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-stone-600">{content.heroText}</p>
        </Reveal>
      </section>

      <section className="mt-16">
        <Reveal>
          <h2 className="text-center text-xl font-semibold text-stone-900">{content.problemsTitle}</h2>
        </Reveal>
        <Reveal stagger={0.1} className="mt-6 grid gap-6 sm:grid-cols-3">
          {content.problems.map((p) => (
            <div key={p.title} className="rounded-xl border border-stone-200 bg-stone-50 p-5">
              <h3 className="font-semibold text-stone-900">{p.title}</h3>
              <p className="mt-1 text-sm text-stone-600">{p.text}</p>
            </div>
          ))}
        </Reveal>
      </section>

      <section className="mt-16">
        <Reveal>
          <h2 className="text-center text-xl font-semibold text-stone-900">{content.featuresTitle}</h2>
        </Reveal>
        <Reveal stagger={0.1} className="mt-6 grid gap-6 sm:grid-cols-2">
          {content.features.map((f) => (
            <div key={f.title} className="rounded-xl border border-stone-200 bg-white p-4">
              <h3 className="font-semibold text-stone-900">{f.title}</h3>
              <p className="mt-1 text-sm text-stone-600">{f.text}</p>
            </div>
          ))}
        </Reveal>
      </section>

      <section className="mt-16">
        <Reveal>
          <h2 className="text-center text-xl font-semibold text-stone-900">{content.stepsTitle}</h2>
        </Reveal>
        <Reveal stagger={0.12} className="mt-6 grid gap-6 sm:grid-cols-3">
          {content.steps.map((s) => (
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

      <Reveal className="mt-16 rounded-xl bg-gradient-to-b from-stone-900 to-stone-800 p-6 text-center text-white shadow-xl sm:p-10">
        <h2 className="text-xl font-semibold">{content.pricingTitle}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-stone-300">{content.pricingText}</p>
        <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm text-stone-200">
          {content.pricingBullets.map((b) => (
            <li key={b}>✓ {b}</li>
          ))}
        </ul>
        <div className="mt-8">
          <a
            href={contactHref}
            className="inline-block rounded-lg bg-white px-6 py-3 text-base font-semibold text-stone-900 shadow-lg transition-transform hover:bg-stone-100 active:scale-[0.98]"
          >
            {content.pricingCta}
          </a>
        </div>
      </Reveal>

      <section className="mt-16">
        <Reveal>
          <h2 className="text-center text-xl font-semibold text-stone-900">{content.faqTitle}</h2>
        </Reveal>
        <Reveal stagger={0.05} className="mt-6 space-y-3">
          {content.faqs.map((f) => (
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
        <a
          href={contactHref}
          className="rounded-lg bg-gradient-to-b from-amber-500 to-orange-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-orange-900/20 transition-transform hover:from-amber-400 hover:to-orange-500 active:scale-[0.98]"
        >
          {content.finalCta}
        </a>
      </Reveal>

      <footer className="mt-16 border-t border-stone-200 pt-6 text-center text-xs text-stone-400">
        <p>© {new Date().getFullYear()} INCASSA. {content.footerRights}</p>
        <p className="mt-2 space-x-3">
          <Link href={legalLinks.privacyHref} className="underline underline-offset-2 hover:text-stone-600">
            {legalLinks.privacyLabel}
          </Link>
          <Link href={legalLinks.termsHref} className="underline underline-offset-2 hover:text-stone-600">
            {legalLinks.termsLabel}
          </Link>
        </p>
      </footer>
    </main>
  );
}

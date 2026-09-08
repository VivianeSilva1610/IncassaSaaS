import Link from "next/link";
import { getKitCategories, getKitMessages } from "@/lib/kit-content";
import { verifyPaidSession } from "@/lib/verify-access";
import { MessageCard } from "@/components/MessageCard";

const strings = {
  it: {
    notFoundTitle: "Accesso non trovato",
    notFoundBody:
      "Non siamo riusciti a verificare il tuo acquisto. Se hai appena pagato, controlla la tua " +
      "email — ti abbiamo inviato il link di accesso. Altrimenti, prova ad acquistare di nuovo.",
    torna: "Torna alla home",
    title: "Il tuo Kit Incassa",
    subtitle: "37 messaggi pronti, organizzati per situazione. Copia, incolla, personalizza e invia.",
    scarica: "Scarica tutti i messaggi (.txt)",
    inviatoCopia: (email: string) => `Ti abbiamo anche inviato una copia via email a ${email}`,
  },
  en: {
    notFoundTitle: "Access not found",
    notFoundBody:
      "We couldn't verify your purchase. If you just paid, check your email — we sent you the " +
      "access link. Otherwise, try purchasing again.",
    torna: "Back to home",
    title: "Your Kit Incassa",
    subtitle: "37 ready-to-send messages, organized by situation. Copy, paste, personalize and send.",
    scarica: "Download all messages (.txt)",
    inviatoCopia: (email: string) => `We also sent a copy by email to ${email}`,
  },
};

export default async function AcessoPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  const access = sessionId ? await verifyPaidSession(sessionId) : null;

  if (!access) {
    const t = strings.it;
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold text-stone-900">{t.notFoundTitle}</h1>
        <p className="text-stone-600">{t.notFoundBody}</p>
        <Link href="/" className="rounded-md bg-stone-900 px-4 py-2 text-white transition-transform hover:bg-stone-700 active:scale-[0.98]">
          {t.torna}
        </Link>
      </main>
    );
  }

  const t = strings[access.locale];
  const categories = getKitCategories(access.locale);
  const messages = getKitMessages(access.locale);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-stone-900">{t.title}</h1>
        <p className="mt-2 text-stone-600">{t.subtitle}</p>
        <a
          href={`/api/download?session_id=${sessionId}`}
          className="mt-4 inline-block rounded-md bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-emerald-900/10 transition-transform hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.98]"
        >
          {t.scarica}
        </a>
        <p className="mt-2 text-xs text-stone-400">{t.inviatoCopia(access.email)}</p>
      </header>

      <div className="space-y-10">
        {categories.map((category) => {
          const categoryMessages = messages.filter((m) => m.categorySlug === category.slug);
          if (categoryMessages.length === 0) return null;

          return (
            <section key={category.slug}>
              <h2 className="mb-3 text-lg font-semibold text-stone-900">{category.name}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {categoryMessages.map((message) => (
                  <MessageCard key={message.id} text={message.text} tone={message.tone} locale={access.locale} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

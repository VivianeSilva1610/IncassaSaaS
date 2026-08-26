import Link from "next/link";

export default function AccountEliminatoPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-stone-900">Account eliminato</h1>
      <p className="text-stone-600">
        Il tuo account INCASSA, l&apos;abbonamento e tutti i dati associati sono stati eliminati
        definitivamente.
      </p>
      <Link href="/" className="rounded-md bg-stone-900 px-4 py-2 text-white transition-transform hover:bg-stone-700 active:scale-[0.98]">
        Torna alla home
      </Link>
    </main>
  );
}

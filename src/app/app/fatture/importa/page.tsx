import { requireActiveSubscription } from "@/lib/subscription";
import { ImportFattureForm } from "@/components/ImportFattureForm";
import Link from "next/link";

export default async function ImportaFatturePage() {
  await requireActiveSubscription();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Importa fatture da CSV</h1>
        <Link href="/app/fatture" className="text-sm text-amber-700 underline underline-offset-2">
          Torna alle fatture
        </Link>
      </div>

      <p className="mt-2 text-sm text-stone-600">
        Carica un file CSV con le colonne{" "}
        <code className="rounded bg-stone-100 px-1 py-0.5 text-xs">
          cliente,telefono,email,importo,data_scadenza,numero,descrizione,luogo_lavoro
        </code>
        . Scarica il{" "}
        <a href="/template-importazione-fatture.csv" download className="text-amber-700 underline underline-offset-2">
          file di esempio
        </a>{" "}
        per iniziare.
      </p>

      <div className="mt-6">
        <ImportFattureForm />
      </div>
    </div>
  );
}

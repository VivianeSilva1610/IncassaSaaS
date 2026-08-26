import { requireActiveSubscription } from "@/lib/subscription";
import { ImportClientiForm } from "@/components/ImportClientiForm";
import Link from "next/link";

export default async function ImportaClientiPage() {
  await requireActiveSubscription();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Importa clienti da CSV</h1>
        <Link href="/app/clienti" className="text-sm text-amber-700 underline underline-offset-2">
          Torna ai clienti
        </Link>
      </div>

      <p className="mt-2 text-sm text-stone-600">
        Carica un file CSV con le colonne{" "}
        <code className="rounded bg-stone-100 px-1 py-0.5 text-xs">nome,telefono,email,tipo,indirizzo</code>. Scarica il{" "}
        <a href="/template-importazione-clienti.csv" download className="text-amber-700 underline underline-offset-2">
          file di esempio
        </a>{" "}
        per iniziare. Clienti già esistenti (stesso telefono o nome) vengono saltati automaticamente.
      </p>

      <div className="mt-6">
        <ImportClientiForm />
      </div>
    </div>
  );
}

import { requireActiveSubscription } from "@/lib/subscription";
import { createClient } from "@/lib/supabase-server";
import { getUserLocale } from "@/lib/locale";
import { ImportFattureForm } from "@/components/ImportFattureForm";
import Link from "next/link";

const strings = {
  it: {
    title: "Importa fatture da CSV o Excel",
    torna: "Torna alle fatture",
    intro: "Carica un file CSV o Excel (.xlsx) con le colonne",
    scaricaIl: "Scarica il",
    fileEsempio: "file di esempio",
    perIniziare: "per iniziare.",
  },
  en: {
    title: "Import invoices from CSV or Excel",
    torna: "Back to invoices",
    intro: "Upload a CSV or Excel (.xlsx) file with the columns",
    scaricaIl: "Download the",
    fileEsempio: "example file",
    perIniziare: "to get started.",
  },
};

export default async function ImportaFatturePage() {
  await requireActiveSubscription();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = user ? await getUserLocale(supabase, user.id) : "it";
  const t = strings[locale];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">{t.title}</h1>
        <Link href="/app/fatture" className="text-sm text-amber-700 underline underline-offset-2">
          {t.torna}
        </Link>
      </div>

      <p className="mt-2 text-sm text-stone-600">
        {t.intro}{" "}
        <code className="rounded bg-stone-100 px-1 py-0.5 text-xs">
          cliente,telefono,email,importo,data_scadenza,numero,descrizione,luogo_lavoro
        </code>
        . {t.scaricaIl}{" "}
        <a href="/template-importazione-fatture.csv" download className="text-amber-700 underline underline-offset-2">
          {t.fileEsempio}
        </a>{" "}
        {t.perIniziare}
      </p>

      <div className="mt-6">
        <ImportFattureForm locale={locale} />
      </div>
    </div>
  );
}

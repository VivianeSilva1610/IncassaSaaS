import { requireActiveSubscription } from "@/lib/subscription";
import { createClient } from "@/lib/supabase-server";
import { getUserLocale } from "@/lib/locale";
import { ImportClientiForm } from "@/components/ImportClientiForm";
import Link from "next/link";

const strings = {
  it: {
    title: "Importa clienti da CSV o Excel",
    torna: "Torna ai clienti",
    intro: "Carica un file CSV o Excel (.xlsx) con le colonne",
    scaricaIl: "Scarica il",
    fileEsempio: "file di esempio",
    perIniziare: "per iniziare. Clienti già esistenti (stesso telefono o nome) vengono saltati automaticamente.",
  },
  en: {
    title: "Import clients from CSV or Excel",
    torna: "Back to clients",
    intro: "Upload a CSV or Excel (.xlsx) file with the columns",
    scaricaIl: "Download the",
    fileEsempio: "example file",
    perIniziare: "to get started. Clients that already exist (same phone or name) are skipped automatically.",
  },
};

export default async function ImportaClientiPage() {
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
        <Link href="/app/clienti" className="text-sm text-amber-700 underline underline-offset-2">
          {t.torna}
        </Link>
      </div>

      <p className="mt-2 text-sm text-stone-600">
        {t.intro}{" "}
        <code className="rounded bg-stone-100 px-1 py-0.5 text-xs">nome,telefono,email,tipo,indirizzo</code>. {t.scaricaIl}{" "}
        <a href="/template-importazione-clienti.csv" download className="text-amber-700 underline underline-offset-2">
          {t.fileEsempio}
        </a>{" "}
        {t.perIniziare}
      </p>

      <div className="mt-6">
        <ImportClientiForm locale={locale} />
      </div>
    </div>
  );
}

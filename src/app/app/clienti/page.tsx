import { requireActiveSubscription } from "@/lib/subscription";
import { createClient } from "@/lib/supabase-server";
import { getUserLocale } from "@/lib/locale";
import { addCliente, updateCliente, deleteCliente } from "@/app/app/actions";
import { ContactPickerFields } from "@/components/ContactPickerFields";
import Link from "next/link";

const strings = {
  it: {
    title: "Clienti",
    importaCsv: "Importa da CSV",
    privato: "Privato",
    azienda: "Azienda",
    email: "Email",
    indirizzoOpz: "Indirizzo (opzionale)",
    noteOpz: "Note (opzionale)",
    aggiungiCliente: "Aggiungi cliente",
    storico: "Storico",
    modifica: "Modifica",
    telefono: "Telefono",
    indirizzo: "Indirizzo",
    note: "Note",
    salva: "Salva",
    elimina: "Elimina",
    nessunCliente: "Nessun cliente ancora.",
  },
  en: {
    title: "Clients",
    importaCsv: "Import from CSV",
    privato: "Individual",
    azienda: "Business",
    email: "Email",
    indirizzoOpz: "Address (optional)",
    noteOpz: "Notes (optional)",
    aggiungiCliente: "Add client",
    storico: "History",
    modifica: "Edit",
    telefono: "Phone",
    indirizzo: "Address",
    note: "Notes",
    salva: "Save",
    elimina: "Delete",
    nessunCliente: "No clients yet.",
  },
};

export default async function ClientiPage() {
  await requireActiveSubscription();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = user ? await getUserLocale(supabase, user.id) : "it";
  const t = strings[locale];

  const { data: clients } = await supabase.from("clients").select("*").order("nome");

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">{t.title}</h1>
        <Link href="/app/clienti/importa" className="text-sm text-amber-700 underline underline-offset-2">
          {t.importaCsv}
        </Link>
      </div>

      <form action={addCliente} className="mt-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
        <ContactPickerFields locale={locale} />
        <select name="tipo" className="rounded-md border border-stone-300 px-3 py-2 text-sm">
          <option value="privato">{t.privato}</option>
          <option value="azienda">{t.azienda}</option>
        </select>
        <input name="email" type="email" placeholder={t.email} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="indirizzo" placeholder={t.indirizzoOpz} className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2" />
        <textarea
          name="note"
          placeholder={t.noteOpz}
          rows={2}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2"
        />
        <button
          type="submit"
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-2"
        >
          {t.aggiungiCliente}
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {(clients ?? []).map((c) => (
          <div key={c.id} className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-stone-900">{c.nome}</p>
                <p className="text-sm text-stone-500">
                  {c.tipo === "azienda" ? t.azienda : t.privato}
                  {c.telefono ? ` · ${c.telefono}` : ""}
                  {c.email ? ` · ${c.email}` : ""}
                  {c.indirizzo ? ` · ${c.indirizzo}` : ""}
                </p>
                {c.note && <p className="mt-1 text-sm text-stone-500 italic">{c.note}</p>}
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/app/comunicazioni?cliente=${c.id}`}
                  className="text-xs text-amber-700 hover:underline"
                >
                  {t.storico}
                </Link>
                <details className="relative">
                  <summary className="cursor-pointer list-none text-xs text-amber-700 hover:underline">
                    {t.modifica}
                  </summary>
                  <form
                    action={updateCliente.bind(null, c.id)}
                    className="absolute right-0 z-10 mt-2 grid w-72 gap-2 rounded-lg border border-stone-200 bg-white p-3 shadow-lg"
                  >
                    <input
                      name="nome"
                      required
                      defaultValue={c.nome}
                      className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                    />
                    <select name="tipo" defaultValue={c.tipo} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm">
                      <option value="privato">{t.privato}</option>
                      <option value="azienda">{t.azienda}</option>
                    </select>
                    <input
                      name="telefono"
                      defaultValue={c.telefono ?? ""}
                      placeholder={t.telefono}
                      className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                    />
                    <input
                      name="email"
                      type="email"
                      defaultValue={c.email ?? ""}
                      placeholder={t.email}
                      className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                    />
                    <input
                      name="indirizzo"
                      defaultValue={c.indirizzo ?? ""}
                      placeholder={t.indirizzo}
                      className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                    />
                    <textarea
                      name="note"
                      defaultValue={c.note ?? ""}
                      placeholder={t.note}
                      rows={2}
                      className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-700"
                    >
                      {t.salva}
                    </button>
                  </form>
                </details>
                <form action={deleteCliente.bind(null, c.id)}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">
                    {t.elimina}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {(clients ?? []).length === 0 && <p className="text-sm text-stone-500">{t.nessunCliente}</p>}
      </div>
    </div>
  );
}

import { requireActiveSubscription } from "@/lib/subscription";
import { createClient } from "@/lib/supabase-server";
import { addCliente, updateCliente, deleteCliente } from "@/app/app/actions";

export default async function ClientiPage() {
  await requireActiveSubscription();
  const supabase = await createClient();
  const { data: clients } = await supabase.from("clients").select("*").order("nome");

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Clienti</h1>

      <form action={addCliente} className="mt-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
        <input name="nome" required placeholder="Nome" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <select name="tipo" className="rounded-md border border-stone-300 px-3 py-2 text-sm">
          <option value="privato">Privato</option>
          <option value="azienda">Azienda</option>
        </select>
        <input name="telefono" placeholder="Telefono (per WhatsApp)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="email" type="email" placeholder="Email" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="indirizzo" placeholder="Indirizzo (opzionale)" className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2" />
        <button
          type="submit"
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-2"
        >
          Aggiungi cliente
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {(clients ?? []).map((c) => (
          <div key={c.id} className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-stone-900">{c.nome}</p>
                <p className="text-sm text-stone-500">
                  {c.tipo === "azienda" ? "Azienda" : "Privato"}
                  {c.telefono ? ` · ${c.telefono}` : ""}
                  {c.email ? ` · ${c.email}` : ""}
                  {c.indirizzo ? ` · ${c.indirizzo}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <details className="relative">
                  <summary className="cursor-pointer list-none text-xs text-amber-700 hover:underline">
                    Modifica
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
                      <option value="privato">Privato</option>
                      <option value="azienda">Azienda</option>
                    </select>
                    <input
                      name="telefono"
                      defaultValue={c.telefono ?? ""}
                      placeholder="Telefono"
                      className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                    />
                    <input
                      name="email"
                      type="email"
                      defaultValue={c.email ?? ""}
                      placeholder="Email"
                      className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                    />
                    <input
                      name="indirizzo"
                      defaultValue={c.indirizzo ?? ""}
                      placeholder="Indirizzo"
                      className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-700"
                    >
                      Salva
                    </button>
                  </form>
                </details>
                <form action={deleteCliente.bind(null, c.id)}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">
                    Elimina
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {(clients ?? []).length === 0 && <p className="text-sm text-stone-500">Nessun cliente ancora.</p>}
      </div>
    </div>
  );
}

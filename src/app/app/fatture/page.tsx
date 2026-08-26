import { requireActiveSubscription } from "@/lib/subscription";
import { createClient } from "@/lib/supabase-server";
import { addFattura, updateFattura, markFatturaPagata, deleteFattura } from "@/app/app/actions";
import { formatEuro, getUrgency, urgencyEmoji } from "@/lib/urgency";

export default async function FatturePage() {
  await requireActiveSubscription();
  const supabase = await createClient();

  const [{ data: clients }, { data: invoices }] = await Promise.all([
    supabase.from("clients").select("id, nome").order("nome"),
    supabase.from("invoices").select("*, clients(nome)").order("data_scadenza"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Fatture</h1>

      <form action={addFattura} className="mt-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
        <select name="client_id" required className="rounded-md border border-stone-300 px-3 py-2 text-sm">
          <option value="">Seleziona cliente…</option>
          {(clients ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <input name="importo" type="number" step="0.01" min="0" required placeholder="Importo (€)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="data_scadenza" type="date" required className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="numero" placeholder="Numero fattura (opzionale)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="descrizione" placeholder="Descrizione (opzionale)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input
          name="luogo_lavoro"
          placeholder="Luogo del lavoro (lascia vuoto se uguale all'indirizzo del cliente)"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2"
        />
        <button
          type="submit"
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-2"
        >
          Aggiungi fattura
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {(invoices ?? []).map((inv) => (
          <div key={inv.id} className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-stone-900">
                  {inv.status === "aperta" && urgencyEmoji[getUrgency(inv.data_scadenza)]} {inv.clients?.nome}
                  {inv.status === "pagata" && " ✅"}
                </p>
                <p className="text-sm text-stone-500">
                  {inv.numero ? `n. ${inv.numero} · ` : ""}
                  {formatEuro(Number(inv.importo))} · scade {inv.data_scadenza}
                  {inv.descrizione ? ` · ${inv.descrizione}` : ""}
                  {inv.luogo_lavoro ? ` · ${inv.luogo_lavoro}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <details className="relative">
                  <summary className="cursor-pointer list-none text-xs text-amber-700 hover:underline">
                    Modifica
                  </summary>
                  <form
                    action={updateFattura.bind(null, inv.id)}
                    className="absolute right-0 z-10 mt-2 grid w-72 gap-2 rounded-lg border border-stone-200 bg-white p-3 shadow-lg"
                  >
                    <select name="client_id" required defaultValue={inv.client_id} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm">
                      {(clients ?? []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                    <input
                      name="importo"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      defaultValue={inv.importo}
                      className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                    />
                    <input
                      name="data_scadenza"
                      type="date"
                      required
                      defaultValue={inv.data_scadenza}
                      className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                    />
                    <input
                      name="numero"
                      defaultValue={inv.numero ?? ""}
                      placeholder="Numero fattura"
                      className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                    />
                    <input
                      name="descrizione"
                      defaultValue={inv.descrizione ?? ""}
                      placeholder="Descrizione"
                      className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                    />
                    <input
                      name="luogo_lavoro"
                      defaultValue={inv.luogo_lavoro ?? ""}
                      placeholder="Luogo del lavoro"
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
                {inv.status === "aperta" && (
                  <form action={markFatturaPagata.bind(null, inv.id)}>
                    <button type="submit" className="text-xs text-emerald-700 hover:underline">
                      Segna pagata
                    </button>
                  </form>
                )}
                <form action={deleteFattura.bind(null, inv.id)}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">
                    Elimina
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {(invoices ?? []).length === 0 && <p className="text-sm text-stone-500">Nessuna fattura ancora.</p>}
      </div>
    </div>
  );
}

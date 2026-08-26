import { requireActiveSubscription } from "@/lib/subscription";
import { createClient } from "@/lib/supabase-server";
import { toneEmoji } from "@/lib/tone-styles";
import type { Tone } from "@/content/kit-incassa";
import Link from "next/link";

const canaleLabel: Record<string, string> = {
  email: "✉️ Email",
  whatsapp: "💬 WhatsApp",
};

export default async function ComunicazioniPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  await requireActiveSubscription();
  const { cliente: clienteId } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("comunicazioni")
    .select("*, clients(nome)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (clienteId) {
    query = query.eq("client_id", clienteId);
  }

  const { data: comunicazioni } = await query;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Comunicazioni</h1>
        {clienteId && (
          <Link href="/app/comunicazioni" className="text-sm text-amber-700 underline underline-offset-2">
            Vedi tutte
          </Link>
        )}
      </div>
      <p className="mt-1 text-sm text-stone-600">
        Storico dei solleciti inviati, manuali e automatici.
      </p>

      <div className="mt-6 space-y-2">
        {(comunicazioni ?? []).length === 0 && (
          <p className="text-sm text-stone-500">Nessuna comunicazione ancora.</p>
        )}
        {(comunicazioni ?? []).map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-4">
            <div>
              <p className="font-medium text-stone-900">
                {c.clients?.nome ?? "Cliente"}
                {c.automatico && (
                  <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                    Automatico
                  </span>
                )}
              </p>
              <p className="text-sm text-stone-500">
                {canaleLabel[c.canale] ?? c.canale}
                {c.tono ? ` · ${toneEmoji[c.tono as Tone] ?? ""} ${c.tono}` : ""} ·{" "}
                {new Date(c.created_at).toLocaleString("it-IT")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

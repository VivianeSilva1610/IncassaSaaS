import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { SubscribeButton } from "@/components/SubscribeButton";
import { isAdminEmail } from "@/lib/subscription";

const statusLabel: Record<string, string> = {
  trialing: "🟢 Periodo di prova attivo",
  active: "🟢 Abbonamento attivo",
  past_due: "🟠 Pagamento in ritardo",
  canceled: "🔴 Abbonamento cancellato",
  none: "Nessun abbonamento",
};

export default async function AbbonamentoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, trial_ends_at")
    .eq("id", user.id)
    .single();

  const status = profile?.subscription_status ?? "none";
  const isAdmin = isAdminEmail(user.email);
  const hasAccess = isAdmin || status === "trialing" || status === "active";

  return (
    <main className="mx-auto max-w-md text-center">
      <h1 className="text-2xl font-bold text-stone-900">Abbonamento INCASSA</h1>
      <p className="mt-2 text-sm text-stone-600">{isAdmin ? "🟢 Accesso amministratore" : (statusLabel[status] ?? status)}</p>

      {hasAccess ? (
        <>
          {profile?.trial_ends_at && status === "trialing" && (
            <p className="mt-2 text-xs text-stone-400">
              Il periodo di prova termina il {new Date(profile.trial_ends_at).toLocaleDateString("it-IT")}.
            </p>
          )}
          <Link
            href="/app"
            className="mt-6 inline-block rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:bg-stone-700 active:scale-[0.98]"
          >
            Vai alla dashboard
          </Link>
        </>
      ) : (
        <>
          <p className="mt-6 text-stone-700">
            Per usare INCASSA — dashboard, solleciti generati con IA e molto altro — attiva
            l&apos;abbonamento: <strong>€19,90/mese</strong>, con 7 giorni di prova gratuita.
          </p>
          <div className="mt-6">
            <SubscribeButton className="w-full rounded-lg bg-gradient-to-b from-amber-500 to-orange-600 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-orange-900/20 transition-transform hover:from-amber-400 hover:to-orange-500 active:scale-[0.98] disabled:opacity-60" />
          </div>
        </>
      )}
    </main>
  );
}

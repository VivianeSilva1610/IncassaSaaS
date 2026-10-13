import { MODULOS_COMERCIO, requireCommerceAccess } from "@/lib/commerce-subscription";
import { atualizarModulosComercio } from "../actions";
import { CommerceAddonButton } from "@/components/comercio/CommerceAddonButton";
import { CommerceBillingPortalButton } from "@/components/comercio/CommerceBillingPortalButton";

const statusLabels: Record<string, string> = {
  trialing: "Período de teste",
  active: "Ativa",
  past_due: "Pagamento pendente",
  canceled: "Cancelada",
  inactive: "Inativa",
};

function formatDate(value: string | null | undefined) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(new Date(value)) : null;
}

export default async function Page() {
  const { supabase, ownerId, isOwner, subscription, modulosAtivos } = await requireCommerceAccess();
  const { count } = await supabase.from("commerce_staff").select("id", { count: "exact", head: true }).eq("owner_id", ownerId);
  const trialEnd = formatDate(subscription?.trial_ends_at);
  const periodEnd = formatDate(subscription?.current_period_ends_at);

  return <div>
    <h1 className="text-3xl font-bold">Meu plano</h1>
    <p className="mt-1 text-sm text-stone-500">Assinatura, limites e portabilidade dos dados do INCASSA Comércio.</p>
    <section className="mt-6 rounded-2xl border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-semibold">Situação da assinatura</h2><p className="mt-1 text-sm text-stone-500">Sincronizada automaticamente com a Stripe.</p></div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">{statusLabels[subscription?.subscription_status ?? ""] ?? "Não informada"}</span>
      </div>
      {subscription?.subscription_status === "trialing" && trialEnd && <p className="mt-3 text-sm text-stone-700">Teste disponível até {trialEnd}.</p>}
      {subscription?.cancel_at_period_end && periodEnd && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Cancelamento programado. O acesso permanece disponível até {periodEnd}.</p>}
      {!subscription?.cancel_at_period_end && periodEnd && subscription?.subscription_status === "active" && <p className="mt-3 text-sm text-stone-700">Período vigente até {periodEnd}.</p>}
    </section>
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border bg-white p-5"><h2 className="font-semibold">Módulos</h2>{subscription?.addon_modulos_ilimitados ? <p className="mt-2 text-sm text-emerald-700">Todos os módulos estão liberados.</p> : <><form action={atualizarModulosComercio} className="mt-4"><div className="grid gap-2 sm:grid-cols-2">{MODULOS_COMERCIO.map(module => <label key={module} className="flex gap-2 rounded-xl border p-3 text-sm"><input type="checkbox" name={`modulo_${module}`} defaultChecked={modulosAtivos.includes(module)}/>{module}</label>)}</div><button className="mt-3 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white">Salvar módulos</button></form><div className="mt-3"><CommerceAddonButton tipo="modulos" label="Módulos ilimitados"/></div></>}</section>
      <div className="space-y-4">
        <section className="rounded-2xl border bg-white p-5"><h2 className="font-semibold">Equipe e abas</h2><p className="mt-1 text-sm text-stone-500">{count ?? 0} de 3 pessoas · até 3 abas por pessoa.</p><div className="mt-3 flex flex-wrap gap-2">{!subscription?.addon_equipe_ilimitada && <CommerceAddonButton tipo="equipe" label="Equipe ilimitada"/>}{!subscription?.addon_abas_ilimitadas && <CommerceAddonButton tipo="abas" label="Abas ilimitadas"/>}</div></section>
        <section className="rounded-2xl border bg-white p-5"><h2 className="font-semibold">Cobrança</h2><p className="mt-1 text-sm text-stone-500">Atualize pagamento, consulte faturas ou cancele pelo portal seguro da Stripe.</p><div className="mt-3"><CommerceBillingPortalButton/></div></section>
        <section className="rounded-2xl border bg-white p-5"><h2 className="font-semibold">Backup completo</h2><p className="mt-1 text-sm text-stone-500">Baixe os dados operacionais da empresa em Excel.</p>{isOwner && <a href="/api/comercio/export-backup-completo" className="mt-3 inline-block rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white">Baixar backup</a>}</section>
      </div>
    </div>
  </div>;
}

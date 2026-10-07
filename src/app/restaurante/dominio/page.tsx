import { redirect } from "next/navigation";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { addRestaurantDomain, verifyRestaurantDomain, deleteRestaurantDomain } from "@/app/restaurante/actions";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente de verificação",
  verified: "Verificado",
  blocked: "Bloqueado",
};

const STATUS_CLASSE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  verified: "bg-emerald-100 text-emerald-700",
  blocked: "bg-red-100 text-red-700",
};

export default async function DominioPage() {
  const { supabase, restaurantOwnerId, isOwner } = await requireRestaurantSubscription();

  if (!isOwner) {
    redirect("/restaurante");
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, slug")
    .eq("owner_user_id", restaurantOwnerId)
    .maybeSingle();

  if (!restaurant) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Domínio</h1>
        <p className="mt-2 text-sm text-stone-600">
          Ainda não existe um registro de restaurante pra essa conta — fale com o suporte.
        </p>
      </div>
    );
  }

  const { data: dominios } = await supabase
    .from("restaurant_domains")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .order("created_at");

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Domínio</h1>
      <p className="mt-1 text-sm text-stone-600">
        Sua loja já funciona em{" "}
        <a href={`/loja/${restaurant.slug}`} className="text-amber-700 underline underline-offset-2">
          incassa.eu/loja/{restaurant.slug}
        </a>
        . Cadastre um domínio próprio (ex: seurestaurante.com.br) pra usar esse endereço em vez do padrão.
      </p>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="font-semibold text-stone-900">Cadastrar domínio</h2>
        <form action={addRestaurantDomain} className="mt-2 flex flex-wrap gap-2">
          <input
            name="hostname"
            required
            placeholder="seurestaurante.com.br"
            className="min-w-56 flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
            Adicionar
          </button>
        </form>
      </section>

      <section className="mt-6 space-y-3">
        {(dominios ?? []).map((d) => (
          <div key={d.id} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-stone-900">
                {d.hostname} {d.is_primary && <span className="text-xs text-stone-400">(principal)</span>}
              </p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSE[d.verification_status] ?? "bg-stone-100 text-stone-600"}`}>
                {STATUS_LABEL[d.verification_status] ?? d.verification_status}
              </span>
            </div>

            {d.verification_status !== "verified" && (
              <div className="mt-3 rounded-lg bg-stone-50 p-3 text-xs text-stone-600">
                <p className="font-medium text-stone-700">Passo 1 — prove que o domínio é seu</p>
                <p className="mt-1">
                  Crie um registro <strong>TXT</strong> em <code>_incassa-challenge.{d.hostname}</code> com o valor:
                </p>
                <code className="mt-1 block break-all rounded bg-white px-2 py-1 text-stone-900">{d.verification_token}</code>
                <form action={verifyRestaurantDomain.bind(null, d.id)} className="mt-2">
                  <button type="submit" className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white">
                    Verificar agora
                  </button>
                </form>
                <p className="mt-3 font-medium text-stone-700">Passo 2 — depois de verificado</p>
                <p className="mt-1">
                  Aponte um <strong>CNAME</strong> de {d.hostname} para <code>cname.vercel-dns.com</code> e me avise — preciso
                  adicionar o domínio no projeto da Vercel manualmente antes dele funcionar de verdade.
                </p>
              </div>
            )}

            {d.verification_status === "verified" && (
              <p className="mt-2 text-xs text-stone-500">
                Verificado em {d.verified_at ? new Date(d.verified_at).toLocaleString("pt-BR") : "—"}. Se o CNAME já
                estiver apontado e o domínio adicionado no projeto da Vercel, {d.hostname} já serve sua loja direto.
              </p>
            )}

            <form action={deleteRestaurantDomain.bind(null, d.id)} className="mt-3">
              <button type="submit" className="text-xs text-red-600 hover:underline">
                Remover
              </button>
            </form>
          </div>
        ))}
        {(dominios ?? []).length === 0 && <p className="text-sm text-stone-500">Nenhum domínio cadastrado ainda.</p>}
      </section>
    </div>
  );
}

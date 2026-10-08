import { redirect } from "next/navigation";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { updatePaymentProvider, updateEmailProvider } from "@/app/restaurante/actions";

function mascarar(chave: string | null) {
  if (!chave) return null;
  return chave.length <= 6 ? "••••••" : `${"•".repeat(chave.length - 4)}${chave.slice(-4)}`;
}

export default async function IntegracoesPage() {
  const { supabase, restaurantOwnerId, isOwner } = await requireRestaurantSubscription();

  if (!isOwner) {
    redirect("/restaurante");
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name")
    .eq("owner_user_id", restaurantOwnerId)
    .maybeSingle();

  if (!restaurant) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Integrações</h1>
        <p className="mt-2 text-sm text-stone-600">
          Ainda não existe um registro de restaurante pra essa conta — fale com o suporte.
        </p>
      </div>
    );
  }

  const [{ data: pagamento }, { data: email }] = await Promise.all([
    supabase.from("restaurant_payment_providers").select("*").eq("restaurant_id", restaurant.id).maybeSingle(),
    supabase.from("restaurant_email_providers").select("*").eq("restaurant_id", restaurant.id).maybeSingle(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Integrações</h1>
      <p className="mt-1 text-sm text-stone-600">
        Cada restaurante usa sua própria conta de pagamento e de e-mail — nada é compartilhado entre lojas
        diferentes na plataforma.
      </p>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-stone-900">Pagamento — Pix via Asaas</h2>
          {pagamento?.ativo ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Ativo</span>
          ) : (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500">Não configurado</span>
          )}
        </div>
        <p className="mt-1 text-sm text-stone-600">
          Os pedidos da sua loja online só aceitam Pix depois de configurado aqui — o dinheiro cai direto na sua
          própria conta Asaas, nunca numa conta de outro restaurante.
        </p>
        <form action={updatePaymentProvider} className="mt-3 grid gap-3">
          <label className="text-sm text-stone-600">
            <span className="mb-1 block text-xs text-stone-500">
              Chave de API da sua conta Asaas{mascarar(pagamento?.asaas_api_key ?? null) ? ` (atual: ${mascarar(pagamento?.asaas_api_key ?? null)})` : ""}
            </span>
            <input
              name="asaas_api_key"
              type="password"
              placeholder={pagamento?.asaas_api_key ? "Deixe em branco para manter a chave atual" : "$aact_..."}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" name="ativo" defaultChecked={pagamento?.ativo ?? false} />
            Ativar recebimento de Pix
          </label>
          <button type="submit" className="w-fit rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
            Salvar
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-stone-900">E-mail — Resend</h2>
          {email?.ativo ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Ativo</span>
          ) : (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500">Não configurado</span>
          )}
        </div>
        <p className="mt-1 text-sm text-stone-600">
          Usado para enviar orçamentos e pedidos de compra a fornecedores. Exige uma conta própria no{" "}
          <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-amber-700 underline underline-offset-2">
            Resend
          </a>{" "}
          com um domínio de e-mail verificado.
        </p>
        <form action={updateEmailProvider} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-stone-600 sm:col-span-2">
            <span className="mb-1 block text-xs text-stone-500">
              Chave de API do Resend{mascarar(email?.resend_api_key ?? null) ? ` (atual: ${mascarar(email?.resend_api_key ?? null)})` : ""}
            </span>
            <input
              name="resend_api_key"
              type="password"
              placeholder={email?.resend_api_key ? "Deixe em branco para manter a chave atual" : "re_..."}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-stone-600">
            <span className="mb-1 block text-xs text-stone-500">E-mail remetente (do seu domínio verificado)</span>
            <input
              name="from_email"
              type="email"
              defaultValue={email?.from_email ?? ""}
              placeholder="compras@seurestaurante.com"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-stone-600">
            <span className="mb-1 block text-xs text-stone-500">Nome do remetente (opcional)</span>
            <input
              name="from_name"
              defaultValue={email?.from_name ?? ""}
              placeholder={restaurant.name}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700 sm:col-span-2">
            <input type="checkbox" name="ativo" defaultChecked={email?.ativo ?? false} />
            Ativar envio de e-mail
          </label>
          <button type="submit" className="w-fit rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white sm:col-span-2">
            Salvar
          </button>
        </form>
      </section>
    </div>
  );
}

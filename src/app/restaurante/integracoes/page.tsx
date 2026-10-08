import { redirect } from "next/navigation";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { updatePaymentProvider, updateEmailProvider } from "@/app/restaurante/actions";

function mascarar(chave: string | null) {
  if (!chave) return null;
  return chave.length <= 6 ? "••••••" : `${"•".repeat(chave.length - 4)}${chave.slice(-4)}`;
}

const CONTEUDO: Record<RestauranteLocale, {
  titulo: string; semRestaurante: string; descricao: string; pagamentoTitulo: string; ativo: string;
  naoConfigurado: string; pagamentoDescricao: string; chaveApiAsaas: (atual: string) => string;
  atualLabel: (valor: string) => string; deixarEmBranco: string; ativarRecebimento: string; salvar: string;
  emailTitulo: string; emailDescricao: (link: React.ReactNode) => React.ReactNode; chaveApiResend: string;
  emailRemetente: string; nomeRemetenteOpcional: string; ativarEnvio: string;
}> = {
  "pt-BR": {
    titulo: "Integrações", semRestaurante: "Ainda não existe um registro de restaurante pra essa conta — fale com o suporte.",
    descricao: "Cada restaurante usa sua própria conta de pagamento e de e-mail — nada é compartilhado entre lojas diferentes na plataforma.",
    pagamentoTitulo: "Pagamento — Pix via Asaas", ativo: "Ativo", naoConfigurado: "Não configurado",
    pagamentoDescricao: "Os pedidos da sua loja online só aceitam Pix depois de configurado aqui — o dinheiro cai direto na sua própria conta Asaas, nunca numa conta de outro restaurante.",
    chaveApiAsaas: (atual) => `Chave de API da sua conta Asaas${atual}`,
    atualLabel: (valor) => ` (atual: ${valor})`, deixarEmBranco: "Deixe em branco para manter a chave atual",
    ativarRecebimento: "Ativar recebimento de Pix", salvar: "Salvar",
    emailTitulo: "E-mail — Resend",
    emailDescricao: (link) => <>Usado para enviar orçamentos e pedidos de compra a fornecedores. Exige uma conta própria no {link} com um domínio de e-mail verificado.</>,
    chaveApiResend: "Chave de API do Resend", emailRemetente: "E-mail remetente (do seu domínio verificado)",
    nomeRemetenteOpcional: "Nome do remetente (opcional)", ativarEnvio: "Ativar envio de e-mail",
  },
  it: {
    titulo: "Integrazioni", semRestaurante: "Non esiste ancora un ristorante registrato per questo account — contatta l'assistenza.",
    descricao: "Ogni ristorante usa il proprio account di pagamento e di e-mail — niente viene condiviso tra negozi diversi sulla piattaforma.",
    pagamentoTitulo: "Pagamento — Carta via Asaas", ativo: "Attivo", naoConfigurado: "Non configurato",
    pagamentoDescricao: "Gli ordini del tuo negozio online accettano pagamenti con carta solo dopo la configurazione qui — il denaro va direttamente sul tuo account Asaas, mai sull'account di un altro ristorante.",
    chaveApiAsaas: (atual) => `Chiave API del tuo account Asaas${atual}`,
    atualLabel: (valor) => ` (attuale: ${valor})`, deixarEmBranco: "Lascia vuoto per mantenere la chiave attuale",
    ativarRecebimento: "Attiva ricezione pagamenti con carta", salvar: "Salva",
    emailTitulo: "E-mail — Resend",
    emailDescricao: (link) => <>Usato per inviare preventivi e ordini di acquisto ai fornitori. Richiede un account proprio su {link} con un dominio e-mail verificato.</>,
    chaveApiResend: "Chiave API di Resend", emailRemetente: "E-mail mittente (del tuo dominio verificato)",
    nomeRemetenteOpcional: "Nome del mittente (opzionale)", ativarEnvio: "Attiva invio e-mail",
  },
};

export default async function IntegracoesPage() {
  const { supabase, restaurantOwnerId, isOwner, locale } = await requireRestaurantSubscription();
  const t = CONTEUDO[locale];

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
        <h1 className="text-2xl font-bold text-stone-900">{t.titulo}</h1>
        <p className="mt-2 text-sm text-stone-600">
          {t.semRestaurante}
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
      <h1 className="text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {t.descricao}
      </p>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-stone-900">{t.pagamentoTitulo}</h2>
          {pagamento?.ativo ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">{t.ativo}</span>
          ) : (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500">{t.naoConfigurado}</span>
          )}
        </div>
        <p className="mt-1 text-sm text-stone-600">
          {t.pagamentoDescricao}
        </p>
        <form action={updatePaymentProvider} className="mt-3 grid gap-3">
          <label className="text-sm text-stone-600">
            <span className="mb-1 block text-xs text-stone-500">
              {t.chaveApiAsaas(mascarar(pagamento?.asaas_api_key ?? null) ? t.atualLabel(mascarar(pagamento?.asaas_api_key ?? null)!) : "")}
            </span>
            <input
              name="asaas_api_key"
              type="password"
              placeholder={pagamento?.asaas_api_key ? t.deixarEmBranco : "$aact_..."}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" name="ativo" defaultChecked={pagamento?.ativo ?? false} />
            {t.ativarRecebimento}
          </label>
          <button type="submit" className="w-fit rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
            {t.salvar}
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-stone-900">{t.emailTitulo}</h2>
          {email?.ativo ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">{t.ativo}</span>
          ) : (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500">{t.naoConfigurado}</span>
          )}
        </div>
        <p className="mt-1 text-sm text-stone-600">
          {t.emailDescricao(
            <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-amber-700 underline underline-offset-2">
              Resend
            </a>,
          )}
        </p>
        <form action={updateEmailProvider} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-stone-600 sm:col-span-2">
            <span className="mb-1 block text-xs text-stone-500">
              {t.chaveApiResend}{mascarar(email?.resend_api_key ?? null) ? t.atualLabel(mascarar(email?.resend_api_key ?? null)!) : ""}
            </span>
            <input
              name="resend_api_key"
              type="password"
              placeholder={email?.resend_api_key ? t.deixarEmBranco : "re_..."}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-stone-600">
            <span className="mb-1 block text-xs text-stone-500">{t.emailRemetente}</span>
            <input
              name="from_email"
              type="email"
              defaultValue={email?.from_email ?? ""}
              placeholder="compras@seurestaurante.com"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-stone-600">
            <span className="mb-1 block text-xs text-stone-500">{t.nomeRemetenteOpcional}</span>
            <input
              name="from_name"
              defaultValue={email?.from_name ?? ""}
              placeholder={restaurant.name}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700 sm:col-span-2">
            <input type="checkbox" name="ativo" defaultChecked={email?.ativo ?? false} />
            {t.ativarEnvio}
          </label>
          <button type="submit" className="w-fit rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white sm:col-span-2">
            {t.salvar}
          </button>
        </form>
      </section>
    </div>
  );
}

import { redirect } from "next/navigation";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { addRestaurantDomain, verifyRestaurantDomain, deleteRestaurantDomain, updateIdentidadeVisual } from "@/app/restaurante/actions";

const STATUS_LABEL: Record<RestauranteLocale, Record<string, string>> = {
  "pt-BR": { pending: "Pendente de verificação", verified: "Verificado", blocked: "Bloqueado" },
  it: { pending: "In attesa di verifica", verified: "Verificato", blocked: "Bloccato" },
};

const STATUS_CLASSE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  verified: "bg-emerald-100 text-emerald-700",
  blocked: "bg-red-100 text-red-700",
};

const CONTEUDO: Record<RestauranteLocale, {
  titulo: string; semRestaurante: string; lojaFuncionaEm: (link: React.ReactNode) => React.ReactNode;
  cadastreDominio: string; cadastrarDominio: string; dominioPlaceholder: string; adicionar: string;
  principal: string; passo1: string; passo1Descricao: (hostname: string) => React.ReactNode;
  verificarAgora: string; passo2: string; passo2Descricao: (hostname: string) => React.ReactNode;
  verificadoEm: (data: string) => string; cnameInfo: (hostname: string) => string; remover: string;
  nenhumDominio: string;
  guiaTitulo: string; guia1: React.ReactNode; guia2: React.ReactNode; guia3: React.ReactNode; guiaPrazo: string;
  guiaAviso: React.ReactNode;
  identidadeTitulo: string; identidadeDescricao: string; logoLabel: string; capaLabel: string; corLabel: string;
  salvarIdentidade: string;
}> = {
  "pt-BR": {
    titulo: "Domínio", semRestaurante: "Ainda não existe um registro de restaurante pra essa conta — fale com o suporte.",
    lojaFuncionaEm: (link) => <>Sua loja já funciona em {link}. Cadastre um domínio próprio (ex: seurestaurante.com.br) pra usar esse endereço em vez do padrão.</>,
    cadastreDominio: "Cadastrar domínio", cadastrarDominio: "Cadastrar domínio",
    dominioPlaceholder: "seurestaurante.com.br", adicionar: "Adicionar", principal: "(principal)",
    passo1: "Passo 1 — prove que o domínio é seu",
    passo1Descricao: (hostname) => <>Crie um registro <strong>TXT</strong> em <code>_incassa-challenge.{hostname}</code> com o valor:</>,
    verificarAgora: "Verificar agora", passo2: "Passo 2 — depois de verificado",
    passo2Descricao: (hostname) => <>Aponte um <strong>CNAME</strong> de {hostname} para <code>cname.vercel-dns.com</code>. Assim que o DNS propagar, seu domínio ativa sozinho — não precisa avisar ninguém.</>,
    verificadoEm: (data) => `Verificado em ${data}.`,
    cnameInfo: (hostname) => `Com o CNAME apontado, ${hostname} serve sua loja direto — a ativação é automática, pode levar algumas horas pra propagar.`,
    remover: "Remover", nenhumDominio: "Nenhum domínio cadastrado ainda.",
    guiaTitulo: "Como funciona, passo a passo",
    guia1: <>1. Digite seu domínio acima e clique em <strong>Adicionar</strong>. Isso só reserva o endereço pra você — ainda não muda nada no ar.</>,
    guia2: <>2. No painel do seu provedor de domínio (Registro.br, GoDaddy, Hostgator etc.), crie o registro <strong>TXT</strong> indicado e clique em <strong>Verificar agora</strong>. É assim que provamos que o domínio é seu.</>,
    guia3: <>3. Depois de verificado, aponte um <strong>CNAME</strong> pra <code>cname.vercel-dns.com</code>. A partir daí é automático: assim que o DNS propagar, seu domínio passa a servir sua loja sozinho.</>,
    guiaPrazo: "DNS pode levar de alguns minutos a algumas horas pra propagar — se não funcionar na hora, é normal, espere um pouco e recarregue.",
    guiaAviso: <>
      <strong>Atenção:</strong> apontar o domínio pra gente <strong>substitui</strong> o que está ali hoje — não é uma integração lado a lado. Se você já tem um site em <code>www.seurestaurante.com.br</code>, por exemplo, e não quer perdê-lo, cadastre um subdomínio diferente aqui (tipo <code>cardapio.seurestaurante.com.br</code> ou <code>pedidos.seurestaurante.com.br</code>) em vez do endereço principal — assim os dois convivem.
      {" "}E o CNAME só funciona em subdomínio: pro domínio raiz sem <code>www</code> (ex: <code>seurestaurante.com.br</code> puro), o registro certo é do tipo <strong>A</strong> apontando pro IP <code>76.76.21.21</code>, não CNAME.
    </>,
    identidadeTitulo: "Identidade visual da loja",
    identidadeDescricao: "Logo, foto de capa e cor da marca que aparecem na sua loja pública. Cole o link de uma imagem já hospedada (ex: no seu site, Google Drive público, Imgur) — não é upload de arquivo.",
    logoLabel: "URL do logo", capaLabel: "URL da foto de capa", corLabel: "Cor da marca",
    salvarIdentidade: "Salvar identidade visual",
  },
  it: {
    titulo: "Dominio", semRestaurante: "Non esiste ancora un ristorante registrato per questo account — contatta l'assistenza.",
    lojaFuncionaEm: (link) => <>Il tuo negozio funziona già su {link}. Registra un dominio tuo (es: ilsuoristorante.it) per usare questo indirizzo al posto di quello predefinito.</>,
    cadastreDominio: "Registra dominio", cadastrarDominio: "Registra dominio",
    dominioPlaceholder: "ilsuoristorante.it", adicionar: "Aggiungi", principal: "(principale)",
    passo1: "Passo 1 — dimostra che il dominio è tuo",
    passo1Descricao: (hostname) => <>Crea un record <strong>TXT</strong> in <code>_incassa-challenge.{hostname}</code> con il valore:</>,
    verificarAgora: "Verifica ora", passo2: "Passo 2 — dopo la verifica",
    passo2Descricao: (hostname) => <>Punta un <strong>CNAME</strong> di {hostname} verso <code>cname.vercel-dns.com</code>. Appena il DNS si propaga, il dominio si attiva da solo — non serve avvisare nessuno.</>,
    verificadoEm: (data) => `Verificato il ${data}.`,
    cnameInfo: (hostname) => `Con il CNAME puntato, ${hostname} serve già direttamente il tuo negozio — l'attivazione è automatica, può richiedere alcune ore per propagarsi.`,
    remover: "Rimuovi", nenhumDominio: "Nessun dominio registrato ancora.",
    guiaTitulo: "Come funziona, passo per passo",
    guia1: <>1. Scrivi il tuo dominio qui sopra e clicca su <strong>Aggiungi</strong>. Questo riserva solo l&apos;indirizzo per te — non cambia ancora nulla online.</>,
    guia2: <>2. Nel pannello del tuo provider di dominio, crea il record <strong>TXT</strong> indicato e clicca su <strong>Verifica ora</strong>. Così dimostriamo che il dominio è tuo.</>,
    guia3: <>3. Dopo la verifica, punta un <strong>CNAME</strong> verso <code>cname.vercel-dns.com</code>. Da quel momento è automatico: appena il DNS si propaga, il tuo dominio inizia a servire il negozio da solo.</>,
    guiaPrazo: "Il DNS può richiedere da pochi minuti ad alcune ore per propagarsi — se non funziona subito è normale, aspetta un po' e ricarica.",
    guiaAviso: <>
      <strong>Attenzione:</strong> puntare il dominio verso di noi <strong>sostituisce</strong> quello che c&apos;è oggi — non è un&apos;integrazione affiancata. Se hai già un sito su <code>www.ilsuoristorante.it</code>, ad esempio, e non vuoi perderlo, registra qui un sottodominio diverso (tipo <code>menu.ilsuoristorante.it</code> o <code>ordini.ilsuoristorante.it</code>) invece dell&apos;indirizzo principale — così convivono entrambi.
      {" "}Il CNAME funziona solo su un sottodominio: per il dominio radice senza <code>www</code> (es: <code>ilsuoristorante.it</code> puro), il record giusto è di tipo <strong>A</strong> verso l&apos;IP <code>76.76.21.21</code>, non CNAME.
    </>,
    identidadeTitulo: "Identità visiva del negozio",
    identidadeDescricao: "Logo, foto di copertina e colore del marchio che appaiono nel tuo negozio pubblico. Incolla il link di un'immagine già ospitata altrove (es: sul tuo sito, Google Drive pubblico, Imgur) — non è un caricamento di file.",
    logoLabel: "URL del logo", capaLabel: "URL della foto di copertina", corLabel: "Colore del marchio",
    salvarIdentidade: "Salva identità visiva",
  },
};

export default async function DominioPage() {
  const { supabase, restaurantOwnerId, isOwner, locale } = await requireRestaurantSubscription();
  const t = CONTEUDO[locale];
  const statusLabel = STATUS_LABEL[locale];
  const intlLocale = locale === "it" ? "it-IT" : "pt-BR";

  if (!isOwner) {
    redirect("/restaurante");
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, slug, logo_url, capa_url, cor_primaria")
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

  const { data: dominios } = await supabase
    .from("restaurant_domains")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .order("created_at");

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {t.lojaFuncionaEm(
          <a href={`/loja/${restaurant.slug}`} className="text-amber-700 underline underline-offset-2">
            incassa.eu/loja/{restaurant.slug}
          </a>,
        )}
      </p>

      <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-stone-700">
        <h2 className="font-semibold text-stone-900">{t.guiaTitulo}</h2>
        <ol className="mt-2 space-y-2">
          <li>{t.guia1}</li>
          <li>{t.guia2}</li>
          <li>{t.guia3}</li>
        </ol>
        <p className="mt-3 text-xs text-stone-500">{t.guiaPrazo}</p>
        <p className="mt-3 rounded-lg bg-white p-3 text-xs text-stone-600">{t.guiaAviso}</p>
      </section>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="font-semibold text-stone-900">{t.cadastrarDominio}</h2>
        <form action={addRestaurantDomain} className="mt-2 flex flex-wrap gap-2">
          <input
            name="hostname"
            required
            placeholder={t.dominioPlaceholder}
            className="min-w-56 flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
            {t.adicionar}
          </button>
        </form>
      </section>

      <section className="mt-6 space-y-3">
        {(dominios ?? []).map((d) => (
          <div key={d.id} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-stone-900">
                {d.hostname} {d.is_primary && <span className="text-xs text-stone-400">{t.principal}</span>}
              </p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSE[d.verification_status] ?? "bg-stone-100 text-stone-600"}`}>
                {statusLabel[d.verification_status] ?? d.verification_status}
              </span>
            </div>

            {d.verification_status !== "verified" && (
              <div className="mt-3 rounded-lg bg-stone-50 p-3 text-xs text-stone-600">
                <p className="font-medium text-stone-700">{t.passo1}</p>
                <p className="mt-1">
                  {t.passo1Descricao(d.hostname)}
                </p>
                <code className="mt-1 block break-all rounded bg-white px-2 py-1 text-stone-900">{d.verification_token}</code>
                <form action={verifyRestaurantDomain.bind(null, d.id)} className="mt-2">
                  <button type="submit" className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white">
                    {t.verificarAgora}
                  </button>
                </form>
                <p className="mt-3 font-medium text-stone-700">{t.passo2}</p>
                <p className="mt-1">
                  {t.passo2Descricao(d.hostname)}
                </p>
              </div>
            )}

            {d.verification_status === "verified" && (
              <p className="mt-2 text-xs text-stone-500">
                {t.verificadoEm(d.verified_at ? new Date(d.verified_at).toLocaleString(intlLocale) : "—")} {t.cnameInfo(d.hostname)}
              </p>
            )}

            <form action={deleteRestaurantDomain.bind(null, d.id)} className="mt-3">
              <button type="submit" className="text-xs text-red-600 hover:underline">
                {t.remover}
              </button>
            </form>
          </div>
        ))}
        {(dominios ?? []).length === 0 && <p className="text-sm text-stone-500">{t.nenhumDominio}</p>}
      </section>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="font-semibold text-stone-900">{t.identidadeTitulo}</h2>
        <p className="mt-1 text-sm text-stone-600">{t.identidadeDescricao}</p>
        <form action={updateIdentidadeVisual} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-stone-600 sm:col-span-2">
            <span className="mb-1 block text-xs text-stone-500">{t.logoLabel}</span>
            <input
              name="logo_url"
              type="url"
              defaultValue={restaurant.logo_url ?? ""}
              placeholder="https://..."
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-stone-600 sm:col-span-2">
            <span className="mb-1 block text-xs text-stone-500">{t.capaLabel}</span>
            <input
              name="capa_url"
              type="url"
              defaultValue={restaurant.capa_url ?? ""}
              placeholder="https://..."
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-stone-600">
            <span className="mb-1 block text-xs text-stone-500">{t.corLabel}</span>
            <div className="flex items-center gap-2">
              <input
                name="cor_primaria"
                type="color"
                defaultValue={restaurant.cor_primaria ?? "#b84432"}
                className="h-10 w-14 rounded-md border border-stone-300"
              />
              <span className="text-xs text-stone-400">{restaurant.cor_primaria ?? "#b84432"}</span>
            </div>
          </label>
          <button type="submit" className="h-fit w-fit self-end rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
            {t.salvarIdentidade}
          </button>
        </form>
      </section>
    </div>
  );
}

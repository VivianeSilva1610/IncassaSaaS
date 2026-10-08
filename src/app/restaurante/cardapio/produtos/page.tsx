import {
  addProduct,
  deleteProduct,
  toggleProductAtivo,
  toggleProductVisivelSite,
  updateProduct,
} from "@/app/restaurante/actions";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { EditProductDetails } from "./edit-product-details";

const DIAS: Record<RestauranteLocale, string[]> = {
  "pt-BR": ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
  it: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"],
};

const CONTEUDO: Record<RestauranteLocale, {
  titulo: string; descricao: string; nomeProduto: string; precoPlaceholder: string; prato: string; bebida: string;
  sobremesa: string; descricaoPlaceholder: string; fotoUrl: string; videoUrl: string; adicionar: string;
  pratos: string; bebidas: string; sobremesas: string; ocultoSite: string; publicado: (dias: string) => string;
  publicadoTodos: string; editar: string; foto: string; removerFoto: string; video: string; removerVideo: string;
  diasNoSite: string; salvar: string; publicar: string; ocultar: string; desativar: string; ativar: string;
  excluir: string; nenhumProduto: string;
}> = {
  "pt-BR": {
    titulo: "Menu do site", descricao: "Cadastre os pratos que seus clientes encontrarão e comprarão na loja online.",
    nomeProduto: "Nome do produto", precoPlaceholder: "Preço (R$)", prato: "Prato", bebida: "Bebida", sobremesa: "Sobremesa",
    descricaoPlaceholder: "Descrição", fotoUrl: "URL da foto (opcional)", videoUrl: "URL do vídeo (opcional)",
    adicionar: "Adicionar ao menu online", pratos: "Pratos", bebidas: "Bebidas", sobremesas: "Sobremesas",
    ocultoSite: "Oculto no site", publicado: (dias) => `Publicado: ${dias}`, publicadoTodos: "Publicado todos os dias",
    editar: "Editar", foto: "Foto", removerFoto: "Remover foto", video: "Vídeo", removerVideo: "Remover vídeo",
    diasNoSite: "Dias no site (nenhum = todos)", salvar: "Salvar", publicar: "Publicar", ocultar: "Ocultar",
    desativar: "Desativar", ativar: "Ativar", excluir: "Excluir", nenhumProduto: "Nenhum prato cadastrado para o site.",
  },
  it: {
    titulo: "Menu del sito", descricao: "Registra i piatti che i tuoi clienti troveranno e acquisteranno nel negozio online.",
    nomeProduto: "Nome del prodotto", precoPlaceholder: "Prezzo (EUR)", prato: "Piatto", bebida: "Bevanda", sobremesa: "Dolce",
    descricaoPlaceholder: "Descrizione", fotoUrl: "URL della foto (opzionale)", videoUrl: "URL del video (opzionale)",
    adicionar: "Aggiungi al menu online", pratos: "Piatti", bebidas: "Bevande", sobremesas: "Dolci",
    ocultoSite: "Nascosto sul sito", publicado: (dias) => `Pubblicato: ${dias}`, publicadoTodos: "Pubblicato tutti i giorni",
    editar: "Modifica", foto: "Foto", removerFoto: "Rimuovi foto", video: "Video", removerVideo: "Rimuovi video",
    diasNoSite: "Giorni sul sito (nessuno = tutti)", salvar: "Salva", publicar: "Pubblica", ocultar: "Nascondi",
    desativar: "Disattiva", ativar: "Attiva", excluir: "Elimina", nenhumProduto: "Nessun piatto registrato per il sito.",
  },
};

export default async function ProdutosOnlinePage() {
  const { supabase, restaurantOwnerId, locale } = await requireRestaurantSubscription("cardapio");
  const t = CONTEUDO[locale];
  const dias = DIAS[locale];
  const categorias = [["prato", t.pratos], ["bebida", t.bebidas], ["sobremesa", t.sobremesas]] as const;
  const formatReal = (value: number) => (locale === "it"
    ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value));
  const { data: products } = await supabase
    .from("del_products")
    .select("*")
    .eq("owner_id", restaurantOwnerId)
    .in("categoria", ["prato", "bebida", "sobremesa"])
    .order("nome");

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">{t.descricao}</p>

      <form action={addProduct} className="mt-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
        <input name="nome" required placeholder={t.nomeProduto} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="preco" type="number" step="0.01" min="0" required placeholder={t.precoPlaceholder} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <select name="categoria" className="rounded-md border border-stone-300 px-3 py-2 text-sm">
          <option value="prato">{t.prato}</option><option value="bebida">{t.bebida}</option><option value="sobremesa">{t.sobremesa}</option>
        </select>
        <input name="descrizione" placeholder={t.descricaoPlaceholder} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="imagem_url" type="url" placeholder={t.fotoUrl} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="video_url" type="url" placeholder={t.videoUrl} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 sm:col-span-2">{t.adicionar}</button>
      </form>

      {categorias.map(([categoria, titulo]) => {
        const itens = (products ?? []).filter((produto) => produto.categoria === categoria);
        if (!itens.length) return null;
        return (
          <section key={categoria} className="mt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">{titulo}</h2>
            <div className="mt-2 space-y-2">
              {itens.map((produto) => (
                <article key={produto.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {produto.video_url ? <video src={produto.video_url} muted playsInline preload="metadata" className="h-12 w-12 rounded-lg object-cover" /> : produto.imagem_url && <img src={produto.imagem_url} alt={produto.nome} className="h-12 w-12 rounded-lg object-cover" />}
                    <div className={produto.ativo ? "" : "text-stone-400 line-through"}>
                      <p className="font-medium">{produto.nome} — {formatReal(Number(produto.preco))}</p>
                      {produto.descrizione && <p className="text-xs text-stone-500">{produto.descrizione}</p>}
                      <p className="text-xs text-stone-400">
                        {produto.visivel_site === false ? t.ocultoSite : produto.dias_site?.length ? t.publicado(produto.dias_site.map((dia: number) => dias[dia]).join(", ")) : t.publicadoTodos}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <EditProductDetails label={t.editar}>
                      <form action={updateProduct.bind(null, produto.id)} className="absolute right-0 z-10 mt-2 grid w-72 gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-lg">
                        <input name="nome" required defaultValue={produto.nome} className="rounded-md border px-2 py-1.5 text-sm" />
                        <input name="preco" type="number" step="0.01" min="0" required defaultValue={produto.preco} className="rounded-md border px-2 py-1.5 text-sm" />
                        <select name="categoria" defaultValue={produto.categoria} className="rounded-md border px-2 py-1.5 text-sm">
                          <option value="prato">{t.prato}</option><option value="bebida">{t.bebida}</option><option value="sobremesa">{t.sobremesa}</option>
                        </select>
                        <input name="descrizione" defaultValue={produto.descrizione ?? ""} placeholder={t.descricaoPlaceholder} className="rounded-md border px-2 py-1.5 text-sm" />
                        <label className="text-[11px] text-stone-500">{t.foto}<input name="imagem_url" type="url" defaultValue={produto.imagem_url ?? ""} placeholder="https://..." className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm text-stone-900" /></label>
                        {produto.imagem_url && <label className="flex items-center gap-1 text-xs text-red-600"><input name="remover_imagem" type="checkbox" /> {t.removerFoto}</label>}
                        <label className="text-[11px] text-stone-500">{t.video}<input name="video_url" type="url" defaultValue={produto.video_url ?? ""} placeholder="Link direto para MP4/WebM" className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm text-stone-900" /></label>
                        {produto.video_url && <label className="flex items-center gap-1 text-xs text-red-600"><input name="remover_video" type="checkbox" /> {t.removerVideo}</label>}
                        <fieldset><legend className="text-[11px] text-stone-500">{t.diasNoSite}</legend><div className="mt-1 flex flex-wrap gap-2">
                          {dias.map((label, dia) => <label key={dia} className="flex items-center gap-1 text-xs"><input type="checkbox" name="dias_site" value={dia} defaultChecked={(produto.dias_site ?? []).includes(dia)} />{label}</label>)}
                        </div></fieldset>
                        <button className="rounded-md bg-stone-900 px-3 py-1.5 text-xs text-white">{t.salvar}</button>
                      </form>
                    </EditProductDetails>
                    <form action={toggleProductVisivelSite.bind(null, produto.id, produto.visivel_site !== false)}><button className="text-xs text-amber-700">{produto.visivel_site === false ? t.publicar : t.ocultar}</button></form>
                    <form action={toggleProductAtivo.bind(null, produto.id, produto.ativo)}><button className="text-xs text-amber-700">{produto.ativo ? t.desativar : t.ativar}</button></form>
                    <form action={deleteProduct.bind(null, produto.id)}><button className="text-xs text-red-600">{t.excluir}</button></form>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
      {(products ?? []).length === 0 && <p className="mt-6 text-sm text-stone-500">{t.nenhumProduto}</p>}
    </div>
  );
}

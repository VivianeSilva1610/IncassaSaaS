import Link from "next/link";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { addZonaEntrega, updateZonaEntrega, toggleZonaEntregaAtivo, deleteZonaEntrega } from "@/app/restaurante/actions";

const CONTEUDO: Record<RestauranteLocale, {
  voltar: string; titulo: string; descricao: string; nomeBairroPlaceholder: string; distanciaPlaceholder: string;
  taxaPlaceholder: string; pedidoMinimoPlaceholder: string; adicionar: string; sempreGratis: string;
  gratisAPartirDe: (valor: string) => string; editar: string; distanciaEditPlaceholder: string;
  taxaEditPlaceholder: string; pedidoMinimoEditPlaceholder: string; salvar: string; desativar: string;
  ativar: string; excluir: string; nenhumBairro: string;
}> = {
  "pt-BR": {
    voltar: "← Custos", titulo: "Taxa de entrega por bairro",
    descricao: "Cadastre os bairros que você atende (inicialmente até uns 30km) com a distância aproximada e a taxa. Deixe a taxa em 0 pra oferecer entrega sempre grátis naquele bairro, ou defina um pedido mínimo pra grátis — abaixo do mínimo, cobra a taxa normal. Bairro fora dessa lista não aparece como opção pro cliente no site.",
    nomeBairroPlaceholder: "Nome do bairro", distanciaPlaceholder: "Distância aprox. (km)",
    taxaPlaceholder: "Taxa (R$, 0 = sempre grátis)", pedidoMinimoPlaceholder: "Pedido mín. p/ grátis (opcional)",
    adicionar: "Adicionar bairro", sempreGratis: "Sempre grátis",
    gratisAPartirDe: (valor) => `grátis a partir de ${valor}`,
    editar: "Editar", distanciaEditPlaceholder: "Distância (km)", taxaEditPlaceholder: "Taxa (R$)",
    pedidoMinimoEditPlaceholder: "Pedido mín. p/ grátis", salvar: "Salvar", desativar: "Desativar", ativar: "Ativar",
    excluir: "Excluir", nenhumBairro: "Nenhum bairro cadastrado ainda — a entrega no site fica indisponível até cadastrar pelo menos um.",
  },
  it: {
    voltar: "← Costi", titulo: "Costo di consegna per zona",
    descricao: "Registra le zone che servi (inizialmente fino a circa 30km) con la distanza approssimativa e il costo. Lascia il costo a 0 per offrire consegna sempre gratuita in quella zona, oppure definisci un ordine minimo per la gratuità — sotto il minimo, si applica il costo normale. Una zona fuori da questo elenco non appare come opzione per il cliente sul sito.",
    nomeBairroPlaceholder: "Nome della zona", distanciaPlaceholder: "Distanza appross. (km)",
    taxaPlaceholder: "Costo (EUR, 0 = sempre gratuito)", pedidoMinimoPlaceholder: "Ordine min. per gratuità (opzionale)",
    adicionar: "Aggiungi zona", sempreGratis: "Sempre gratuito",
    gratisAPartirDe: (valor) => `gratuito a partire da ${valor}`,
    editar: "Modifica", distanciaEditPlaceholder: "Distanza (km)", taxaEditPlaceholder: "Costo (EUR)",
    pedidoMinimoEditPlaceholder: "Ordine min. per gratuità", salvar: "Salva", desativar: "Disattiva", ativar: "Attiva",
    excluir: "Elimina", nenhumBairro: "Nessuna zona registrata ancora — la consegna sul sito resta non disponibile finché non ne registri almeno una.",
  },
};

export default async function CustosEntregaPage() {
  const { supabase, locale } = await requireRestaurantSubscription("custos");
  const t = CONTEUDO[locale];
  const formatReal = (value: number) => (locale === "it"
    ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value));

  const { data: zonasEntrega } = await supabase
    .from("del_zonas_entrega")
    .select("*")
    .order("distancia_km", { ascending: true, nullsFirst: false });

  return (
    <div>
      <Link href="/restaurante/custos" className="text-sm text-amber-700 underline underline-offset-2">
        {t.voltar}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {t.descricao}
      </p>

      <form action={addZonaEntrega} className="mt-4 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-4">
        <input name="bairro" required placeholder={t.nomeBairroPlaceholder} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="distancia_km" type="number" step="0.1" min="0" max="30" placeholder={t.distanciaPlaceholder} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="taxa" type="number" step="0.01" min="0" required placeholder={t.taxaPlaceholder} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="pedido_minimo_gratis" type="number" step="0.01" min="0" placeholder={t.pedidoMinimoPlaceholder} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <button
          type="submit"
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-4"
        >
          {t.adicionar}
        </button>
      </form>

      <div className="mt-3 space-y-1.5">
        {(zonasEntrega ?? []).map((z) => (
          <div key={z.id} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className={z.ativo ? "text-stone-900" : "text-stone-400 line-through"}>
                {z.bairro}
                {z.distancia_km != null && ` — ~${Number(z.distancia_km)}km`}
                {" — "}
                {Number(z.taxa) === 0 ? t.sempreGratis : formatReal(Number(z.taxa))}
                {z.pedido_minimo_gratis != null && Number(z.taxa) > 0 && (
                  <span className="text-stone-500"> · {t.gratisAPartirDe(formatReal(Number(z.pedido_minimo_gratis)))}</span>
                )}
              </span>
              <div className="flex shrink-0 items-center gap-3">
                <details className="relative">
                  <summary className="cursor-pointer list-none text-xs text-amber-700 hover:underline">{t.editar}</summary>
                  <form
                    action={updateZonaEntrega.bind(null, z.id)}
                    className="absolute right-0 z-10 mt-2 grid w-64 gap-2 rounded-lg border border-stone-200 bg-white p-3 shadow-lg"
                  >
                    <input name="bairro" required defaultValue={z.bairro} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                    <input name="distancia_km" type="number" step="0.1" min="0" max="30" defaultValue={z.distancia_km ?? ""} placeholder={t.distanciaEditPlaceholder} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                    <input name="taxa" type="number" step="0.01" min="0" required defaultValue={z.taxa} placeholder={t.taxaEditPlaceholder} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                    <input name="pedido_minimo_gratis" type="number" step="0.01" min="0" defaultValue={z.pedido_minimo_gratis ?? ""} placeholder={t.pedidoMinimoEditPlaceholder} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                    <button type="submit" className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-700">
                      {t.salvar}
                    </button>
                  </form>
                </details>
                <form action={toggleZonaEntregaAtivo.bind(null, z.id, z.ativo)}>
                  <button type="submit" className="text-xs text-amber-700 hover:underline">
                    {z.ativo ? t.desativar : t.ativar}
                  </button>
                </form>
                <form action={deleteZonaEntrega.bind(null, z.id)}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">{t.excluir}</button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {(zonasEntrega ?? []).length === 0 && <p className="text-sm text-stone-500">{t.nenhumBairro}</p>}
      </div>
    </div>
  );
}

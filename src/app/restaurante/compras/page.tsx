import Link from "next/link";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";

const CONTEUDO: Record<RestauranteLocale, {
  titulo: string; subtitulo: string;
  modulos: { href: string; icone: string; titulo: string; descricao: string }[];
}> = {
  "pt-BR": {
    titulo: "Compras", subtitulo: "Planejamento, autorização, fornecedores e recebimento de compras.",
    modulos: [
      { href: "/restaurante/compras/solicitacoes", icone: "🙋", titulo: "Solicitações", descricao: "Peça a reposição de um material — sem fornecedor, sem preço negociado." },
      { href: "/restaurante/compras/orcamentos", icone: "📨", titulo: "Orçamentos", descricao: "Consulte fornecedores, compare preços/prazo/condição e aprove o vencedor." },
      { href: "/restaurante/compras/pedidos", icone: "📝", titulo: "Pedidos de compra", descricao: "Gerados ao aprovar um orçamento — ou crie um direto, como antes." },
      { href: "/restaurante/compras/fornecedor", icone: "🧾", titulo: "Compra de fornecedor", descricao: "Registre uma compra manual e a entrada dos materiais recebidos." },
      { href: "/restaurante/compras/nfe", icone: "📥", titulo: "Compras e fornecedores (NF-e)", descricao: "Importe o XML, confira os itens, fornecedores, parcelas e recebimento." },
    ],
  },
  it: {
    titulo: "Acquisti", subtitulo: "Pianificazione, autorizzazione, fornitori e ricevimento degli acquisti.",
    modulos: [
      { href: "/restaurante/compras/solicitacoes", icone: "🙋", titulo: "Richieste", descricao: "Chiedi il riassortimento di un materiale — senza fornitore, senza prezzo negoziato." },
      { href: "/restaurante/compras/orcamentos", icone: "📨", titulo: "Preventivi", descricao: "Consulta i fornitori, confronta prezzo/tempi/condizioni e approva il vincitore." },
      { href: "/restaurante/compras/pedidos", icone: "📝", titulo: "Ordini di acquisto", descricao: "Generati approvando un preventivo — oppure crea un ordine diretto." },
      { href: "/restaurante/compras/fornecedor", icone: "🧾", titulo: "Acquisto da fornitore", descricao: "Registra un acquisto manuale e l'entrata dei materiali ricevuti." },
    ],
  },
};

export default async function ComprasPage() {
  const { locale } = await requireRestaurantSubscription("compras");
  const t = CONTEUDO[locale];
  return <div><h1 className="text-2xl font-bold text-stone-900">{t.titulo}</h1><p className="mt-1 text-sm text-stone-600">{t.subtitulo}</p><div className="mt-6 grid gap-4 sm:grid-cols-2">{t.modulos.map((modulo) => <Link key={modulo.href} href={modulo.href} className="rounded-xl border border-stone-200 bg-white p-5 hover:border-amber-300"><span className="text-xl">{modulo.icone}</span><h2 className="mt-3 font-semibold text-stone-900">{modulo.titulo}</h2><p className="mt-1 text-sm text-stone-500">{modulo.descricao}</p></Link>)}</div></div>;
}

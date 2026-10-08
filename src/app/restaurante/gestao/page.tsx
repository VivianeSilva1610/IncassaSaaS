import Link from "next/link";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";

const CONTEUDO: Record<RestauranteLocale, {
  titulo: string; subtitulo: string; abrir: string;
  modulos: { href: string; titulo: string; descricao: string; icone: string }[];
}> = {
  "pt-BR": {
    titulo: "Gestão", subtitulo: "Relatórios gerenciais do restaurante, calculados a partir dos pedidos, fichas técnicas e custos já cadastrados.", abrir: "Abrir módulo →",
    modulos: [
      { href: "/restaurante/gestao/vendas", titulo: "Vendas", descricao: "Vendas por produto e por canal, produtos mais vendidos e ticket médio.", icone: "📈" },
      { href: "/restaurante/gestao/margem", titulo: "Margem e CMV", descricao: "Margem por prato, custo da mercadoria vendida e lucro estimado do período.", icone: "💰" },
      { href: "/restaurante/gestao/comparativo", titulo: "Comparativo mensal", descricao: "Receita, CMV, margem e lucro estimado lado a lado, mês a mês.", icone: "📊" },
      { href: "/restaurante/gestao/desperdicio", titulo: "Desperdício", descricao: "Perdas registradas no estoque (manual ou por inventário), valorizadas pelo custo da época.", icone: "🗑️" },
    ],
  },
  it: {
    titulo: "Gestione", subtitulo: "Report gestionali del ristorante, calcolati a partire da ordini, schede tecniche e costi già registrati.", abrir: "Apri modulo →",
    modulos: [
      { href: "/restaurante/gestao/vendas", titulo: "Vendite", descricao: "Vendite per prodotto e per canale, prodotti più venduti e scontrino medio.", icone: "📈" },
      { href: "/restaurante/gestao/margem", titulo: "Margine e costo del venduto", descricao: "Margine per piatto, costo del venduto e profitto stimato del periodo.", icone: "💰" },
      { href: "/restaurante/gestao/comparativo", titulo: "Confronto mensile", descricao: "Ricavi, costo del venduto, margine e profitto stimato affiancati, mese per mese.", icone: "📊" },
      { href: "/restaurante/gestao/desperdicio", titulo: "Spreco", descricao: "Perdite registrate in magazzino (manuali o da inventario), valorizzate al costo dell'epoca.", icone: "🗑️" },
    ],
  },
};

export default async function GestaoPage() {
  const { locale } = await requireRestaurantSubscription("gestao");
  const t = CONTEUDO[locale];

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {t.subtitulo}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {t.modulos.map((modulo) => (
          <Link
            key={modulo.href}
            href={modulo.href}
            className="group rounded-xl border border-stone-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-sm"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-xl text-amber-700">
                {modulo.icone}
              </span>
              <div>
                <h2 className="font-semibold text-stone-900 group-hover:text-amber-800">{modulo.titulo}</h2>
                <p className="mt-1 text-sm leading-5 text-stone-500">{modulo.descricao}</p>
                <span className="mt-3 inline-block text-xs font-medium text-amber-700">{t.abrir}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

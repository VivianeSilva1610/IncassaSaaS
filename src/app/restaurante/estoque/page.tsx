import Link from "next/link";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";

const CONTEUDO: Record<RestauranteLocale, {
  titulo: string; subtitulo: string; abrir: string; vencendo: string;
  modulos: { href: string; titulo: string; descricao: string; icone: string }[];
}> = {
  "pt-BR": {
    titulo: "Estoque", subtitulo: "Ingredientes e matérias-primas do restaurante.",
    abrir: "Abrir módulo →", vencendo: "vencendo",
    modulos: [
      { href: "/restaurante/estoque/produtos", titulo: "Produtos", descricao: "Cadastre novos ingredientes, edite, exclua e registre entradas/saídas/ajustes.", icone: "📦" },
      { href: "/restaurante/estoque/inventario", titulo: "Inventário", descricao: "Conte o estoque físico e deixe o sistema ajustar as diferenças (perda ou sobra) sozinho.", icone: "📋" },
      { href: "/restaurante/estoque/relatorio", titulo: "Relatório", descricao: "Quantidade final por período (mensal ou anual), com entradas/saídas — CSV ou Excel.", icone: "📊" },
      { href: "/restaurante/estoque/validades", titulo: "Lotes e validade", descricao: "Registre lote/validade nas entradas e veja o que está perto de vencer.", icone: "⏳" },
    ],
  },
  it: {
    titulo: "Magazzino", subtitulo: "Ingredienti e materie prime del ristorante.",
    abrir: "Apri modulo →", vencendo: "in scadenza",
    modulos: [
      { href: "/restaurante/estoque/produtos", titulo: "Prodotti", descricao: "Registra nuovi ingredienti, modifica, elimina e registra entrate/uscite/rettifiche.", icone: "📦" },
      { href: "/restaurante/estoque/inventario", titulo: "Inventario", descricao: "Conta la scorta fisica e lascia che il sistema rettifichi le differenze (perdita o eccedenza) da solo.", icone: "📋" },
      { href: "/restaurante/estoque/relatorio", titulo: "Report", descricao: "Quantità finale per periodo (mensile o annuale), con entrate/uscite — CSV o Excel.", icone: "📊" },
      { href: "/restaurante/estoque/validades", titulo: "Lotti e scadenza", descricao: "Registra lotto/scadenza nelle entrate e vedi cosa sta per scadere.", icone: "⏳" },
    ],
  },
};

export default async function EstoquePage() {
  const { supabase, locale } = await requireRestaurantSubscription("estoque");
  const t = CONTEUDO[locale];

  const emSeteDias = new Date();
  emSeteDias.setDate(emSeteDias.getDate() + 7);
  const { count: vencendoCount } = await supabase
    .from("del_lotes_estoque")
    .select("id", { count: "exact", head: true })
    .not("validade", "is", null)
    .lte("validade", emSeteDias.toISOString().slice(0, 10));

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
                <h2 className="font-semibold text-stone-900 group-hover:text-amber-800">
                  {modulo.titulo}
                  {modulo.href === "/restaurante/estoque/validades" && !!vencendoCount && (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">{vencendoCount} {t.vencendo}</span>
                  )}
                </h2>
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

import Link from "next/link";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";

const LINKS: Record<RestauranteLocale, { href: string; label: string }[]> = {
  "pt-BR": [
    { href: "/restaurante/fiscal", label: "Visão geral" },
    { href: "/restaurante/fiscal/emissoes", label: "Emissões" },
    { href: "/restaurante/fiscal/fechamento-diario", label: "Fechamento diário" },
    { href: "/restaurante/fiscal/fechamento-mensal", label: "Fechamento mensal" },
    { href: "/restaurante/fiscal/exportacao", label: "Exportação" },
    { href: "/restaurante/fiscal/estabelecimento", label: "Estabelecimento" },
    { href: "/restaurante/fiscal/classificacao", label: "Classificação" },
    { href: "/restaurante/fiscal/notas", label: "Notas fiscais" },
  ],
  it: [
    { href: "/restaurante/fiscal", label: "Panoramica" },
    { href: "/restaurante/fiscal/emissoes", label: "Emissioni" },
    { href: "/restaurante/fiscal/fechamento-diario", label: "Chiusura giornaliera" },
    { href: "/restaurante/fiscal/fechamento-mensal", label: "Chiusura mensile" },
    { href: "/restaurante/fiscal/exportacao", label: "Esportazione" },
    { href: "/restaurante/fiscal/estabelecimento", label: "Dati fiscali" },
    { href: "/restaurante/fiscal/classificacao", label: "Classificazione" },
    { href: "/restaurante/fiscal/notas", label: "Documenti fiscali" },
  ],
};

export default async function FiscalLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await requireRestaurantSubscription("fiscal");
  const links = LINKS[locale];

  return (
    <div>
      <nav aria-label="Módulos fiscais" className="mb-6 flex flex-wrap gap-2 border-b border-stone-200 pb-4">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:border-amber-300 hover:text-amber-800"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}

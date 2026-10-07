import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRestaurantSubscription } from "@/lib/subscription";

const LINKS = [
  { href: "/restaurante/fiscal", label: "Visão geral" },
  { href: "/restaurante/fiscal/emissoes", label: "Emissões" },
  { href: "/restaurante/fiscal/fechamento-diario", label: "Fechamento diário" },
  { href: "/restaurante/fiscal/fechamento-mensal", label: "Fechamento mensal" },
  { href: "/restaurante/fiscal/exportacao", label: "Exportação" },
  { href: "/restaurante/fiscal/estabelecimento", label: "Estabelecimento" },
  { href: "/restaurante/fiscal/classificacao", label: "Classificação" },
  { href: "/restaurante/fiscal/notas", label: "Notas fiscais" },
];

export default async function FiscalLayout({ children }: { children: React.ReactNode }) {
  const { isOwner } = await requireRestaurantSubscription();
  if (!isOwner) redirect("/restaurante");

  return (
    <div>
      <nav aria-label="Módulos fiscais" className="mb-6 flex flex-wrap gap-2 border-b border-stone-200 pb-4">
        {LINKS.map((item) => (
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

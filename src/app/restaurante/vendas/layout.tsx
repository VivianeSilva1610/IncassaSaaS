import Link from "next/link";

const LINKS = [
  { href: "/restaurante/vendas", label: "Visão geral" },
  { href: "/restaurante/vendas/novo", label: "Novo pedido" },
  { href: "/restaurante/vendas/pedidos", label: "Pedidos" },
  { href: "/restaurante/vendas/mesas", label: "Mesas" },
];

export default function VendasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav aria-label="Módulos de vendas" className="mb-6 flex flex-wrap gap-2 border-b border-stone-200 pb-4">
        {LINKS.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:border-amber-300 hover:text-amber-800">
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}

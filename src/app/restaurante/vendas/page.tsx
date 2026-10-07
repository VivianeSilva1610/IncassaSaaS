import Link from "next/link";

const MODULOS = [
  { href: "/restaurante/vendas/novo", titulo: "Novo pedido", descricao: "Registre uma venda de balcão, telefone ou entrega.", icone: "+" },
  { href: "/restaurante/vendas/pedidos", titulo: "Pedidos", descricao: "Acompanhe pagamentos, status, itens e documentos fiscais.", icone: "▤" },
  { href: "/restaurante/vendas/mesas", titulo: "Mesas e comandas", descricao: "Administre QR codes, pedidos por mesa e fechamento de comandas.", icone: "⌂" },
];

export default function VendasPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Vendas</h1>
      <p className="mt-1 text-sm text-stone-600">Escolha uma área para registrar e acompanhar as vendas do restaurante.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {MODULOS.map((modulo) => (
          <Link key={modulo.href} href={modulo.href} className="group rounded-xl border border-stone-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-sm">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-xl text-amber-700">{modulo.icone}</span>
              <div>
                <h2 className="font-semibold text-stone-900 group-hover:text-amber-800">{modulo.titulo}</h2>
                <p className="mt-1 text-sm leading-5 text-stone-500">{modulo.descricao}</p>
                <span className="mt-3 inline-block text-xs font-medium text-amber-700">Abrir módulo →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

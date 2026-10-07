import Link from "next/link";
import { emitirNotaFiscal } from "@/app/restaurante/actions";
import { requireRestaurantSubscription } from "@/lib/subscription";

function real(value: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value); }
function dataHora(value: string | null) { return value ? new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—"; }

export default async function EmissoesFiscaisPage() {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();
  const { data: pedidos } = await supabase
    .from("del_orders")
    .select("id, cliente_nome, totale, canal, pago_em, status, del_notas_fiscais(id, status, erro_mensagem, created_at)")
    .eq("owner_id", restaurantOwnerId)
    .eq("pago", true)
    .neq("status", "cancelado")
    .order("pago_em", { ascending: false })
    .limit(200);

  const fila = (pedidos ?? []).map((pedido) => {
    const notas = [...(pedido.del_notas_fiscais ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { pedido, nota: notas[0] ?? null };
  }).filter(({ nota }) => !nota || nota.status === "erro" || nota.status === "pendente");

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Emissões fiscais</h1>
      <p className="mt-1 text-sm text-stone-600">Fila central de vendas pagas sem documento, pendentes ou com falha de emissão.</p>
      <div className="mt-6 space-y-3">
        {fila.map(({ pedido, nota }) => (
          <article key={pedido.id} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="font-medium">{pedido.cliente_nome || "Consumidor não identificado"}</p><p className="text-xs text-stone-500">{pedido.canal} · Pago em {dataHora(pedido.pago_em)}</p>{nota?.erro_mensagem && <p className="mt-2 text-xs text-red-600">{nota.erro_mensagem}</p>}</div>
              <div className="text-right"><p className="font-semibold">{real(Number(pedido.totale))}</p><span className={`text-xs ${nota?.status === "erro" ? "text-red-600" : nota?.status === "pendente" ? "text-amber-700" : "text-stone-500"}`}>{nota?.status === "erro" ? "Erro na emissão" : nota?.status === "pendente" ? "Emissão pendente" : "Sem documento fiscal"}</span></div>
            </div>
            <div className="mt-3 flex gap-3 border-t pt-3">
              {nota?.status !== "pendente" && <form action={emitirNotaFiscal.bind(null, pedido.id)}><button className="text-xs font-medium text-amber-700 hover:underline">{nota?.status === "erro" ? "Tentar novamente" : "Emitir NFC-e"}</button></form>}
              <Link href={`/restaurante/vendas/pedidos`} className="text-xs text-stone-500 hover:underline">Ver pedido</Link>
            </div>
          </article>
        ))}
        {fila.length === 0 && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Nenhuma pendência fiscal entre as últimas 200 vendas pagas.</p>}
      </div>
    </div>
  );
}

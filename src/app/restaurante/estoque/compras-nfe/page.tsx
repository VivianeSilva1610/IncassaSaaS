import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { importarNfeFornecedor } from "./actions";

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function ComprasPage({
  searchParams,
}: {
  searchParams: Promise<{ sucesso?: string; erro?: string }>;
}) {
  const { supabase, restaurantOwnerId, isGerente } = await requireRestaurantSubscription("compras");
  const params = await searchParams;
  const { data: notas } = await supabase
    .from("del_notas_entrada")
    .select("id, numero, serie, fornecedor_nome, fornecedor_documento, valor_total, emitida_em, importada_em, status")
    .eq("owner_id", restaurantOwnerId)
    .order("importada_em", { ascending: false })
    .limit(100);

  return (
    <div>
      <Link href="/restaurante/estoque" className="text-sm text-amber-700 underline underline-offset-2">
        ← Estoque
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-stone-900">Compras e fornecedores</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/restaurante/compras/nfe/fornecedores" className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:border-amber-400">
            Fornecedores
          </Link>
          <Link href="/restaurante/compras/nfe/ativos" className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:border-amber-400">
            Ativos imobilizados
          </Link>
        </div>
      </div>
      <p className="mt-1 text-sm text-stone-600">
        Importe o XML autorizado da NF-e recebida. Primeiro confira os produtos; a importação não altera o estoque nem cria pagamento automaticamente.
      </p>

      {params.sucesso && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{params.sucesso}</p>}
      {params.erro && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{params.erro}</p>}

      {isGerente && (
        <form action={importarNfeFornecedor} className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="font-semibold text-stone-900">Importar NF-e de compra</h2>
          <p className="mt-1 text-xs text-stone-500">Aceita XML de NF-e modelo 55 autorizado, com até 5 MB.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input name="xml" type="file" accept=".xml,text/xml,application/xml" required className="min-w-0 flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm" />
            <button className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700">Ler e importar XML</button>
          </div>
        </form>
      )}

      <div className="mt-7 space-y-3">
        <h2 className="font-semibold text-stone-900">Notas de entrada</h2>
        {(notas ?? []).map((nota) => (
          <Link key={nota.id} href={`/restaurante/compras/nfe/${nota.id}`} className="block rounded-xl border border-stone-200 bg-white p-4 hover:border-amber-300">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-stone-900">NF-e {nota.numero}{nota.serie ? ` · série ${nota.serie}` : ""} — {nota.fornecedor_nome}</p>
                <p className="mt-1 text-sm text-stone-500">{nota.fornecedor_documento} · emissão {nota.emitida_em ? new Date(nota.emitida_em).toLocaleDateString("pt-BR") : "não informada"}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-stone-900">{money(Number(nota.valor_total))}</p>
                <span className="text-xs uppercase tracking-wide text-amber-700">{nota.status}</span>
              </div>
            </div>
          </Link>
        ))}
        {(notas ?? []).length === 0 && <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">Nenhuma NF-e de compra importada.</p>}
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRestaurantSubscription } from "@/lib/subscription";

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function FornecedorDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription("estoque");
  const { data: supplier } = await supabase
    .from("del_fornecedores")
    .select("id, documento, razao_social, nome_fantasia, created_at")
    .eq("id", id)
    .eq("owner_id", restaurantOwnerId)
    .maybeSingle();
  if (!supplier) notFound();

  const { data: notes } = await supabase
    .from("del_notas_entrada")
    .select("id, numero, serie, emitida_em, valor_total, status, importada_em")
    .eq("owner_id", restaurantOwnerId)
    .eq("fornecedor_id", supplier.id)
    .order("emitida_em", { ascending: false });

  const validNotes = (notes ?? []).filter((note) => note.status !== "cancelada");
  const processedTotal = validNotes.filter((note) => note.status === "processada").reduce((total, note) => total + Number(note.valor_total), 0);
  const pendingTotal = validNotes.filter((note) => note.status !== "processada").reduce((total, note) => total + Number(note.valor_total), 0);

  return (
    <div>
      <Link href="/restaurante/estoque/compras-nfe/fornecedores" className="text-sm text-amber-700 hover:underline">← Voltar para fornecedores</Link>
      <div className="mt-4 rounded-xl border border-stone-200 bg-white p-5">
        <h1 className="text-2xl font-bold text-stone-900">{supplier.nome_fantasia || supplier.razao_social}</h1>
        <p className="mt-1 text-sm text-stone-600">{supplier.razao_social}</p>
        <p className="mt-1 font-mono text-xs text-stone-500">{supplier.documento}</p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-4"><p className="text-sm text-stone-500">Compras processadas</p><p className="mt-1 text-2xl font-bold text-stone-900">{money(processedTotal)}</p></div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm text-amber-700">Aguardando conferência</p><p className="mt-1 text-2xl font-bold text-amber-900">{money(pendingTotal)}</p></div>
      </div>

      <div className="mt-6 space-y-3">
        <h2 className="font-semibold text-stone-900">Histórico de notas</h2>
        {(notes ?? []).map((note) => (
          <Link key={note.id} href={`/restaurante/estoque/compras-nfe/${note.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4 hover:border-amber-300">
            <div><p className="font-medium text-stone-900">NF-e {note.numero}{note.serie ? ` · série ${note.serie}` : ""}</p><p className="text-sm text-stone-500">{note.emitida_em ? new Date(note.emitida_em).toLocaleDateString("pt-BR") : "Data não informada"}</p></div>
            <div className="text-right"><p className="font-semibold text-stone-900">{money(Number(note.valor_total))}</p><p className="text-xs uppercase text-amber-700">{note.status}</p></div>
          </Link>
        ))}
        {(notes ?? []).length === 0 && <p className="text-sm text-stone-500">Nenhuma nota vinculada.</p>}
      </div>
    </div>
  );
}

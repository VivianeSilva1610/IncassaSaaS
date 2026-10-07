import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function document(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 14) return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  if (digits.length === 11) return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  return value;
}

export default async function FornecedoresPage({ searchParams }: { searchParams: Promise<{ busca?: string }> }) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription("compras");
  const { busca = "" } = await searchParams;
  const normalizedSearch = busca.trim().toLocaleLowerCase("pt-BR");

  const { data: fornecedores } = await supabase
    .from("del_fornecedores")
    .select("id, documento, razao_social, nome_fantasia, created_at")
    .eq("owner_id", restaurantOwnerId)
    .order("razao_social")
    .limit(500);

  const ids = (fornecedores ?? []).map((supplier) => supplier.id);
  const { data: notas } = ids.length
    ? await supabase
        .from("del_notas_entrada")
        .select("fornecedor_id, valor_total, status, emitida_em")
        .eq("owner_id", restaurantOwnerId)
        .in("fornecedor_id", ids)
    : { data: [] };

  const filtered = (fornecedores ?? []).filter((supplier) => {
    if (!normalizedSearch) return true;
    return [supplier.razao_social, supplier.nome_fantasia, supplier.documento]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase("pt-BR").includes(normalizedSearch));
  });

  return (
    <div>
      <Link href="/restaurante/compras/nfe" className="text-sm text-amber-700 hover:underline">← Voltar para compras</Link>
      <h1 className="mt-4 text-2xl font-bold text-stone-900">Fornecedores</h1>
      <p className="mt-1 text-sm text-stone-600">Cadastro formado automaticamente pelos XMLs importados, separado por estabelecimento.</p>

      <form className="mt-5 flex gap-2 rounded-xl border border-stone-200 bg-white p-4">
        <input name="busca" defaultValue={busca} placeholder="Nome, nome fantasia, CNPJ ou CPF" className="min-w-0 flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <button className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">Buscar</button>
        {busca && <Link href="/restaurante/compras/nfe/fornecedores" className="self-center text-sm text-stone-500 hover:underline">Limpar</Link>}
      </form>

      <div className="mt-6 space-y-3">
        {filtered.map((supplier) => {
          const supplierNotes = (notas ?? []).filter((note) => note.fornecedor_id === supplier.id && note.status !== "cancelada");
          const processed = supplierNotes.filter((note) => note.status === "processada");
          const totalProcessed = processed.reduce((total, note) => total + Number(note.valor_total), 0);
          const pending = supplierNotes.filter((note) => note.status !== "processada").length;
          return (
            <Link key={supplier.id} href={`/restaurante/compras/nfe/fornecedores/${supplier.id}`} className="block rounded-xl border border-stone-200 bg-white p-4 hover:border-amber-300">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="font-medium text-stone-900">{supplier.nome_fantasia || supplier.razao_social}</p><p className="text-sm text-stone-500">{supplier.razao_social} · {document(supplier.documento)}</p></div>
                <div className="text-right"><p className="font-semibold text-stone-900">{money(totalProcessed)}</p><p className="text-xs text-stone-500">{processed.length} processada(s){pending ? ` · ${pending} pendente(s)` : ""}</p></div>
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">Nenhum fornecedor encontrado.</p>}
      </div>
    </div>
  );
}

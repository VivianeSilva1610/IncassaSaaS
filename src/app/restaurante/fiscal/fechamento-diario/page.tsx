import { FechamentoFiscalReport } from "@/components/delivery/FechamentoFiscalReport";
import { carregarFechamento } from "@/lib/fiscal/fechamento";
import { requireRestaurantSubscription } from "@/lib/subscription";

function hojeBrasil() {
  const partes = new Intl.DateTimeFormat("en", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const valor = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((parte) => parte.type === tipo)!.value;
  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

export default async function FechamentoDiarioPage({ searchParams }: { searchParams: Promise<{ data?: string }> }) {
  const { data: param } = await searchParams;
  const data = /^\d{4}-\d{2}-\d{2}$/.test(param ?? "") ? param! : hojeBrasil();
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();
  const dados = await carregarFechamento(supabase, restaurantOwnerId, `${data}T00:00:00-03:00`, `${data}T23:59:59.999-03:00`, data, data);
  const periodo = new Date(`${data}T12:00:00-03:00`).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  return <div><form className="mb-6 flex items-end gap-2 print:hidden"><div><label className="block text-xs text-stone-500">Data do fechamento</label><input name="data" type="date" defaultValue={data} className="rounded-md border px-3 py-2 text-sm" /></div><button className="rounded-md bg-stone-900 px-4 py-2 text-sm text-white">Consultar</button></form><FechamentoFiscalReport titulo="Fechamento diário" periodo={periodo} dados={dados} /></div>;
}

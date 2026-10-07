import { FechamentoFiscalReport } from "@/components/delivery/FechamentoFiscalReport";
import { carregarFechamento } from "@/lib/fiscal/fechamento";
import { requireRestaurantSubscription } from "@/lib/subscription";

function mesBrasil() {
  const partes = new Intl.DateTimeFormat("en", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  const valor = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((parte) => parte.type === tipo)!.value;
  return `${valor("year")}-${valor("month")}`;
}

export default async function FechamentoMensalPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { mes: param } = await searchParams;
  const mes = /^\d{4}-\d{2}$/.test(param ?? "") ? param! : mesBrasil();
  const [ano, numeroMes] = mes.split("-").map(Number);
  const ultimoDia = new Date(Date.UTC(ano, numeroMes, 0)).getUTCDate();
  const inicio = `${mes}-01`;
  const fim = `${mes}-${String(ultimoDia).padStart(2, "0")}`;
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();
  const dados = await carregarFechamento(supabase, restaurantOwnerId, `${inicio}T00:00:00-03:00`, `${fim}T23:59:59.999-03:00`, inicio, fim);
  const periodo = new Date(`${inicio}T12:00:00-03:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
  return <div><form className="mb-6 flex items-end gap-2 print:hidden"><div><label className="block text-xs text-stone-500">Mês do fechamento</label><input name="mes" type="month" defaultValue={mes} className="rounded-md border px-3 py-2 text-sm" /></div><button className="rounded-md bg-stone-900 px-4 py-2 text-sm text-white">Consultar</button></form><FechamentoFiscalReport titulo="Fechamento mensal" periodo={periodo} dados={dados} /></div>;
}

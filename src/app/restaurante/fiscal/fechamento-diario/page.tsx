import { FechamentoFiscalReport } from "@/components/delivery/FechamentoFiscalReport";
import { carregarFechamento } from "@/lib/fiscal/fechamento";
import type { FechamentoDados } from "@/lib/fiscal/fechamento";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { fecharCaixaDiario } from "@/app/restaurante/actions";

function hojeBrasil() {
  const partes = new Intl.DateTimeFormat("en", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const valor = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((parte) => parte.type === tipo)!.value;
  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

export default async function FechamentoDiarioPage({ searchParams }: { searchParams: Promise<{ data?: string }> }) {
  const { data: param } = await searchParams;
  const data = /^\d{4}-\d{2}-\d{2}$/.test(param ?? "") ? param! : hojeBrasil();
  const { supabase, restaurantOwnerId, isGerente, locale } = await requireRestaurantSubscription();

  if (locale === "it") {
    return (
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Chiusura giornaliera</h1>
        <p className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
          La chiusura giornaliera è un concetto fiscale brasiliano (legato alla NFC-e) e non si applica a questo
          ristorante. Quest&apos;area non ha ancora un equivalente per l&apos;Italia.
        </p>
      </div>
    );
  }

  const { data: fechamento } = await supabase.from("del_caixa_fechamentos").select("snapshot, fechado_em, fechado_por_email, observacao").eq("owner_id", restaurantOwnerId).eq("data", data).maybeSingle();
  const dados = fechamento ? fechamento.snapshot as unknown as FechamentoDados : await carregarFechamento(supabase, restaurantOwnerId, `${data}T00:00:00-03:00`, `${data}T23:59:59.999-03:00`, data, data);
  const periodo = new Date(`${data}T12:00:00-03:00`).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  return <div><form className="mb-6 flex items-end gap-2 print:hidden"><div><label className="block text-xs text-stone-500">Data do fechamento</label><input name="data" type="date" defaultValue={data} className="rounded-md border px-3 py-2 text-sm" /></div><button className="rounded-md bg-stone-900 px-4 py-2 text-sm text-white">Consultar</button></form>{fechamento ? <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Caixa fechado em {new Date(fechamento.fechado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} por {fechamento.fechado_por_email || "usuário identificado"}. {fechamento.observacao || ""}</p> : <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><p>Prévia: este caixa ainda não foi fechado e os valores podem mudar.</p>{isGerente && <form action={fecharCaixaDiario} className="mt-3 flex flex-wrap gap-2"><input type="hidden" name="data" value={data} /><input name="observacao" placeholder="Observação do fechamento (opcional)" className="min-w-64 flex-1 rounded-md border border-amber-300 px-3 py-2 text-sm text-stone-900" /><button className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">Fechar caixa deste dia</button></form>}</div>}<FechamentoFiscalReport titulo={fechamento ? "Fechamento diário definitivo" : "Prévia do fechamento diário"} periodo={periodo} dados={dados} finalizado={!!fechamento} /></div>;
}

import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function hojeSP(): string {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return `${partes.find((p) => p.type === "year")!.value}-${partes.find((p) => p.type === "month")!.value}-${partes.find((p) => p.type === "day")!.value}`;
}

function bucketDe(dataVencimento: string, hoje: string): string {
  return dataVencimento < hoje ? "Vencido" : dataVencimento.slice(0, 7);
}

function labelBucket(bucket: string): string {
  if (bucket === "Vencido") return "Vencido";
  const [ano, mes] = bucket.split("-");
  return `${mes}/${ano}`;
}

export default async function FluxoCaixaPage() {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription("financeiro");
  const hoje = hojeSP();

  const [{ data: aReceber }, { data: aPagar }] = await Promise.all([
    supabase.from("del_contas_a_receber").select("valor, data_vencimento").eq("owner_id", restaurantOwnerId).eq("status", "aberta"),
    supabase.from("del_contas_a_pagar").select("valor, data_vencimento").eq("owner_id", restaurantOwnerId).eq("status", "a_pagar"),
  ]);

  const buckets = new Map<string, { entradas: number; saidas: number }>();
  for (const c of aReceber ?? []) {
    const b = bucketDe(c.data_vencimento, hoje);
    const atual = buckets.get(b) ?? { entradas: 0, saidas: 0 };
    atual.entradas += Number(c.valor);
    buckets.set(b, atual);
  }
  for (const c of aPagar ?? []) {
    const b = bucketDe(c.data_vencimento, hoje);
    const atual = buckets.get(b) ?? { entradas: 0, saidas: 0 };
    atual.saidas += Number(c.valor);
    buckets.set(b, atual);
  }

  const chaves = [...buckets.keys()].sort((a, b) => {
    if (a === "Vencido") return -1;
    if (b === "Vencido") return 1;
    return a.localeCompare(b);
  });

  const linhas = chaves.reduce<{ chave: string; entradas: number; saidas: number; saldo: number; acumulado: number }[]>(
    (acc, chave) => {
      const { entradas, saidas } = buckets.get(chave)!;
      const saldo = entradas - saidas;
      const acumuladoAnterior = acc.length > 0 ? acc[acc.length - 1].acumulado : 0;
      acc.push({ chave, entradas, saidas, saldo, acumulado: acumuladoAnterior + saldo });
      return acc;
    },
    [],
  );

  const totalAReceber = (aReceber ?? []).reduce((sum, c) => sum + Number(c.valor), 0);
  const totalAPagar = (aPagar ?? []).reduce((sum, c) => sum + Number(c.valor), 0);

  return (
    <div>
      <Link href="/restaurante/financeiro" className="text-sm text-amber-700 underline underline-offset-2">
        ← Financeiro
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-stone-900">Fluxo de caixa projetado</h1>
      <p className="mt-1 text-sm text-stone-600">
        Contas a receber e a pagar em aberto, por mês de vencimento — não inclui o saldo de caixa que você já
        tem hoje, só o que ainda vai entrar e sair.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Total a receber em aberto</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{formatReal(totalAReceber)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Total a pagar em aberto</p>
          <p className="mt-1 text-xl font-bold text-red-600">{formatReal(totalAPagar)}</p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs text-stone-500">
              <th className="py-2 pr-3">Período</th>
              <th className="py-2 pr-3">A receber</th>
              <th className="py-2 pr-3">A pagar</th>
              <th className="py-2 pr-3">Saldo do período</th>
              <th className="py-2 pr-3">Saldo acumulado</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.chave} className={`border-b border-stone-100 ${l.chave === "Vencido" ? "bg-red-50" : ""}`}>
                <td className="py-2 pr-3 font-medium text-stone-900">{labelBucket(l.chave)}</td>
                <td className="py-2 pr-3 text-emerald-700">{formatReal(l.entradas)}</td>
                <td className="py-2 pr-3 text-red-600">{formatReal(l.saidas)}</td>
                <td className={`py-2 pr-3 ${l.saldo >= 0 ? "text-emerald-700" : "text-red-600"}`}>{formatReal(l.saldo)}</td>
                <td className={`py-2 pr-3 font-semibold ${l.acumulado >= 0 ? "text-emerald-700" : "text-red-600"}`}>{formatReal(l.acumulado)}</td>
              </tr>
            ))}
            {linhas.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-stone-500">
                  Nenhuma conta em aberto no momento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-stone-500">
        &quot;Vencido&quot; junta tudo que já passou do vencimento e ainda não foi marcado como pago/recebido —
        vale a pena revisar em{" "}
        <Link href="/restaurante/financeiro/contas-a-pagar" className="text-amber-700 underline underline-offset-2">
          Contas a pagar
        </Link>{" "}
        e{" "}
        <Link href="/restaurante/financeiro/contas-a-receber" className="text-amber-700 underline underline-offset-2">
          Contas a receber
        </Link>
        .
      </p>
    </div>
  );
}

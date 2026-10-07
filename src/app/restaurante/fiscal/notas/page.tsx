import { cancelarNotaFiscal } from "@/app/restaurante/actions";
import { requireRestaurantSubscription } from "@/lib/subscription";

function formatHora(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  });
}

function mascararDocumento(value: string | null) {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits ? `•••${digits.slice(-4)}` : null;
}

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  emitida: "Emitida / válida",
  erro: "Erro",
  cancelada: "Cancelada",
};

const STATUS_CLASSE: Record<string, string> = {
  pendente: "bg-stone-100 text-stone-600",
  emitida: "bg-emerald-100 text-emerald-700",
  erro: "bg-red-100 text-red-700",
  cancelada: "bg-stone-200 text-stone-500 line-through",
};

export default async function NotasFiscaisPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; from?: string; to?: string }>;
}) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();
  const { busca: buscaParam, from, to } = await searchParams;
  const busca = buscaParam?.trim().slice(0, 100) ?? "";
  const documentoBusca = busca.replace(/\D/g, "");
  const numeroNota = /^\d+$/.test(busca) ? Number(busca) : null;

  let orderIdsEncontrados: string[] = [];
  if (busca) {
    const nomeBusca = busca
      .normalize("NFKC")
      .toLocaleLowerCase("pt-BR")
      .replace(/[^\p{L}\p{N}\s.'-]/gu, "")
      .trim();
    const consultas = [];
    if (nomeBusca) {
      consultas.push(
        supabase.from("del_orders").select("id").eq("owner_id", restaurantOwnerId).ilike("cliente_nome_busca", `%${nomeBusca}%`),
      );
    }
    if (documentoBusca.length === 11 || documentoBusca.length === 14) {
      consultas.push(
        supabase.from("del_orders").select("id").eq("owner_id", restaurantOwnerId).eq("cliente_documento_busca", documentoBusca),
      );
    }
    const resultados = await Promise.all(consultas);
    orderIdsEncontrados = [...new Set(resultados.flatMap((resultado) => (resultado.data ?? []).map((order) => order.id)))];
  }

  let notasQuery = supabase
    .from("del_notas_fiscais")
    .select("*, del_orders(cliente_nome, cliente_cpf_cnpj, totale, status, valor_estornado, estorno_status, estornado_em)")
    .eq("owner_id", restaurantOwnerId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (busca) {
    if (numeroNota != null && orderIdsEncontrados.length > 0) {
      notasQuery = notasQuery.or(`numero.eq.${numeroNota},order_id.in.(${orderIdsEncontrados.join(",")})`);
    } else if (numeroNota != null) {
      notasQuery = notasQuery.eq("numero", numeroNota);
    } else if (orderIdsEncontrados.length > 0) {
      notasQuery = notasQuery.in("order_id", orderIdsEncontrados);
    } else {
      notasQuery = notasQuery.eq("order_id", "00000000-0000-0000-0000-000000000000");
    }
  }
  if (from) notasQuery = notasQuery.gte("created_at", `${from}T00:00:00-03:00`);
  if (to) notasQuery = notasQuery.lte("created_at", `${to}T23:59:59.999-03:00`);
  const { data: notas } = await notasQuery;

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Notas fiscais</h1>
      <p className="mt-1 text-sm text-stone-600">Consulte emissões, erros e cancelamentos vinculados aos pedidos.</p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-2 rounded-xl border border-stone-200 bg-white p-4">
        <div>
          <label className="block text-xs text-stone-500">Nota, CPF/CNPJ ou cliente</label>
          <input name="busca" type="search" defaultValue={busca} placeholder="Ex: 42, CPF/CNPJ ou Maria" className="w-72 rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-stone-500">De</label>
          <input name="from" type="date" defaultValue={from ?? ""} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-stone-500">Até</label>
          <input name="to" type="date" defaultValue={to ?? ""} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
        </div>
        <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">Filtrar</button>
        {(busca || from || to) && <a href="/restaurante/fiscal/notas" className="text-xs text-stone-500 hover:underline">Limpar filtro</a>}
      </form>

      <div className="mt-4 space-y-2">
        {(notas ?? []).map((n) => (
          <div key={n.id} className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-stone-900">
                {n.numero ? `Nota Nº ${n.numero}` : "Sem número"} — {n.del_orders?.cliente_nome || "Cliente sem nome"}
              </p>
              <span className="shrink-0 text-xs text-stone-400">{formatHora(n.created_at)}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_CLASSE[n.status] ?? "bg-stone-100 text-stone-600"}`}>
                {STATUS_LABEL[n.status] ?? n.status}
              </span>
              {n.provedor === "simulado" && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700">🧪 Simulação</span>}
              {n.del_orders?.totale != null && <span className="text-xs text-stone-500">R$ {Number(n.del_orders.totale).toFixed(2).replace(".", ",")}</span>}
              {Number(n.del_orders?.valor_estornado ?? 0) > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                  Estornado R$ {Number(n.del_orders.valor_estornado).toFixed(2).replace(".", ",")}
                </span>
              )}
              {formatHora(n.emitida_em) && <span className="text-xs text-stone-500">Emitida {formatHora(n.emitida_em)}</span>}
              {formatHora(n.cancelada_em) && <span className="text-xs text-stone-500">Cancelada {formatHora(n.cancelada_em)}</span>}
            </div>
            {mascararDocumento(n.del_orders?.cliente_cpf_cnpj ?? null) && <p className="mt-1 text-xs text-stone-500">CPF/CNPJ {mascararDocumento(n.del_orders?.cliente_cpf_cnpj ?? null)}</p>}
            {n.erro_mensagem && <p className="mt-1 text-xs text-red-600">{n.erro_mensagem}</p>}
            {n.cancelamento_erro && <p className="mt-1 text-xs text-red-600">Cancelamento: {n.cancelamento_erro}</p>}
            {n.chave_acesso && <p className="mt-1 break-all text-xs text-stone-500">Chave: {n.chave_acesso}</p>}
            {n.justificativa_cancelamento && <p className="mt-1 text-xs text-stone-500">Motivo: {n.justificativa_cancelamento}</p>}
            {n.protocolo_cancelamento && <p className="mt-1 text-xs text-stone-500">Protocolo: {n.protocolo_cancelamento}</p>}
            {Number(n.del_orders?.valor_estornado ?? 0) > 0 && n.status === "emitida" && (
              <p className="mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-800">O pagamento foi estornado, mas a nota continua válida. Verifique o cancelamento fiscal ou a devolução adequada.</p>
            )}
            {n.status === "emitida" && (
              <form action={cancelarNotaFiscal.bind(null, n.id)} className="mt-3 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
                <input name="justificativa" required minLength={15} placeholder="Motivo do cancelamento (mín. 15 caracteres)" className="min-w-[240px] flex-1 rounded-md border border-stone-300 px-2 py-1.5 text-xs" />
                <button type="submit" className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50">Cancelar nota</button>
              </form>
            )}
          </div>
        ))}
        {(notas ?? []).length === 0 && <p className="text-sm text-stone-500">Nenhuma nota encontrada neste filtro.</p>}
      </div>
    </div>
  );
}

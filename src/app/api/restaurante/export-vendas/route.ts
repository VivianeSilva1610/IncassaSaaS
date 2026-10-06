import { NextResponse } from "next/server";
import { requireRestaurantSubscription } from "@/lib/subscription";

function csvEscape(value: string) {
  return /[",\n;]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export async function GET(req: Request) {
  const { supabase, restaurantOwnerId, isOwner } = await requireRestaurantSubscription();
  if (!isOwner) {
    return NextResponse.json({ error: "Apenas o dono pode exportar os dados fiscais." }, { status: 403 });
  }

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const criterio = url.searchParams.get("criterio") === "caixa" ? "caixa" : "competencia";
  const colunaData = criterio === "caixa" ? "pago_em" : "competencia_em";

  let query = supabase
    .from("del_orders")
    .select("id, created_at, competencia_em, pago, pago_em, forma_pagamento, valor_pago, valor_estornado, estorno_status, estornado_em, cliente_nome, cliente_cpf_cnpj, canal, status, totale")
    .eq("owner_id", restaurantOwnerId)
    .not(colunaData, "is", null)
    .order(colunaData, { ascending: true });
  if (criterio === "competencia") query = query.neq("status", "cancelado");
  if (from) query = query.gte(colunaData, `${from}T00:00:00-03:00`);
  if (to) query = query.lte(colunaData, `${to}T23:59:59.999-03:00`);

  const { data: orders } = await query;
  const orderIds = (orders ?? []).map((o) => o.id);

  const { data: notas } = orderIds.length
    ? await supabase
        .from("del_notas_fiscais")
        .select("order_id, modelo, status, numero, chave_acesso, protocolo_cancelamento, cancelada_em, created_at")
        .in("order_id", orderIds)
        .order("created_at", { ascending: false })
    : { data: [] };
  const notaPorPedido = new Map<string, {
    modelo: string;
    status: string;
    numero: number | null;
    chave_acesso: string | null;
    protocolo_cancelamento: string | null;
    cancelada_em: string | null;
  }>();
  for (const n of notas ?? []) {
    if (!notaPorPedido.has(n.order_id)) notaPorPedido.set(n.order_id, n);
  }

  const cabecalho = [
    criterio === "caixa" ? "Data do recebimento" : "Data da competência",
    "Data do pedido",
    "Cliente",
    "CPF/CNPJ",
    "Canal",
    "Status do pedido",
    "Valor (R$)",
    "Pago",
    "Forma de pagamento",
    "Valor recebido (R$)",
    "Valor estornado (R$)",
    "Status do estorno",
    "Data do estorno",
    "Recebimento líquido (R$)",
    "Documento fiscal",
    "Status nota",
    "Número",
    "Chave de acesso",
    "Protocolo de cancelamento",
    "Data do cancelamento fiscal",
  ];
  const linhas = [cabecalho.join(";")];

  for (const o of orders ?? []) {
    const nota = notaPorPedido.get(o.id);
    linhas.push(
      [
        new Date((criterio === "caixa" ? o.pago_em : o.competencia_em)!).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
        new Date(o.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
        csvEscape(o.cliente_nome ?? ""),
        csvEscape(o.cliente_cpf_cnpj ?? ""),
        o.canal,
        o.status,
        Number(o.totale).toFixed(2).replace(".", ","),
        o.pago ? "sim" : "não",
        o.forma_pagamento ?? "",
        o.valor_pago != null ? Number(o.valor_pago).toFixed(2).replace(".", ",") : "",
        Number(o.valor_estornado ?? 0).toFixed(2).replace(".", ","),
        o.estorno_status ?? "",
        o.estornado_em ? new Date(o.estornado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "",
        (Number(o.valor_pago ?? o.totale) - Number(o.valor_estornado ?? 0)).toFixed(2).replace(".", ","),
        nota ? (nota.modelo === "55" ? "NF-e" : "NFC-e") : "",
        nota?.status ?? "não emitida",
        nota?.numero ?? "",
        nota?.chave_acesso ?? "",
        nota?.protocolo_cancelamento ?? "",
        nota?.cancelada_em ? new Date(nota.cancelada_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "",
      ]
        .map((v) => csvEscape(String(v)))
        .join(";"),
    );
  }

  // BOM no início pra acentuação abrir certo no Excel.
  const csv = "﻿" + linhas.join("\n");
  const nomeArquivo = `vendas-${criterio}-${from ?? "inicio"}-a-${to ?? "hoje"}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}

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

  let query = supabase
    .from("del_orders")
    .select("id, created_at, cliente_nome, cliente_cpf_cnpj, canal, status, totale")
    .eq("owner_id", restaurantOwnerId)
    .order("created_at", { ascending: true });
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", `${to}T23:59:59`);

  const { data: orders } = await query;
  const orderIds = (orders ?? []).map((o) => o.id);

  const { data: notas } = orderIds.length
    ? await supabase
        .from("del_notas_fiscais")
        .select("order_id, modelo, status, numero, chave_acesso, created_at")
        .in("order_id", orderIds)
        .order("created_at", { ascending: false })
    : { data: [] };
  const notaPorPedido = new Map<string, { modelo: string; status: string; numero: number | null; chave_acesso: string | null }>();
  for (const n of notas ?? []) {
    if (!notaPorPedido.has(n.order_id)) notaPorPedido.set(n.order_id, n);
  }

  const cabecalho = [
    "Data",
    "Cliente",
    "CPF/CNPJ",
    "Canal",
    "Status do pedido",
    "Valor (R$)",
    "Documento fiscal",
    "Status nota",
    "Número",
    "Chave de acesso",
  ];
  const linhas = [cabecalho.join(";")];

  for (const o of orders ?? []) {
    const nota = notaPorPedido.get(o.id);
    linhas.push(
      [
        new Date(o.created_at).toLocaleString("pt-BR"),
        csvEscape(o.cliente_nome ?? ""),
        csvEscape(o.cliente_cpf_cnpj ?? ""),
        o.canal,
        o.status,
        Number(o.totale).toFixed(2).replace(".", ","),
        nota ? (nota.modelo === "55" ? "NF-e" : "NFC-e") : "",
        nota?.status ?? "não emitida",
        nota?.numero ?? "",
        nota?.chave_acesso ?? "",
      ]
        .map((v) => csvEscape(String(v)))
        .join(";"),
    );
  }

  // BOM no início pra acentuação abrir certo no Excel.
  const csv = "﻿" + linhas.join("\n");
  const nomeArquivo = `vendas-${from ?? "inicio"}-a-${to ?? "hoje"}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}

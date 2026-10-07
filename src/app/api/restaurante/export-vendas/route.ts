import { NextResponse } from "next/server";
import { requireRestaurantSubscription } from "@/lib/subscription";

function csvEscape(value: unknown) {
  const texto = String(value ?? "");
  return /[",\n;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function decimal(value: unknown) {
  return value == null || value === "" ? "" : Number(value).toFixed(2).replace(".", ",");
}

function dataHora(value: string | null) {
  return value ? new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "";
}

type ItemExportacao = {
  product_id: string;
  nome: string;
  categoria: string | null;
  quantidade: number;
  preco_unitario: number;
  valor_total: number;
  ncm: string | null;
  cfop: string | null;
  cest: string | null;
  origem: number | null;
};

export async function GET(req: Request) {
  const { supabase, restaurantOwnerId, isOwner } = await requireRestaurantSubscription();
  if (!isOwner) return NextResponse.json({ error: "Apenas o dono pode exportar os dados fiscais." }, { status: 403 });

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const criterio = url.searchParams.get("criterio") === "caixa" ? "caixa" : "competencia";
  const arquivo = url.searchParams.get("arquivo") === "itens" ? "itens" : "resumo";
  const colunaData = criterio === "caixa" ? "pago_em" : "competencia_em";

  let query = supabase
    .from("del_orders")
    .select("id, created_at, competencia_em, pago, pago_em, forma_pagamento, valor_pago, valor_estornado, estorno_status, estornado_em, cliente_nome, cliente_cpf_cnpj, canal, status, totale, del_order_items(product_id, quantidade, preco_unitario, del_products(nome, categoria, ncm, cfop, cest, origem))")
    .eq("owner_id", restaurantOwnerId)
    .not(colunaData, "is", null)
    .order(colunaData, { ascending: true });
  if (criterio === "competencia") query = query.neq("status", "cancelado");
  if (from) query = query.gte(colunaData, `${from}T00:00:00-03:00`);
  if (to) query = query.lte(colunaData, `${to}T23:59:59.999-03:00`);

  const { data: orders, error: ordersError } = await query;
  if (ordersError) return NextResponse.json({ error: `Falha ao consultar vendas: ${ordersError.message}` }, { status: 500 });
  const orderIds = (orders ?? []).map((order) => order.id);
  const { data: notas, error: notasError } = orderIds.length
    ? await supabase.from("del_notas_fiscais").select("order_id, modelo, status, numero, serie, chave_acesso, protocolo_autorizacao, protocolo_cancelamento, cancelada_em, ambiente, provedor, url_xml, url_danfe, itens_snapshot, created_at").eq("owner_id", restaurantOwnerId).in("order_id", orderIds).order("created_at", { ascending: false })
    : { data: [], error: null };
  if (notasError) return NextResponse.json({ error: `Falha ao consultar documentos fiscais: ${notasError.message}` }, { status: 500 });

  const notaPorPedido = new Map<string, (typeof notas extends Array<infer T> ? T : never)>();
  for (const nota of notas ?? []) if (!notaPorPedido.has(nota.order_id)) notaPorPedido.set(nota.order_id, nota);

  const colunasVenda = [
    criterio === "caixa" ? "Data do recebimento" : "Data da competência", "Data do pedido", "ID do pedido", "Cliente", "CPF/CNPJ", "Canal", "Status do pedido", "Total do pedido (R$)", "Pago", "Forma de pagamento", "Valor recebido (R$)", "Valor estornado (R$)", "Status do estorno", "Data do estorno", "Recebimento líquido (R$)", "Documento fiscal", "Status da nota", "Número", "Série", "Ambiente", "Provedor", "Chave de acesso", "Protocolo de autorização", "Protocolo de cancelamento", "Data do cancelamento fiscal", "URL do XML", "URL do DANFE",
  ];
  const colunasItem = ["Sequência do item", "ID do produto", "Produto", "Categoria", "Quantidade", "Preço unitário (R$)", "Total do item (R$)", "NCM", "CFOP", "CEST", "Origem", "Classificação incompleta"];
  const linhas: string[] = [[...colunasVenda, ...(arquivo === "itens" ? colunasItem : [])].map(csvEscape).join(";")];

  for (const order of orders ?? []) {
    const nota = notaPorPedido.get(order.id);
    const venda = [
      dataHora(criterio === "caixa" ? order.pago_em : order.competencia_em), dataHora(order.created_at), order.id, order.cliente_nome ?? "", order.cliente_cpf_cnpj ?? "", order.canal, order.status, decimal(order.totale), order.pago ? "sim" : "não", order.forma_pagamento ?? "", decimal(order.valor_pago), decimal(order.valor_estornado ?? 0), order.estorno_status ?? "", dataHora(order.estornado_em), decimal(Number(order.valor_pago ?? order.totale) - Number(order.valor_estornado ?? 0)), nota ? (nota.modelo === "55" ? "NF-e" : "NFC-e") : "", nota?.status ?? "não emitida", nota?.numero ?? "", nota?.serie ?? "", nota?.ambiente ?? "", nota?.provedor ?? "", nota?.chave_acesso ?? "", nota?.protocolo_autorizacao ?? "", nota?.protocolo_cancelamento ?? "", dataHora(nota?.cancelada_em ?? null), nota?.url_xml ?? "", nota?.url_danfe ?? "",
    ];

    if (arquivo === "resumo") {
      linhas.push(venda.map(csvEscape).join(";"));
      continue;
    }

    const snapshot = Array.isArray(nota?.itens_snapshot) ? nota.itens_snapshot as unknown as ItemExportacao[] : [];
    const itensAtuais: ItemExportacao[] = (order.del_order_items ?? []).map((item) => {
      const produto = Array.isArray(item.del_products) ? item.del_products[0] : item.del_products;
      return { product_id: item.product_id, nome: produto?.nome ?? "Produto não encontrado", categoria: produto?.categoria ?? null, quantidade: Number(item.quantidade), preco_unitario: Number(item.preco_unitario), valor_total: Number(item.quantidade) * Number(item.preco_unitario), ncm: produto?.ncm ?? null, cfop: produto?.cfop ?? null, cest: produto?.cest ?? null, origem: produto?.origem ?? null };
    });
    const itens = snapshot.length ? snapshot : itensAtuais;
    if (!itens.length) linhas.push([...venda, "", "", "Pedido sem itens", "", "", "", "", "", "", "", "", "sim"].map(csvEscape).join(";"));
    itens.forEach((item, index) => {
      const incompleta = !item.ncm || !item.cfop || item.origem == null;
      linhas.push([...venda, index + 1, item.product_id, item.nome, item.categoria ?? "", item.quantidade, decimal(item.preco_unitario), decimal(item.valor_total), item.ncm ?? "", item.cfop ?? "", item.cest ?? "", item.origem ?? "", incompleta ? "sim" : "não"].map(csvEscape).join(";"));
    });
  }

  const csv = "\uFEFF" + linhas.join("\n");
  const nome = `${arquivo === "itens" ? "itens-vendidos" : "resumo-vendas"}-${criterio}-${from ?? "inicio"}-a-${to ?? "hoje"}.csv`;
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${nome}"` } });
}

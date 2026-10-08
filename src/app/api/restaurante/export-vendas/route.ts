import { NextResponse } from "next/server";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { offsetParaData } from "@/lib/fiscal/fechamento";

function csvEscape(value: unknown) {
  const texto = String(value ?? "");
  return /[",\n;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function decimal(value: unknown) {
  return value == null || value === "" ? "" : Number(value).toFixed(2).replace(".", ",");
}

function dataHora(value: string | null, timeZone: string, intlLocale: string) {
  return value ? new Date(value).toLocaleString(intlLocale, { timeZone }) : "";
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

type DocumentoFiscalBr = {
  order_id: string;
  modelo: string | null;
  status: string;
  numero: number | null;
  serie: number | null;
  chave_acesso: string | null;
  protocolo_autorizacao: string | null;
  protocolo_cancelamento: string | null;
  cancelada_em: string | null;
  ambiente: string;
  provedor: string | null;
  url_xml: string | null;
  url_danfe: string | null;
  itens_snapshot: unknown;
  created_at: string;
};

type DocumentoFiscalIt = {
  order_id: string;
  status: string;
  updated_at: string;
  fiscal_documents_it: { protocollo_sdi: string | null; esito: string | null; codice_scarto: string | null; motivo_scarto: string | null } | { protocollo_sdi: string | null; esito: string | null; codice_scarto: string | null; motivo_scarto: string | null }[] | null;
};

export async function GET(req: Request) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription("fiscal");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, country_code, timezone")
    .eq("owner_user_id", restaurantOwnerId)
    .maybeSingle();
  const country: "BR" | "IT" = restaurant?.country_code === "IT" ? "IT" : "BR";
  const timeZone = restaurant?.timezone || (country === "IT" ? "Europe/Rome" : "America/Sao_Paulo");
  const intlLocale = country === "IT" ? "it-IT" : "pt-BR";

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const criterio = url.searchParams.get("criterio") === "caixa" ? "caixa" : "competencia";
  const arquivo = url.searchParams.get("arquivo") === "itens" ? "itens" : "resumo";
  const colunaData = criterio === "caixa" ? "pago_em" : "competencia_em";
  const offsetFrom = from ? offsetParaData(timeZone, from) : null;
  const offsetTo = to ? offsetParaData(timeZone, to) : null;

  let query = supabase
    .from("del_orders")
    .select("id, created_at, competencia_em, pago, pago_em, forma_pagamento, valor_pago, valor_estornado, estorno_status, estornado_em, cliente_nome, cliente_cpf_cnpj, canal, status, totale, del_order_items(product_id, quantidade, preco_unitario, del_products(nome, categoria, ncm, cfop, cest, origem))")
    .eq("owner_id", restaurantOwnerId)
    .not(colunaData, "is", null)
    .order(colunaData, { ascending: true });
  if (criterio === "competencia") query = query.neq("status", "cancelado");
  if (from && offsetFrom) query = query.gte(colunaData, `${from}T00:00:00${offsetFrom}`);
  if (to && offsetTo) query = query.lte(colunaData, `${to}T23:59:59.999${offsetTo}`);

  const { data: orders, error: ordersError } = await query;
  if (ordersError) return NextResponse.json({ error: `Falha ao consultar vendas: ${ordersError.message}` }, { status: 500 });
  const orderIds = (orders ?? []).map((order) => order.id);

  const notaPorPedidoBr = new Map<string, DocumentoFiscalBr>();
  const documentoPorPedidoIt = new Map<string, DocumentoFiscalIt>();

  if (country === "IT") {
    const { data: documentos, error: documentosError } = orderIds.length
      ? await supabase.from("fiscal_documents").select("order_id, status, updated_at, fiscal_documents_it(protocollo_sdi, esito, codice_scarto, motivo_scarto)").eq("restaurant_id", restaurant?.id ?? "00000000-0000-0000-0000-000000000000").in("order_id", orderIds).order("updated_at", { ascending: false })
      : { data: [], error: null };
    if (documentosError) return NextResponse.json({ error: `Impossibile consultare i documenti fiscali: ${documentosError.message}` }, { status: 500 });
    for (const documento of (documentos ?? []) as unknown as DocumentoFiscalIt[]) {
      if (documento.order_id && !documentoPorPedidoIt.has(documento.order_id)) documentoPorPedidoIt.set(documento.order_id, documento);
    }
  } else {
    const { data: notas, error: notasError } = orderIds.length
      ? await supabase.from("del_notas_fiscais").select("order_id, modelo, status, numero, serie, chave_acesso, protocolo_autorizacao, protocolo_cancelamento, cancelada_em, ambiente, provedor, url_xml, url_danfe, itens_snapshot, created_at").eq("owner_id", restaurantOwnerId).in("order_id", orderIds).order("created_at", { ascending: false })
      : { data: [], error: null };
    if (notasError) return NextResponse.json({ error: `Falha ao consultar documentos fiscais: ${notasError.message}` }, { status: 500 });
    for (const nota of (notas ?? []) as DocumentoFiscalBr[]) {
      if (!notaPorPedidoBr.has(nota.order_id)) notaPorPedidoBr.set(nota.order_id, nota);
    }
  }

  const colunasVendaComuns = (c: typeof country) => c === "IT"
    ? [criterio === "caixa" ? "Data dell'incasso" : "Data di competenza", "Data dell'ordine", "ID ordine", "Cliente", "Canale", "Stato ordine", "Totale ordine (EUR)", "Pagato", "Forma di pagamento", "Valore incassato (EUR)", "Valore stornato (EUR)", "Stato storno", "Data storno", "Incasso netto (EUR)"]
    : [criterio === "caixa" ? "Data do recebimento" : "Data da competência", "Data do pedido", "ID do pedido", "Cliente", "Canal", "Status do pedido", "Total do pedido (R$)", "Pago", "Forma de pagamento", "Valor recebido (R$)", "Valor estornado (R$)", "Status do estorno", "Data do estorno", "Recebimento líquido (R$)"];
  const colunasDocumento = country === "IT"
    ? ["Documento fiscale", "Stato", "Protocollo SdI", "Esito", "Codice scarto", "Motivo scarto", "Ultimo aggiornamento"]
    : ["Documento fiscal", "Status da nota", "Número", "Série", "Ambiente", "Provedor", "Chave de acesso", "Protocolo de autorização", "Protocolo de cancelamento", "Data do cancelamento fiscal", "URL do XML", "URL do DANFE"];
  const colunasItem = country === "IT"
    ? ["Sequenza articolo", "ID prodotto", "Prodotto", "Categoria", "Quantità", "Prezzo unitario (EUR)", "Totale articolo (EUR)"]
    : ["Sequência do item", "ID do produto", "Produto", "Categoria", "Quantidade", "Preço unitário (R$)", "Total do item (R$)", "NCM", "CFOP", "CEST", "Origem", "Classificação incompleta"];

  const linhas: string[] = [[...colunasVendaComuns(country), ...colunasDocumento, ...(arquivo === "itens" ? colunasItem : [])].map(csvEscape).join(";")];

  for (const order of orders ?? []) {
    const venda = [
      dataHora(criterio === "caixa" ? order.pago_em : order.competencia_em, timeZone, intlLocale),
      dataHora(order.created_at, timeZone, intlLocale),
      order.id,
      order.cliente_nome ?? "",
      ...(country === "BR" ? [order.cliente_cpf_cnpj ?? ""] : []),
      order.canal, order.status, decimal(order.totale), order.pago ? "sim" : "não", order.forma_pagamento ?? "",
      decimal(order.valor_pago), decimal(order.valor_estornado ?? 0), order.estorno_status ?? "",
      dataHora(order.estornado_em, timeZone, intlLocale),
      decimal(Number(order.valor_pago ?? order.totale) - Number(order.valor_estornado ?? 0)),
    ];

    let colunasDoc: (string | number)[];
    let itens: ItemExportacao[] = [];
    if (country === "IT") {
      const documento = documentoPorPedidoIt.get(order.id);
      const detalhe = Array.isArray(documento?.fiscal_documents_it) ? documento?.fiscal_documents_it[0] : documento?.fiscal_documents_it;
      colunasDoc = [
        documento ? "fattura elettronica" : "", documento?.status ?? "non emesso",
        detalhe?.protocollo_sdi ?? "", detalhe?.esito ?? "", detalhe?.codice_scarto ?? "", detalhe?.motivo_scarto ?? "",
        documento ? dataHora(documento.updated_at, timeZone, intlLocale) : "",
      ];
      itens = (order.del_order_items ?? []).map((item) => {
        const produto = Array.isArray(item.del_products) ? item.del_products[0] : item.del_products;
        return { product_id: item.product_id, nome: produto?.nome ?? "Prodotto non trovato", categoria: produto?.categoria ?? null, quantidade: Number(item.quantidade), preco_unitario: Number(item.preco_unitario), valor_total: Number(item.quantidade) * Number(item.preco_unitario), ncm: null, cfop: null, cest: null, origem: null };
      });
    } else {
      const nota = notaPorPedidoBr.get(order.id);
      colunasDoc = [
        nota ? (nota.modelo === "55" ? "NF-e" : "NFC-e") : "", nota?.status ?? "não emitida", nota?.numero ?? "", nota?.serie ?? "",
        nota?.ambiente ?? "", nota?.provedor ?? "", nota?.chave_acesso ?? "", nota?.protocolo_autorizacao ?? "",
        nota?.protocolo_cancelamento ?? "", dataHora(nota?.cancelada_em ?? null, timeZone, intlLocale), nota?.url_xml ?? "", nota?.url_danfe ?? "",
      ];
      const snapshot = Array.isArray(nota?.itens_snapshot) ? nota.itens_snapshot as unknown as ItemExportacao[] : [];
      const itensAtuais: ItemExportacao[] = (order.del_order_items ?? []).map((item) => {
        const produto = Array.isArray(item.del_products) ? item.del_products[0] : item.del_products;
        return { product_id: item.product_id, nome: produto?.nome ?? "Produto não encontrado", categoria: produto?.categoria ?? null, quantidade: Number(item.quantidade), preco_unitario: Number(item.preco_unitario), valor_total: Number(item.quantidade) * Number(item.preco_unitario), ncm: produto?.ncm ?? null, cfop: produto?.cfop ?? null, cest: produto?.cest ?? null, origem: produto?.origem ?? null };
      });
      itens = snapshot.length ? snapshot : itensAtuais;
    }

    if (arquivo === "resumo") {
      linhas.push([...venda, ...colunasDoc].map(csvEscape).join(";"));
      continue;
    }

    if (!itens.length) {
      const vazio = country === "IT" ? ["", "", "Ordine senza articoli", "", "", "", ""] : ["", "", "Pedido sem itens", "", "", "", "", "", "", "", "", "sim"];
      linhas.push([...venda, ...colunasDoc, ...vazio].map(csvEscape).join(";"));
      continue;
    }
    itens.forEach((item, index) => {
      const linhaItem = country === "IT"
        ? [index + 1, item.product_id, item.nome, item.categoria ?? "", item.quantidade, decimal(item.preco_unitario), decimal(item.valor_total)]
        : [index + 1, item.product_id, item.nome, item.categoria ?? "", item.quantidade, decimal(item.preco_unitario), decimal(item.valor_total), item.ncm ?? "", item.cfop ?? "", item.cest ?? "", item.origem ?? "", (!item.ncm || !item.cfop || item.origem == null) ? "sim" : "não"];
      linhas.push([...venda, ...colunasDoc, ...linhaItem].map(csvEscape).join(";"));
    });
  }

  const csv = "﻿" + linhas.join("\n");
  const nome = `${arquivo === "itens" ? "itens-vendidos" : "resumo-vendas"}-${criterio}-${from ?? "inicio"}-a-${to ?? "hoje"}.csv`;
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${nome}"` } });
}

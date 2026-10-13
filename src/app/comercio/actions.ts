"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseNfeEntrada } from "@/lib/fiscal/nfe-entrada";
import { requireCommerceAccess } from "@/lib/commerce-subscription";
import { MODULOS_COMERCIO } from "@/lib/commerce-subscription";
import Papa from "papaparse";

const MAX_XML_BYTES = 5 * 1024 * 1024;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function text(form: FormData, field: string) { return String(form.get(field) ?? "").trim(); }
function number(form: FormData, field: string) { return Number(text(form, field).replace(",", ".")); }
function go(path: string, kind: "sucesso" | "erro", message: string): never { redirect(`${path}?${kind}=${encodeURIComponent(message)}`); }

export async function criarEmpresaComercial(formData: FormData) {
  const { supabase, user, business } = await requireCommerceAccess();
  if (business) redirect("/comercio");
  const nome = text(formData, "nome");
  const cnpj = text(formData, "cnpj").replace(/\D/g, "") || null;
  const uf = text(formData, "uf").toUpperCase();
  if (nome.length < 2) throw new Error("Informe o nome da empresa.");
  if (cnpj && !/^\d{14}$/.test(cnpj)) throw new Error("O CNPJ deve ter 14 dígitos.");
  if (uf && !/^[A-Z]{2}$/.test(uf)) throw new Error("Informe uma UF válida.");
  const { data, error } = await supabase.from("commerce_businesses").insert({ owner_id: user.id, nome, nome_fantasia: text(formData, "nome_fantasia") || null, cnpj, uf: uf || null }).select("id").single();
  if (error || !data) throw new Error(`Não foi possível criar a empresa: ${error?.message ?? "erro desconhecido"}`);
  const { error: fiscalError } = await supabase.from("commerce_fiscal_settings").insert({ business_id: data.id, owner_id: user.id });
  if (fiscalError) throw new Error(`Empresa criada, mas a configuração fiscal falhou: ${fiscalError.message}`);
  revalidatePath("/comercio"); redirect("/comercio");
}

export async function criarProdutoComercial(formData: FormData) {
  const { supabase, ownerId, business } = await requireCommerceAccess("produtos");
  if (!business) redirect("/comercio");
  const nome = text(formData, "nome"); const preco = number(formData, "preco_venda");
  const ncm = text(formData, "ncm").replace(/\D/g, "") || null;
  if (nome.length < 2 || !Number.isFinite(preco) || preco < 0) throw new Error("Informe nome e preço válidos.");
  if (ncm && !/^\d{8}$/.test(ncm)) throw new Error("O NCM deve ter 8 dígitos.");
  const { error } = await supabase.from("commerce_products").insert({ business_id: business.id, owner_id: ownerId, nome, sku: text(formData, "sku") || null, gtin: text(formData, "gtin").replace(/\D/g, "") || null, unidade: text(formData, "unidade").toUpperCase() || "UN", categoria: text(formData, "categoria") || null, preco_venda: preco, estoque_minimo: number(formData, "estoque_minimo") || 0, ncm });
  if (error) throw new Error(`Não foi possível cadastrar o produto: ${error.message}`);
  revalidatePath("/comercio/produtos");
}

export async function importarProdutosComercio(formData: FormData) {
  const { supabase, ownerId, business } = await requireCommerceAccess("produtos");
  if (!business) redirect("/comercio");
  const file = formData.get("csv");
  if (!(file instanceof File) || !file.size || file.size > 2 * 1024 * 1024 || !file.name.toLowerCase().endsWith(".csv")) go("/comercio/produtos", "erro", "Selecione um arquivo CSV de até 2 MB.");
  const parsed = Papa.parse<Record<string, string>>(await file.text(), { header: true, skipEmptyLines: true, transformHeader: header => header.trim().toLowerCase() });
  if (parsed.errors.length) go("/comercio/produtos", "erro", `CSV inválido: ${parsed.errors[0].message}`);
  if (!parsed.data.length || parsed.data.length > 500) go("/comercio/produtos", "erro", "O CSV deve conter entre 1 e 500 produtos.");
  const rows = parsed.data.map((row, index) => {
    const nome = (row.nome || "").trim(); const preco = Number((row.preco_venda || "").replace(",", "."));
    const gtin = (row.gtin || "").replace(/\D/g, "") || null; const ncm = (row.ncm || "").replace(/\D/g, "") || null;
    const minimo = Number((row.estoque_minimo || "0").replace(",", "."));
    if (nome.length < 2 || !Number.isFinite(preco) || preco < 0 || !Number.isFinite(minimo) || minimo < 0) go("/comercio/produtos", "erro", `Linha ${index + 2}: nome, preço ou estoque mínimo inválido.`);
    if (gtin && !/^(\d{8}|\d{12,14})$/.test(gtin)) go("/comercio/produtos", "erro", `Linha ${index + 2}: código de barras inválido.`);
    if (ncm && !/^\d{8}$/.test(ncm)) go("/comercio/produtos", "erro", `Linha ${index + 2}: NCM inválido.`);
    return { business_id: business.id, owner_id: ownerId, nome, sku: (row.sku || "").trim() || null, gtin, unidade: (row.unidade || "UN").trim().toUpperCase(), categoria: (row.categoria || "").trim() || null, marca: (row.marca || "").trim() || null, preco_venda: preco, estoque_minimo: minimo, ncm };
  });
  const { error } = await supabase.from("commerce_products").insert(rows);
  if (error) go("/comercio/produtos", "erro", error.code === "23505" ? "O CSV contém SKU ou código de barras já cadastrado." : error.message);
  revalidatePath("/comercio/produtos"); go("/comercio/produtos", "sucesso", `${rows.length} produtos importados.`);
}

export async function atualizarProdutoComercial(productId: string, formData: FormData) {
  const { supabase, business } = await requireCommerceAccess("produtos");
  if (!business || !uuidPattern.test(productId)) redirect("/comercio/produtos");
  const nome = text(formData, "nome");
  const precoVenda = number(formData, "preco_venda");
  const estoqueMinimo = number(formData, "estoque_minimo");
  const gtin = text(formData, "gtin").replace(/\D/g, "") || null;
  const ncm = text(formData, "ncm").replace(/\D/g, "") || null;
  const cest = text(formData, "cest").replace(/\D/g, "") || null;
  const origemMercadoria = text(formData, "origem_mercadoria").replace(/\D/g, "") || null;
  const cst = text(formData, "cst").replace(/\D/g, "") || null;
  const csosn = text(formData, "csosn").replace(/\D/g, "") || null;
  const path = `/comercio/produtos/${productId}`;

  if (nome.length < 2 || !Number.isFinite(precoVenda) || precoVenda < 0 || !Number.isFinite(estoqueMinimo) || estoqueMinimo < 0) go(path, "erro", "Informe nome, preço e estoque mínimo válidos.");
  if (gtin && !/^(\d{8}|\d{12,14})$/.test(gtin)) go(path, "erro", "O código de barras deve ter 8, 12, 13 ou 14 dígitos.");
  if (ncm && !/^\d{8}$/.test(ncm)) go(path, "erro", "O NCM deve ter 8 dígitos.");
  if (cest && !/^\d{7}$/.test(cest)) go(path, "erro", "O CEST deve ter 7 dígitos.");
  if (origemMercadoria && !/^\d$/.test(origemMercadoria)) go(path, "erro", "A origem da mercadoria deve ter 1 dígito.");
  if (cst && !/^\d{2}$/.test(cst)) go(path, "erro", "O CST deve ter 2 dígitos.");
  if (csosn && !/^\d{3}$/.test(csosn)) go(path, "erro", "O CSOSN deve ter 3 dígitos.");

  const { data: current } = await supabase.from("commerce_products")
    .select("ncm,cest,origem_mercadoria,cst,csosn,classificacao_fiscal_status,classificacao_revisada_em,classificacao_revisada_por")
    .eq("id", productId).eq("business_id", business.id).maybeSingle();
  if (!current) go("/comercio/produtos", "erro", "Produto não encontrado.");
  const fiscalChanged = current.ncm !== ncm || current.cest !== cest || current.origem_mercadoria !== origemMercadoria || current.cst !== cst || current.csosn !== csosn;

  const { error } = await supabase.from("commerce_products").update({
    nome, sku: text(formData, "sku") || null, gtin,
    unidade: text(formData, "unidade").toUpperCase() || "UN",
    categoria: text(formData, "categoria") || null, marca: text(formData, "marca") || null,
    preco_venda: precoVenda, estoque_minimo: estoqueMinimo,
    controla_lote: formData.get("controla_lote") === "on",
    controla_validade: formData.get("controla_validade") === "on",
    ncm, cest, origem_mercadoria: origemMercadoria, cst, csosn,
    classificacao_fiscal_status: fiscalChanged ? "revisar" : current.classificacao_fiscal_status,
    classificacao_revisada_em: fiscalChanged ? null : current.classificacao_revisada_em,
    classificacao_revisada_por: fiscalChanged ? null : current.classificacao_revisada_por,
    updated_at: new Date().toISOString(),
  }).eq("id", productId).eq("business_id", business.id);
  if (error) go(path, "erro", error.code === "23505" ? "SKU ou código de barras já utilizado." : error.message);
  revalidatePath("/comercio/produtos"); revalidatePath(path);
  go(path, "sucesso", "Produto atualizado.");
}

export async function alternarProdutoComercial(productId: string, ativar: boolean) {
  const { supabase, business } = await requireCommerceAccess("produtos");
  if (!business || !uuidPattern.test(productId)) redirect("/comercio/produtos");
  const path = `/comercio/produtos/${productId}`;
  const { error } = await supabase.from("commerce_products").update({ ativo: ativar, updated_at: new Date().toISOString() }).eq("id", productId).eq("business_id", business.id);
  if (error) go(path, "erro", "Não foi possível alterar o status do produto.");
  revalidatePath("/comercio/produtos"); revalidatePath(path);
  go(path, "sucesso", ativar ? "Produto ativado." : "Produto desativado.");
}

export async function criarVariacaoProdutoComercial(productId:string,formData:FormData){const{supabase,ownerId,business}=await requireCommerceAccess("produtos");const path=`/comercio/produtos/${productId}`;if(!business||!uuidPattern.test(productId))go("/comercio/produtos","erro","Produto inválido.");const nome=text(formData,"nome");const gtin=text(formData,"gtin").replace(/\D/g,"")||null;const priceRaw=text(formData,"preco_venda");const price=priceRaw?Number(priceRaw.replace(",",".")):null;const minimum=number(formData,"estoque_minimo")||0;if(!nome||minimum<0||(price!==null&&(!Number.isFinite(price)||price<0)))go(path,"erro","Revise nome, preço e estoque mínimo da variação.");if(gtin&&!/^(\d{8}|\d{12,14})$/.test(gtin))go(path,"erro","Código de barras da variação inválido.");const{data:product}=await supabase.from("commerce_products").select("id").eq("id",productId).eq("business_id",business.id).maybeSingle();if(!product)go(path,"erro","Produto não encontrado.");const{error}=await supabase.from("commerce_product_variants").insert({product_id:productId,business_id:business.id,owner_id:ownerId,nome,cor:text(formData,"cor")||null,tamanho:text(formData,"tamanho")||null,sku:text(formData,"sku")||null,gtin,preco_venda:price,estoque_minimo:minimum});if(error)go(path,"erro",error.code==="23505"?"SKU ou código de barras já utilizado.":error.message);revalidatePath(path);go(path,"sucesso","Variação cadastrada.");}

export async function alternarVariacaoProdutoComercial(productId:string,variantId:string,ativar:boolean){const{supabase,business}=await requireCommerceAccess("produtos");const path=`/comercio/produtos/${productId}`;if(!business||!uuidPattern.test(productId)||!uuidPattern.test(variantId))go(path,"erro","Variação inválida.");const{error}=await supabase.from("commerce_product_variants").update({ativo:ativar,updated_at:new Date().toISOString()}).eq("id",variantId).eq("product_id",productId).eq("business_id",business.id);if(error)go(path,"erro",error.message);revalidatePath(path);go(path,"sucesso",ativar?"Variação ativada.":"Variação desativada.");}

export async function criarEntradaManual(formData: FormData) {
  const { supabase, ownerId, business } = await requireCommerceAccess("compras");
  if (!business) redirect("/comercio");
  const productId = text(formData, "product_id"); const quantidade = number(formData, "quantidade"); const valorUnitario = number(formData, "valor_unitario");
  if (!uuidPattern.test(productId) || !(quantidade > 0) || !(valorUnitario >= 0)) go("/comercio/entradas", "erro", "Informe produto, quantidade e custo válidos.");
  const { data: product } = await supabase.from("commerce_products").select("id, nome, unidade").eq("id", productId).eq("business_id", business.id).maybeSingle();
  if (!product) go("/comercio/entradas", "erro", "Produto não encontrado.");
  const { data: entry, error } = await supabase.from("commerce_stock_entries").insert({ business_id: business.id, owner_id: ownerId, origem: "compra_manual", numero_documento: text(formData, "numero_documento") || null, valor_produtos: quantidade * valorUnitario, valor_total: quantidade * valorUnitario }).select("id").single();
  if (error || !entry) go("/comercio/entradas", "erro", "Não foi possível criar a entrada.");
  const { error: itemError } = await supabase.from("commerce_stock_entry_items").insert({ entry_id: entry.id, business_id: business.id, owner_id: ownerId, product_id: product.id, descricao_documento: product.nome, quantidade, unidade: product.unidade, valor_unitario: valorUnitario, valor_total: quantidade * valorUnitario });
  if (itemError) { await supabase.from("commerce_stock_entries").delete().eq("id", entry.id); go("/comercio/entradas", "erro", "Não foi possível registrar o item."); }
  redirect(`/comercio/entradas/${entry.id}`);
}

export async function criarCompraComercial(formData: FormData) {
  const { supabase, business } = await requireCommerceAccess("compras");
  if (!business) redirect("/comercio");
  const supplierId = text(formData, "supplier_id") || null;
  if (supplierId && !uuidPattern.test(supplierId)) go("/comercio/entradas", "erro", "Fornecedor inválido.");
  let items: Array<{ product_id: string; quantidade: number; valor_unitario: number }>;
  let installments: Array<{ vencimento: string; valor: number }>;
  try {
    items = JSON.parse(text(formData, "items"));
    installments = JSON.parse(text(formData, "installments") || "[]");
  } catch {
    go("/comercio/entradas", "erro", "Itens ou parcelas inválidos.");
  }
  if (!Array.isArray(items) || !items.length || items.some(item => !uuidPattern.test(item.product_id) || !Number.isFinite(item.quantidade) || item.quantidade <= 0 || !Number.isFinite(item.valor_unitario) || item.valor_unitario < 0)) go("/comercio/entradas", "erro", "Revise os produtos, quantidades e custos.");
  if (!Array.isArray(installments) || installments.some(row => !/^\d{4}-\d{2}-\d{2}$/.test(row.vencimento) || !Number.isFinite(row.valor) || row.valor <= 0)) go("/comercio/entradas", "erro", "Revise os vencimentos e valores das parcelas.");
  const freight = number(formData, "valor_frete") || 0;
  const discount = number(formData, "valor_desconto") || 0;
  if (freight < 0 || discount < 0) go("/comercio/entradas", "erro", "Frete e desconto não podem ser negativos.");
  const { data: entryId, error } = await supabase.rpc("commerce_criar_compra", {
    p_business_id: business.id, p_supplier_id: supplierId,
    p_numero_documento: text(formData, "numero_documento") || null,
    p_valor_frete: freight, p_valor_desconto: discount,
    p_observacoes: text(formData, "observacoes") || null,
    p_itens: items, p_parcelas: installments,
  });
  if (error || !entryId) go("/comercio/entradas", "erro", error?.message ?? "Não foi possível criar a compra.");
  revalidatePath("/comercio/entradas"); revalidatePath("/comercio/financeiro");
  redirect(`/comercio/entradas/${entryId}`);
}

export async function criarPedidoCompraComercio(formData:FormData){const{supabase,ownerId,business}=await requireCommerceAccess("compras");if(!business)redirect("/comercio");const supplierId=text(formData,"supplier_id");let items:Array<{product_id:string;variant_id?:string|null;quantidade:number;valor_unitario:number}>;try{items=JSON.parse(text(formData,"items"))}catch{go("/comercio/pedidos-compra","erro","Itens inválidos.")}if(!uuidPattern.test(supplierId)||!Array.isArray(items)||!items.length||items.some(i=>!uuidPattern.test(i.product_id)||(i.variant_id&&!uuidPattern.test(i.variant_id))||!(i.quantidade>0)||!(i.valor_unitario>=0)))go("/comercio/pedidos-compra","erro","Revise fornecedor e itens.");const ids=[...new Set(items.map(i=>i.product_id))];const{data:products}=await supabase.from("commerce_products").select("id,nome").eq("business_id",business.id).in("id",ids).eq("ativo",true);if(!products||products.length!==ids.length)go("/comercio/pedidos-compra","erro","Produto inválido.");const variantIds=[...new Set(items.map(i=>i.variant_id).filter((id):id is string=>Boolean(id)))];const{data:variants}=variantIds.length?await supabase.from("commerce_product_variants").select("id,product_id").eq("business_id",business.id).in("id",variantIds).eq("ativo",true):{data:[]};const variantById=new Map((variants??[]).map(v=>[v.id,v]));if((variants??[]).length!==variantIds.length||items.some(i=>i.variant_id&&variantById.get(i.variant_id)?.product_id!==i.product_id))go("/comercio/pedidos-compra","erro","Variação inválida para o produto selecionado.");const byId=new Map(products.map(p=>[p.id,p]));const{data:order,error}=await supabase.from("commerce_purchase_orders").insert({business_id:business.id,owner_id:ownerId,supplier_id:supplierId,previsao:text(formData,"previsao")||null,observacoes:text(formData,"observacoes")||null}).select("id").single();if(error||!order)go("/comercio/pedidos-compra","erro",error?.message??"Não foi possível criar o pedido.");const{error:itemError}=await supabase.from("commerce_purchase_order_items").insert(items.map(i=>({order_id:order.id,business_id:business.id,owner_id:ownerId,product_id:i.product_id,variant_id:i.variant_id||null,descricao:byId.get(i.product_id)!.nome,quantidade_pedida:i.quantidade,valor_unitario:i.valor_unitario})));if(itemError){await supabase.from("commerce_purchase_orders").delete().eq("id",order.id);go("/comercio/pedidos-compra","erro",itemError.message)}redirect(`/comercio/pedidos-compra/${order.id}`)}

export async function receberPedidoCompraComercio(orderId:string,formData:FormData){const{supabase}=await requireCommerceAccess("compras");let items:Array<{item_id:string;quantidade:number}>;try{items=JSON.parse(text(formData,"items"))}catch{go(`/comercio/pedidos-compra/${orderId}`,"erro","Itens inválidos.")}items=items.filter(i=>uuidPattern.test(i.item_id)&&i.quantidade>0);if(!items.length)go(`/comercio/pedidos-compra/${orderId}`,"erro","Informe ao menos uma quantidade recebida.");const{data,error}=await supabase.rpc("commerce_receber_pedido_compra",{p_order_id:orderId,p_itens:items});if(error||!data)go(`/comercio/pedidos-compra/${orderId}`,"erro",error?.message??"Falha no recebimento.");revalidatePath("/comercio/pedidos-compra");redirect(`/comercio/entradas/${data}`)}

export async function criarOrcamentoComercio(formData: FormData) {
  const { supabase, ownerId, business } = await requireCommerceAccess("vendas");
  if (!business) redirect("/comercio");
  let items: Array<{ product_id: string; variant_id?: string | null; quantidade: number; preco_unitario: number }>;
  try { items = JSON.parse(text(formData, "items")); } catch { go("/comercio/vendas/orcamentos", "erro", "Itens inválidos."); }
  if (!items.length || items.some(item => !uuidPattern.test(item.product_id) || (item.variant_id && !uuidPattern.test(item.variant_id)) || !(item.quantidade > 0) || !(item.preco_unitario >= 0))) go("/comercio/vendas/orcamentos", "erro", "Revise os itens do orçamento.");
  const productIds = [...new Set(items.map(item => item.product_id))];
  const variantIds = [...new Set(items.map(item => item.variant_id).filter((id): id is string => Boolean(id)))];
  const [{ data: products }, variantsResult] = await Promise.all([
    supabase.from("commerce_products").select("id,nome").eq("business_id", business.id).in("id", productIds).eq("ativo", true),
    variantIds.length ? supabase.from("commerce_product_variants").select("id,product_id,nome").eq("business_id", business.id).in("id", variantIds).eq("ativo", true) : Promise.resolve({ data: [] as Array<{id:string;product_id:string;nome:string}> }),
  ]);
  if ((products ?? []).length !== productIds.length || (variantsResult.data ?? []).length !== variantIds.length) go("/comercio/vendas/orcamentos", "erro", "Produto ou variação inválida.");
  const productById = new Map((products ?? []).map(product => [product.id, product]));
  const variantById = new Map((variantsResult.data ?? []).map(variant => [variant.id, variant]));
  if (items.some(item => item.variant_id && variantById.get(item.variant_id)?.product_id !== item.product_id)) go("/comercio/vendas/orcamentos", "erro", "A variação não pertence ao produto informado.");
  const prepared = items.map(item => { const total = Math.round(item.quantidade * item.preco_unitario * 100) / 100; const variant = item.variant_id ? variantById.get(item.variant_id) : null; return { ...item, descricao: `${productById.get(item.product_id)!.nome}${variant ? ` · ${variant.nome}` : ""}`, total }; });
  const subtotal = Math.round(prepared.reduce((sum, item) => sum + item.total, 0) * 100) / 100;
  const desconto = Math.min(Math.max(number(formData, "desconto") || 0, 0), subtotal);
  const customerId = text(formData, "customer_id") || null;
  if (customerId && !uuidPattern.test(customerId)) go("/comercio/vendas/orcamentos", "erro", "Cliente inválido.");
  const { data: quote, error } = await supabase.from("commerce_sales_quotes").insert({ business_id: business.id, owner_id: ownerId, customer_id: customerId, validade: text(formData, "validade") || null, subtotal, desconto, total: subtotal - desconto, observacoes: text(formData, "observacoes") || null }).select("id").single();
  if (error || !quote) go("/comercio/vendas/orcamentos", "erro", error?.message ?? "Não foi possível criar o orçamento.");
  const { error: itemError } = await supabase.from("commerce_sales_quote_items").insert(prepared.map(item => ({ quote_id: quote.id, business_id: business.id, owner_id: ownerId, product_id: item.product_id, variant_id: item.variant_id || null, descricao: item.descricao, quantidade: item.quantidade, preco_unitario: item.preco_unitario, total: item.total })));
  if (itemError) { await supabase.from("commerce_sales_quotes").delete().eq("id", quote.id); go("/comercio/vendas/orcamentos", "erro", itemError.message); }
  redirect(`/comercio/vendas/orcamentos/${quote.id}`);
}

export async function converterOrcamentoComercio(quoteId: string, formData: FormData) {
  const { supabase } = await requireCommerceAccess("vendas");
  const rawExpiry = text(formData, "reserva_ate"); const expiry = rawExpiry ? new Date(rawExpiry) : null;
  if (expiry && (Number.isNaN(expiry.getTime()) || expiry <= new Date())) go(`/comercio/vendas/orcamentos/${quoteId}`, "erro", "Informe um prazo futuro para a reserva.");
  const { data, error } = await supabase.rpc("commerce_converter_orcamento_em_pedido", { p_quote_id: quoteId, p_reserva_ate: expiry?.toISOString() ?? null });
  if (error || !data) go(`/comercio/vendas/orcamentos/${quoteId}`, "erro", error?.message ?? "Não foi possível gerar o pedido.");
  revalidatePath("/comercio/vendas/orcamentos"); redirect(`/comercio/vendas/pedidos/${data}`);
}

export async function cancelarPedidoVendaComercio(orderId: string) {
  const { supabase } = await requireCommerceAccess("vendas"); const { error } = await supabase.rpc("commerce_cancelar_pedido_venda", { p_order_id: orderId });
  if (error) go(`/comercio/vendas/pedidos/${orderId}`, "erro", error.message);
  revalidatePath("/comercio/vendas/pedidos"); go(`/comercio/vendas/pedidos/${orderId}`, "sucesso", "Pedido cancelado e estoque liberado.");
}

export async function faturarPedidoVendaComercio(orderId: string, formData: FormData) {
  const { supabase } = await requireCommerceAccess("vendas");
  if (!uuidPattern.test(orderId)) go("/comercio/vendas/pedidos", "erro", "Pedido inválido.");
  const allowed = new Set(["dinheiro", "pix", "debito", "credito", "boleto", "crediario", "outro"]);
  let payments: Array<{ forma: string; valor: number; recebido?: number }>;
  try { payments = JSON.parse(text(formData, "payments")); } catch { go(`/comercio/vendas/pedidos/${orderId}`, "erro", "Pagamentos inválidos."); }
  if (!payments.length || payments.length > 5 || payments.some(payment => !allowed.has(payment.forma) || !Number.isFinite(payment.valor) || payment.valor <= 0)) go(`/comercio/vendas/pedidos/${orderId}`, "erro", "Revise os pagamentos.");
  if (payments.some(payment => payment.forma === "dinheiro" && (!Number.isFinite(payment.recebido) || Number(payment.recebido) < payment.valor))) go(`/comercio/vendas/pedidos/${orderId}`, "erro", "O valor recebido em dinheiro é menor que a parcela.");
  const { data, error } = await supabase.rpc("commerce_faturar_pedido_venda", { p_order_id: orderId, p_pagamentos: payments.map(({ forma, valor }) => ({ forma, valor })) });
  if (error || !data) go(`/comercio/vendas/pedidos/${orderId}`, "erro", error?.message ?? "Não foi possível faturar o pedido.");
  revalidatePath("/comercio"); revalidatePath("/comercio/produtos"); revalidatePath("/comercio/vendas"); revalidatePath("/comercio/vendas/pedidos");
  redirect(`/comercio/vendas/${data}?sucesso=${encodeURIComponent("Pedido faturado e reserva consumida.")}`);
}

export async function importarNfeComercio(formData: FormData) {
  const { supabase, ownerId, business } = await requireCommerceAccess("compras");
  if (!business) redirect("/comercio");
  const file = formData.get("xml");
  if (!(file instanceof File) || !file.size || file.size > MAX_XML_BYTES || !file.name.toLowerCase().endsWith(".xml")) go("/comercio/entradas", "erro", "Selecione um XML de NF-e válido com até 5 MB.");
  let xml: string; let parsed: ReturnType<typeof parseNfeEntrada>;
  try { xml = await file.text(); parsed = parseNfeEntrada(xml); } catch (error) { go("/comercio/entradas", "erro", error instanceof Error ? error.message : "Não foi possível ler a NF-e."); }
  const { data: supplier, error: supplierError } = await supabase.from("commerce_suppliers").upsert({ business_id: business.id, owner_id: ownerId, nome: parsed.fornecedorFantasia || parsed.fornecedorNome, documento: parsed.fornecedorDocumento }, { onConflict: "business_id,documento" }).select("id").single();
  if (supplierError || !supplier) go("/comercio/entradas", "erro", "Não foi possível cadastrar o fornecedor.");
  const purchaseOrderId = text(formData, "purchase_order_id") || null;
  if (purchaseOrderId && !uuidPattern.test(purchaseOrderId)) go("/comercio/entradas", "erro", "Pedido de compra inválido.");
  const { data: entry, error } = await supabase.from("commerce_stock_entries").insert({ business_id: business.id, owner_id: ownerId, supplier_id: supplier.id, origem: "nfe_xml", numero_documento: parsed.numero, serie_documento: parsed.serie, chave_acesso_nfe: parsed.chaveAcesso, xml_sha256: createHash("sha256").update(xml).digest("hex"), emitida_em: parsed.emitidaEm, recebida_em: new Date().toISOString(), valor_produtos: parsed.itens.reduce((sum, item) => sum + item.valorTotal, 0), valor_total: parsed.valorTotal }).select("id").single();
  if (error || !entry) go("/comercio/entradas", "erro", error?.code === "23505" ? "Esta NF-e já foi importada." : "Não foi possível registrar a NF-e.");
  const { error: itemsError } = await supabase.from("commerce_stock_entry_items").insert(parsed.itens.map(item => ({ entry_id: entry.id, business_id: business.id, owner_id: ownerId, codigo_fornecedor: item.codigoFornecedor, descricao_documento: item.descricao, quantidade: item.quantidade, unidade: item.unidade, valor_unitario: item.valorUnitario, valor_total: item.valorTotal, gtin_documento: item.ean, ncm_documento: item.ncm, cest_documento: item.cest, cfop_documento: item.cfop })));
  if (itemsError) { await supabase.from("commerce_stock_entries").delete().eq("id", entry.id); go("/comercio/entradas", "erro", "A NF-e foi lida, mas os itens não puderam ser registrados."); }
  if (purchaseOrderId) {
    const { error: linkError } = await supabase.rpc("commerce_vincular_nfe_pedido_compra", { p_entry_id: entry.id, p_order_id: purchaseOrderId });
    if (linkError) { await supabase.from("commerce_stock_entries").delete().eq("id", entry.id); go("/comercio/entradas", "erro", linkError.message); }
  }
  redirect(`/comercio/entradas/${entry.id}`);
}

export async function efetivarEntrada(entryId: string, formData: FormData) {
  const { supabase, business } = await requireCommerceAccess("compras"); if (!business) redirect("/comercio");
  const { data: items } = await supabase.from("commerce_stock_entry_items").select("id").eq("entry_id", entryId).eq("business_id", business.id);
  const mappings = (items ?? []).map(item => { const [product_id,variant_id=""] = text(formData, `product_${item.id}`).split("|"); return { item_id:item.id, product_id, variant_id:variant_id||null, numero_lote:text(formData,`lote_${item.id}`)||null, validade:text(formData,`validade_${item.id}`)||null }; });
  if (!mappings.length || mappings.some(item => !uuidPattern.test(item.product_id))) go(`/comercio/entradas/${entryId}`, "erro", "Vincule todos os itens a produtos do catálogo.");
  const { error } = await supabase.rpc("commerce_efetivar_entrada", { p_entry_id: entryId, p_mapeamentos: mappings });
  if (error) go(`/comercio/entradas/${entryId}`, "erro", error.message);
  revalidatePath("/comercio"); revalidatePath("/comercio/produtos"); revalidatePath(`/comercio/entradas/${entryId}`);
  go(`/comercio/entradas/${entryId}`, "sucesso", "Entrada efetivada e estoque atualizado.");
}

export async function cancelarEntradaComercio(entryId: string) {
  const { supabase, business } = await requireCommerceAccess("compras");
  if (!business || !uuidPattern.test(entryId)) go("/comercio/entradas", "erro", "Compra inválida.");
  const path = `/comercio/entradas/${entryId}`;
  const { error } = await supabase.rpc("commerce_cancelar_entrada", { p_entry_id: entryId });
  if (error) go(path, "erro", error.message);
  revalidatePath("/comercio/entradas"); revalidatePath("/comercio/financeiro"); revalidatePath(path);
  go(path, "sucesso", "Compra cancelada. Nenhum estoque foi movimentado.");
}

export async function registrarDevolucaoFornecedorComercio(entryId: string, formData: FormData) {
  const { supabase, business } = await requireCommerceAccess("compras");
  const path = `/comercio/entradas/${entryId}`;
  if (!business || !uuidPattern.test(entryId)) go("/comercio/entradas", "erro", "Compra inválida.");
  let items: Array<{ entry_item_id: string; quantidade: number }>;
  try { items = JSON.parse(text(formData, "items")); }
  catch { go(path, "erro", "Itens da devolução inválidos."); }
  if (!Array.isArray(items) || !items.length || items.some(item => !uuidPattern.test(item.entry_item_id) || !Number.isFinite(item.quantidade) || item.quantidade <= 0)) go(path, "erro", "Selecione ao menos um item e uma quantidade válida.");
  const motivo = text(formData, "motivo");
  if (motivo.length < 3) go(path, "erro", "Informe o motivo da devolução.");
  const { error } = await supabase.rpc("commerce_registrar_devolucao_fornecedor", { p_entry_id: entryId, p_itens: items, p_motivo: motivo });
  if (error) go(path, "erro", error.message);
  revalidatePath("/comercio"); revalidatePath("/comercio/entradas"); revalidatePath(path); revalidatePath("/comercio/produtos"); revalidatePath("/comercio/financeiro");
  go(path, "sucesso", "Devolução registrada; estoque e financeiro atualizados.");
}

export async function concluirVendaComercial(formData: FormData) {
  const { supabase, ownerId, business } = await requireCommerceAccess("vendas"); if (!business) redirect("/comercio");
  let requested: Array<{ productId: string; variantId?: string | null; quantity: number }>;
  try { requested = JSON.parse(text(formData, "cart")) as Array<{ productId: string; quantity: number }>; } catch { go("/comercio/vendas/nova", "erro", "Carrinho inválido."); }
  requested = requested.filter(item => uuidPattern.test(item.productId) && (!item.variantId || uuidPattern.test(item.variantId)) && Number.isFinite(item.quantity) && item.quantity > 0);
  if (!requested.length) go("/comercio/vendas/nova", "erro", "Adicione produtos ao carrinho.");
  const ids = [...new Set(requested.map(item => item.productId))];
  const { data: products } = await supabase.from("commerce_products").select("id, nome, preco_venda, custo_medio, estoque_atual").eq("business_id", business.id).in("id", ids).eq("ativo", true);
  if (!products || products.length !== ids.length) go("/comercio/vendas/nova", "erro", "Um produto do carrinho não está mais disponível.");
  const byId = new Map(products.map(product => [product.id, product]));
  const variantIds=[...new Set(requested.map(item=>item.variantId).filter((id):id is string=>Boolean(id)))];
  const {data:variants}=variantIds.length?await supabase.from("commerce_product_variants").select("id,product_id,nome,preco_venda,custo_medio,estoque_atual").eq("business_id",business.id).in("id",variantIds).eq("ativo",true):{data:[]};
  if((variants??[]).length!==variantIds.length)go("/comercio/vendas/nova","erro","Uma variação não está mais disponível.");
  const variantById=new Map((variants??[]).map(variant=>[variant.id,variant]));
  const items = requested.map(item => { const base=byId.get(item.productId)!;const variant=item.variantId?variantById.get(item.variantId):null;if(variant&&variant.product_id!==base.id)go("/comercio/vendas/nova","erro","Variação não pertence ao produto.");const product={...base,nome:variant?`${base.nome} · ${variant.nome}`:base.nome,preco_venda:variant?.preco_venda??base.preco_venda,custo_medio:variant?.custo_medio??base.custo_medio,estoque_atual:variant?.estoque_atual??base.estoque_atual};const total=Number(product.preco_venda)*item.quantity;return{...item,product,total}; });
  if (items.some(item => Number(item.product.estoque_atual) < item.quantity)) go("/comercio/vendas/nova", "erro", "Um dos produtos não possui estoque suficiente.");
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const desconto = number(formData, "desconto");
  if (!Number.isFinite(desconto) || desconto < 0 || desconto > subtotal) go("/comercio/vendas/nova", "erro", "O desconto informado é inválido.");
  const total = Math.round((subtotal - desconto) * 100) / 100;
  if (total <= 0) go("/comercio/vendas/nova", "erro", "O total da venda deve ser maior que zero.");
  const customerId = text(formData, "customer_id") || null;
  if (customerId && !uuidPattern.test(customerId)) go("/comercio/vendas/nova", "erro", "Cliente inválido.");
  if (customerId) {
    const { data: customer } = await supabase.from("commerce_customers").select("id").eq("id", customerId).eq("business_id", business.id).eq("ativo", true).maybeSingle();
    if (!customer) go("/comercio/vendas/nova", "erro", "Cliente não encontrado.");
  }
  const allowed = new Set(["dinheiro", "pix", "debito", "credito", "boleto", "crediario", "outro"]);
  let payments: Array<{ forma: string; valor: number; recebido?: number }>;
  try { payments = JSON.parse(text(formData, "payments")) as Array<{ forma: string; valor: number; recebido?: number }>; }
  catch { go("/comercio/vendas/nova", "erro", "Pagamentos inválidos."); }
  if (!payments.length || payments.length > 5 || payments.some(payment => !allowed.has(payment.forma) || !Number.isFinite(payment.valor) || payment.valor <= 0)) go("/comercio/vendas/nova", "erro", "Revise as formas e os valores dos pagamentos.");
  const paidTotal = Math.round(payments.reduce((sum, payment) => sum + payment.valor, 0) * 100) / 100;
  if (paidTotal !== total) go("/comercio/vendas/nova", "erro", "A soma dos pagamentos deve ser igual ao total da venda.");
  if (payments.some(payment => payment.forma === "crediario") && !customerId) go("/comercio/vendas/nova", "erro", "Selecione um cliente para usar crediário.");
  if (payments.some(payment => payment.forma === "dinheiro" && (!Number.isFinite(payment.recebido) || Number(payment.recebido) < payment.valor))) go("/comercio/vendas/nova", "erro", "O valor recebido em dinheiro é menor que a parcela correspondente.");

  const { data: sale, error } = await supabase.from("commerce_sales").insert({ business_id: business.id, owner_id: ownerId, customer_id: customerId, subtotal, desconto, total }).select("id").single();
  if (error || !sale) go("/comercio/vendas/nova", "erro", "Não foi possível criar a venda.");
  const { error: itemError } = await supabase.from("commerce_sale_items").insert(items.map(item => ({ sale_id: sale.id, business_id: business.id, owner_id: ownerId, product_id: item.productId, variant_id:item.variantId||null, descricao: item.product.nome, quantidade: item.quantity, preco_unitario: item.product.preco_venda, total: item.total, custo_unitario_snapshot: item.product.custo_medio })));
  if (itemError) { await supabase.from("commerce_sales").delete().eq("id", sale.id); go("/comercio/vendas/nova", "erro", "Não foi possível registrar os itens."); }
  const { error: concludeError } = await supabase.rpc("commerce_concluir_venda", { p_sale_id: sale.id, p_pagamentos: payments.map(({ forma, valor }) => ({ forma, valor })) });
  if (concludeError) go("/comercio/vendas/nova", "erro", concludeError.message);
  revalidatePath("/comercio"); revalidatePath("/comercio/produtos"); revalidatePath("/comercio/vendas");
  redirect(`/comercio/vendas?sucesso=${encodeURIComponent("Venda concluída com sucesso.")}`);
}

export async function cancelarVendaComercial(saleId: string) {
  const { supabase } = await requireCommerceAccess("vendas");
  const { data: partialCredit } = await supabase.from("commerce_accounts_receivable").select("id").eq("sale_id", saleId).eq("status", "parcial").limit(1).maybeSingle();
  if (partialCredit) go(`/comercio/vendas/${saleId}`, "erro", "Esta venda possui crediário parcialmente recebido. Registre a devolução dos itens e trate o reembolso do valor recebido.");
  const { error } = await supabase.rpc("commerce_cancelar_venda", { p_sale_id: saleId });
  if (error) go("/comercio/vendas", "erro", error.message);
  revalidatePath("/comercio"); revalidatePath("/comercio/produtos"); revalidatePath("/comercio/vendas");
  go("/comercio/vendas", "sucesso", "Venda cancelada e estoque devolvido.");
}

export async function registrarDevolucaoComercial(saleId: string, formData: FormData) {
  const { supabase, business } = await requireCommerceAccess("vendas");
  const path = `/comercio/vendas/${saleId}`;
  if (!business || !uuidPattern.test(saleId)) go("/comercio/vendas", "erro", "Venda inválida.");
  let items: Array<{ sale_item_id: string; quantidade: number }>;
  try { items = JSON.parse(text(formData, "items")); }
  catch { go(path, "erro", "Itens da devolução inválidos."); }
  if (!Array.isArray(items) || !items.length || items.some(item => !uuidPattern.test(item.sale_item_id) || !Number.isFinite(item.quantidade) || item.quantidade <= 0)) go(path, "erro", "Selecione ao menos um item e uma quantidade válida.");
  const refundMethod = text(formData, "reembolso_forma") || null;
  const allowed = new Set(["dinheiro", "pix", "debito", "credito", "boleto", "outro"]);
  if (refundMethod && !allowed.has(refundMethod)) go(path, "erro", "Forma de reembolso inválida.");
  const { error } = await supabase.rpc("commerce_registrar_devolucao", { p_sale_id: saleId, p_itens: items, p_motivo: text(formData, "motivo"), p_reembolso_forma: refundMethod });
  if (error) go(path, "erro", error.message);
  revalidatePath("/comercio"); revalidatePath("/comercio/vendas"); revalidatePath(path); revalidatePath("/comercio/produtos"); revalidatePath("/comercio/caixa");
  go(path, "sucesso", refundMethod ? "Devolução e reembolso registrados." : "Devolução registrada; reembolso financeiro pendente.");
}

export async function atualizarModulosComercio(formData: FormData) {
  const { supabase, isOwner, subscription } = await requireCommerceAccess();
  if (!isOwner) throw new Error("Apenas o proprietário pode alterar o plano.");
  const selected = MODULOS_COMERCIO.filter(module => formData.get(`modulo_${module}`) === "on");
  if (!subscription?.addon_modulos_ilimitados && selected.length > 3) throw new Error("O plano base permite até 3 módulos.");
  const { error } = await supabase.rpc("commerce_atualizar_modulos", { p_modulos: selected });
  if (error) throw new Error(`Não foi possível salvar os módulos: ${error.message}`);
  revalidatePath("/comercio/plano");
}

export async function adicionarEquipeComercio(formData: FormData) {
  const { supabase, ownerId, isOwner, subscription } = await requireCommerceAccess();
  if (!isOwner) throw new Error("Apenas o proprietário pode cadastrar a equipe.");
  const email = text(formData, "email").toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Informe um e-mail válido.");
  if (!subscription?.addon_equipe_ilimitada) {
    const { count } = await supabase.from("commerce_staff").select("id", { count: "exact", head: true }).eq("owner_id", ownerId);
    if ((count ?? 0) >= 3) throw new Error("O plano base permite até 3 pessoas na equipe.");
  }
  const modules = MODULOS_COMERCIO.filter(module => formData.get(`modulo_${module}`) === "on");
  const { error } = await supabase.from("commerce_staff").insert({ owner_id: ownerId, email, nome: text(formData, "nome") || null, gerente: formData.get("gerente") === "on", modulos: modules });
  if (error) throw new Error(error.code === "23505" ? "Este e-mail já está na equipe." : error.message);
  revalidatePath("/comercio/equipe");
}

export async function removerEquipeComercio(id: string) {
  const { supabase, ownerId, isOwner } = await requireCommerceAccess(); if (!isOwner) throw new Error("Apenas o proprietário pode remover a equipe.");
  const { error } = await supabase.from("commerce_staff").delete().eq("id", id).eq("owner_id", ownerId);
  if (error) throw new Error(error.message); revalidatePath("/comercio/equipe");
}

export async function adicionarClienteComercio(formData: FormData) {
  const { supabase, ownerId, business } = await requireCommerceAccess("clientes"); if(!business)redirect("/comercio");
  const nome=text(formData,"nome");const limiteRaw=text(formData,"limite_credito");const limite=limiteRaw===""?null:number(formData,"limite_credito");if(nome.length<2)throw new Error("Informe o nome do cliente.");if(limite!==null&&(!Number.isFinite(limite)||limite<0))throw new Error("Informe um limite de crédito válido.");
  const {error}=await supabase.from("commerce_customers").insert({business_id:business.id,owner_id:ownerId,nome,documento:text(formData,"documento").replace(/\D/g,"")||null,email:text(formData,"email")||null,telefone:text(formData,"telefone")||null,limite_credito:limite});if(error)throw new Error(error.message);revalidatePath("/comercio/clientes");
}

export async function atualizarClienteComercio(customerId:string,formData:FormData){
  const{supabase,business}=await requireCommerceAccess("clientes");const path=`/comercio/clientes/${customerId}`;if(!business||!uuidPattern.test(customerId))go("/comercio/clientes","erro","Cliente inválido.");
  const nome=text(formData,"nome");const documento=text(formData,"documento").replace(/\D/g,"")||null;const limiteRaw=text(formData,"limite_credito");const limite=limiteRaw===""?null:number(formData,"limite_credito");
  if(nome.length<2)go(path,"erro","Informe o nome do cliente.");if(documento&&![11,14].includes(documento.length))go(path,"erro","CPF/CNPJ deve possuir 11 ou 14 dígitos.");if(limite!==null&&(!Number.isFinite(limite)||limite<0))go(path,"erro","Limite de crédito inválido.");
  const{error}=await supabase.from("commerce_customers").update({nome,documento,email:text(formData,"email")||null,telefone:text(formData,"telefone")||null,limite_credito:limite,observacoes:text(formData,"observacoes")||null,updated_at:new Date().toISOString()}).eq("id",customerId).eq("business_id",business.id);if(error)go(path,"erro",error.message);revalidatePath("/comercio/clientes");revalidatePath(path);go(path,"sucesso","Cliente atualizado.");
}

export async function alternarClienteComercio(customerId:string,ativar:boolean){const{supabase,business}=await requireCommerceAccess("clientes");const path=`/comercio/clientes/${customerId}`;if(!business||!uuidPattern.test(customerId))go("/comercio/clientes","erro","Cliente inválido.");const{error}=await supabase.from("commerce_customers").update({ativo:ativar,updated_at:new Date().toISOString()}).eq("id",customerId).eq("business_id",business.id);if(error)go(path,"erro",error.message);revalidatePath("/comercio/clientes");revalidatePath(path);go(path,"sucesso",ativar?"Cliente ativado.":"Cliente desativado.");}

export async function adicionarFornecedorComercio(formData: FormData) {
  const { supabase, ownerId, business } = await requireCommerceAccess("compras"); if (!business) redirect("/comercio");
  const nome = text(formData, "nome"); const documento = text(formData, "documento").replace(/\D/g, "") || null;
  if (nome.length < 2) go("/comercio/fornecedores", "erro", "Informe o nome do fornecedor.");
  if (documento && ![11, 14].includes(documento.length)) go("/comercio/fornecedores", "erro", "Informe um CPF ou CNPJ com 11 ou 14 dígitos.");
  const { error } = await supabase.from("commerce_suppliers").insert({ business_id: business.id, owner_id: ownerId, nome, documento, email: text(formData, "email") || null, telefone: text(formData, "telefone") || null, observacoes: text(formData, "observacoes") || null });
  if (error) go("/comercio/fornecedores", "erro", error.code === "23505" ? "Este documento já está cadastrado." : error.message);
  revalidatePath("/comercio/fornecedores"); go("/comercio/fornecedores", "sucesso", "Fornecedor cadastrado.");
}

export async function alternarFornecedorComercio(id: string, ativar: boolean) {
  const { supabase, business } = await requireCommerceAccess("compras");
  if (!business || !uuidPattern.test(id)) go("/comercio/fornecedores", "erro", "Fornecedor inválido.");
  const { error } = await supabase.from("commerce_suppliers").update({ ativo: ativar, updated_at: new Date().toISOString() }).eq("id", id).eq("business_id", business.id);
  if (error) go("/comercio/fornecedores", "erro", error.message);
  revalidatePath("/comercio/fornecedores"); go("/comercio/fornecedores", "sucesso", ativar ? "Fornecedor ativado." : "Fornecedor desativado.");
}

export async function adicionarContaPagarComercio(formData: FormData) {
  const {supabase,ownerId,business}=await requireCommerceAccess("financeiro");if(!business)redirect("/comercio");const valor=number(formData,"valor");const vencimento=text(formData,"vencimento");const competencia=text(formData,"competencia_em");const natureza=text(formData,"natureza_dre");const allowed=new Set(["despesa_operacional","despesa_administrativa","despesa_comercial","despesa_financeira","despesa_tributaria","outras_despesas","nao_classificada"]);if(!(valor>0)||!/^\d{4}-\d{2}-\d{2}$/.test(vencimento)||!/^\d{4}-\d{2}-\d{2}$/.test(competencia)||!allowed.has(natureza))throw new Error("Informe valor, competência, vencimento e classificação válidos.");const{error}=await supabase.from("commerce_accounts_payable").insert({business_id:business.id,owner_id:ownerId,descricao:text(formData,"descricao"),valor,vencimento,competencia_em:competencia,natureza_dre:natureza});if(error)throw new Error(error.message);revalidatePath("/comercio/financeiro");revalidatePath("/comercio/gestao/dre");
}

export async function marcarContaPagaComercio(tipo:"pagar"|"receber",id:string,formData:FormData){const{supabase}=await requireCommerceAccess("financeiro");if(!uuidPattern.test(id))go("/comercio/financeiro","erro","Conta inválida.");const valor=number(formData,"valor");if(!(valor>0))go("/comercio/financeiro","erro","Informe um valor válido para a baixa.");const{error}=await supabase.rpc("commerce_baixar_conta",{p_tipo:tipo,p_id:id,p_valor:valor,p_forma:text(formData,"forma")||null});if(error)go("/comercio/financeiro","erro",error.message);revalidatePath("/comercio/financeiro");revalidatePath("/comercio/caixa");revalidatePath("/comercio/clientes");go("/comercio/financeiro","sucesso",tipo==="receber"?"Recebimento registrado no caixa.":"Pagamento registrado no caixa.");}

export async function receberCreditoFornecedorComercio(returnId:string,formData:FormData){const{supabase,business}=await requireCommerceAccess("financeiro");if(!business||!uuidPattern.test(returnId))go("/comercio/financeiro","erro","Crédito inválido.");const valor=number(formData,"valor");if(!(valor>0))go("/comercio/financeiro","erro","Informe um valor válido.");const{error}=await supabase.rpc("commerce_receber_credito_fornecedor",{p_return_id:returnId,p_valor:valor,p_forma:text(formData,"forma")||null,p_observacoes:text(formData,"observacoes")||null});if(error)go("/comercio/financeiro","erro",error.message);revalidatePath("/comercio/financeiro");revalidatePath("/comercio/caixa");go("/comercio/financeiro","sucesso","Reembolso do fornecedor registrado no caixa.");}

export async function compensarCreditoFornecedorComercio(returnId:string,formData:FormData){const{supabase,business}=await requireCommerceAccess("financeiro");const payableId=text(formData,"account_payable_id");const valor=number(formData,"valor");if(!business||!uuidPattern.test(returnId)||!uuidPattern.test(payableId)||!(valor>0))go("/comercio/financeiro","erro","Crédito, conta ou valor inválido.");const{error}=await supabase.rpc("commerce_compensar_credito_fornecedor",{p_return_id:returnId,p_account_payable_id:payableId,p_valor:valor,p_observacoes:text(formData,"observacoes")||null});if(error)go("/comercio/financeiro","erro",error.message);revalidatePath("/comercio/financeiro");go("/comercio/financeiro","sucesso","Crédito aplicado à conta a pagar, sem movimentar o caixa.");}

export async function adicionarMovimentoCaixaComercio(formData:FormData){const{supabase,ownerId,business}=await requireCommerceAccess("financeiro");if(!business)redirect("/comercio");const valor=number(formData,"valor");const tipo=text(formData,"tipo");if(!(valor>0)||!["entrada_manual","saida_manual","aporte","retirada"].includes(tipo))throw new Error("Movimento inválido.");const{error}=await supabase.from("commerce_cash_movements").insert({business_id:business.id,owner_id:ownerId,tipo,descricao:text(formData,"descricao"),valor});if(error)throw new Error(error.message);revalidatePath("/comercio/caixa");}

export async function abrirCaixaComercio(formData:FormData){const{supabase,business}=await requireCommerceAccess("financeiro");if(!business)redirect("/comercio");const saldo=number(formData,"saldo_inicial");if(!Number.isFinite(saldo)||saldo<0)go("/comercio/caixa","erro","Saldo inicial inválido.");const{error}=await supabase.rpc("commerce_abrir_caixa",{p_business_id:business.id,p_saldo_inicial:saldo});if(error)go("/comercio/caixa","erro",error.message);revalidatePath("/comercio/caixa");go("/comercio/caixa","sucesso","Caixa aberto.");}

export async function fecharCaixaComercio(sessionId:string,formData:FormData){const{supabase}=await requireCommerceAccess("financeiro");if(!uuidPattern.test(sessionId))go("/comercio/caixa","erro","Sessão inválida.");const saldo=number(formData,"saldo_informado");if(!Number.isFinite(saldo)||saldo<0)go("/comercio/caixa","erro","Saldo contado inválido.");const{error}=await supabase.rpc("commerce_fechar_caixa",{p_session_id:sessionId,p_saldo_informado:saldo,p_observacoes:text(formData,"observacoes")||null});if(error)go("/comercio/caixa","erro",error.message);revalidatePath("/comercio/caixa");go("/comercio/caixa","sucesso","Caixa fechado e diferença apurada.");}

export async function criarInventarioComercio(formData:FormData){const{supabase,ownerId,business}=await requireCommerceAccess("estoque");if(!business)redirect("/comercio");const{data:products}=await supabase.from("commerce_products").select("id,estoque_atual").eq("business_id",business.id).eq("ativo",true);const{data:count,error}=await supabase.from("commerce_inventory_counts").insert({business_id:business.id,owner_id:ownerId,observacoes:text(formData,"observacoes")||null}).select("id").single();if(error||!count)throw new Error("Não foi possível abrir o inventário.");if(products?.length){const{error:itemError}=await supabase.from("commerce_inventory_count_items").insert(products.map(p=>({count_id:count.id,business_id:business.id,owner_id:ownerId,product_id:p.id,saldo_sistema:p.estoque_atual,saldo_contado:p.estoque_atual})));if(itemError)throw new Error(itemError.message);}redirect(`/comercio/inventario/${count.id}`);}

export async function concluirInventarioComercio(id:string,formData:FormData){const{supabase,business}=await requireCommerceAccess("estoque");if(!business)redirect("/comercio");const{data:items}=await supabase.from("commerce_inventory_count_items").select("id").eq("count_id",id).eq("business_id",business.id);for(const item of items??[]){const value=Number(formData.get(`contado_${item.id}`));if(!Number.isFinite(value)||value<0)throw new Error("Informe todas as quantidades contadas.");await supabase.from("commerce_inventory_count_items").update({saldo_contado:value}).eq("id",item.id);}const{error}=await supabase.rpc("commerce_concluir_inventario",{p_count_id:id});if(error)throw new Error(error.message);revalidatePath("/comercio/produtos");redirect("/comercio/inventario");}

export async function atualizarFiscalComercio(formData:FormData){
  const{supabase,business,isGerente}=await requireCommerceAccess("fiscal");if(!business)redirect("/comercio");if(!isGerente)go("/comercio/fiscal","erro","Somente proprietário ou gerente pode alterar a configuração fiscal.");
  const cnpj=text(formData,"cnpj").replace(/\D/g,"")||null;const uf=text(formData,"uf").toUpperCase()||null;const cnae=text(formData,"cnae_principal").replace(/\D/g,"")||null;const crtRaw=text(formData,"crt");const crt=crtRaw?Number(crtRaw):null;
  if(cnpj&&!/^\d{14}$/.test(cnpj))go("/comercio/fiscal","erro","O CNPJ deve ter 14 dígitos.");if(uf&&!/^[A-Z]{2}$/.test(uf))go("/comercio/fiscal","erro","Informe uma UF válida.");if(cnae&&!/^\d{7}$/.test(cnae))go("/comercio/fiscal","erro","O CNAE deve ter 7 dígitos.");if(crt!==null&&![1,2,3,4].includes(crt))go("/comercio/fiscal","erro","CRT inválido.");
  const regime=text(formData,"regime_tributario")||null;const allowedRegimes=new Set(["mei","simples_nacional","lucro_presumido","lucro_real"]);if(regime&&!allowedRegimes.has(regime))go("/comercio/fiscal","erro","Regime tributário inválido.");
  const{error:businessError}=await supabase.from("commerce_businesses").update({nome:text(formData,"nome"),nome_fantasia:text(formData,"nome_fantasia")||null,cnpj,inscricao_estadual:text(formData,"inscricao_estadual")||null,uf,updated_at:new Date().toISOString()}).eq("id",business.id);if(businessError)go("/comercio/fiscal","erro",businessError.message);
  const{error}=await supabase.from("commerce_fiscal_settings").update({ambiente:"homologacao",regime_tributario:regime,crt,cnae_principal:cnae,contador_nome:text(formData,"contador_nome")||null,contador_crc:text(formData,"contador_crc")||null,revisao_status:"revisar",revisada_em:null,revisada_por:null,observacoes:text(formData,"observacoes")||null,updated_at:new Date().toISOString()}).eq("business_id",business.id);if(error)go("/comercio/fiscal","erro",error.message);
  revalidatePath("/comercio");revalidatePath("/comercio/fiscal");go("/comercio/fiscal","sucesso","Configuração salva e enviada para revisão do contador.");
}

export async function revisarEstabelecimentoFiscalComercio(formData:FormData){const{supabase,isGerente}=await requireCommerceAccess("fiscal");if(!isGerente)go("/comercio/fiscal","erro","Somente proprietário ou gerente pode registrar a revisão.");if(formData.get("declaracao")!=="on")go("/comercio/fiscal","erro","Confirme a declaração de revisão profissional.");const{error}=await supabase.rpc("commerce_revisar_estabelecimento_fiscal",{p_observacoes:text(formData,"observacoes_revisao")||null});if(error)go("/comercio/fiscal","erro",error.message);revalidatePath("/comercio/fiscal");go("/comercio/fiscal","sucesso","Revisão do estabelecimento registrada na trilha de auditoria.");}

export async function revisarProdutoFiscalComercio(productId:string,formData:FormData){const{supabase,isGerente}=await requireCommerceAccess("fiscal");if(!isGerente||!uuidPattern.test(productId))go("/comercio/fiscal","erro","Operação fiscal não autorizada.");if(formData.get("declaracao")!=="on")go("/comercio/fiscal","erro","Confirme que a classificação foi revisada pelo responsável informado.");const{error}=await supabase.rpc("commerce_revisar_produto_fiscal",{p_product_id:productId,p_observacoes:text(formData,"observacoes")||null});if(error)go("/comercio/fiscal","erro",error.message);revalidatePath("/comercio/fiscal");revalidatePath(`/comercio/produtos/${productId}`);go("/comercio/fiscal","sucesso","Classificação do produto registrada como revisada.");}

export async function prepararDocumentoFiscalComercio(saleId:string,formData:FormData){const{supabase,isGerente}=await requireCommerceAccess("fiscal");if(!isGerente||!uuidPattern.test(saleId))go("/comercio/fiscal/emissoes","erro","Venda inválida ou operação não autorizada.");const modelo=text(formData,"modelo");if(!["55","65"].includes(modelo))go("/comercio/fiscal/emissoes","erro","Modelo fiscal inválido.");const{data,error}=await supabase.rpc("commerce_preparar_documento_fiscal",{p_sale_id:saleId,p_modelo:modelo});if(error||!data)go("/comercio/fiscal/emissoes","erro",error?.message??"Não foi possível preparar o documento.");revalidatePath("/comercio/fiscal/emissoes");go("/comercio/fiscal/emissoes","sucesso","Pré-validação concluída. Consulte o resultado na fila.");}

export async function simularDocumentoFiscalComercio(documentId:string){const{supabase,isGerente}=await requireCommerceAccess("fiscal");if(!isGerente||!uuidPattern.test(documentId))go("/comercio/fiscal/emissoes","erro","Documento inválido ou operação não autorizada.");const{error}=await supabase.rpc("commerce_simular_documento_fiscal",{p_document_id:documentId});if(error)go("/comercio/fiscal/emissoes","erro",error.message);revalidatePath("/comercio/fiscal/emissoes");go("/comercio/fiscal/emissoes","sucesso","Simulação registrada. Nenhum documento foi transmitido.");}

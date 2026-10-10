import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireRestaurantSubscription } from "@/lib/subscription";

// Backup completo, pra quando o restaurante quiser levar os próprios dados
// embora (cancelamento) ou só guardar uma cópia — não é um relatório
// calculado por período como export-vendas/export-estoque, é o despejo cru
// de cada tabela, uma aba por módulo. Pensado pra ser pedido a partir de
// /restaurante/plano.
function planilha(livro: XLSX.WorkBook, nome: string, linhas: Record<string, unknown>[]) {
  const dados = linhas.length > 0 ? linhas : [{ aviso: "Sem dados" }];
  const sheet = XLSX.utils.json_to_sheet(dados);
  XLSX.utils.book_append_sheet(livro, sheet, nome.slice(0, 31));
}

export async function GET() {
  const { supabase, restaurantOwnerId, isOwner } = await requireRestaurantSubscription();
  if (!isOwner) {
    return NextResponse.json({ error: "Apenas o dono do restaurante pode baixar o backup completo." }, { status: 403 });
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, slug, country_code")
    .eq("owner_user_id", restaurantOwnerId)
    .maybeSingle();

  const [
    { data: produtos },
    { data: pedidos },
    { data: itensPedidos },
    { data: ingredientes },
    { data: movimentosEstoque },
    { data: caixa },
    { data: custosFixos },
    { data: orcamentosCompra },
    { data: itensOrcamento },
    { data: equipe },
  ] = await Promise.all([
    supabase.from("del_products").select("*").eq("owner_id", restaurantOwnerId).order("nome"),
    supabase.from("del_orders").select("*").eq("owner_id", restaurantOwnerId).order("created_at", { ascending: false }),
    supabase.from("del_order_items").select("*").eq("owner_id", restaurantOwnerId).order("created_at", { ascending: false }),
    supabase.from("del_ingredients").select("*").eq("owner_id", restaurantOwnerId).order("nome"),
    supabase.from("del_stock_movements").select("*").eq("owner_id", restaurantOwnerId).order("created_at", { ascending: false }),
    supabase.from("del_caixa_movimentos").select("*").eq("owner_id", restaurantOwnerId).order("data", { ascending: false }),
    supabase.from("del_fixed_costs").select("*").eq("owner_id", restaurantOwnerId),
    supabase.from("del_orcamentos_compra").select("*").eq("owner_id", restaurantOwnerId).order("created_at", { ascending: false }),
    supabase.from("del_orcamento_itens").select("*").eq("owner_id", restaurantOwnerId),
    supabase.from("del_staff").select("id, email, nome, gerente, modulos, created_at").eq("owner_id", restaurantOwnerId),
  ]);

  const fiscal =
    restaurant?.country_code === "IT"
      ? await supabase
          .from("fiscal_documents")
          .select("*, fiscal_documents_it(*)")
          .eq("restaurant_id", restaurant.id)
          .order("created_at", { ascending: false })
      : await supabase.from("del_notas_fiscais").select("*").eq("owner_id", restaurantOwnerId).order("created_at", { ascending: false });

  const livro = XLSX.utils.book_new();
  planilha(livro, "Cardápio", produtos ?? []);
  planilha(livro, "Vendas - Pedidos", pedidos ?? []);
  planilha(livro, "Vendas - Itens", itensPedidos ?? []);
  planilha(livro, "Estoque - Ingredientes", ingredientes ?? []);
  planilha(livro, "Estoque - Movimentos", movimentosEstoque ?? []);
  planilha(livro, "Financeiro - Caixa", caixa ?? []);
  planilha(livro, "Financeiro - Custos Fixos", custosFixos ?? []);
  planilha(livro, "Compras - Orçamentos", orcamentosCompra ?? []);
  planilha(livro, "Compras - Itens", itensOrcamento ?? []);
  planilha(livro, "Equipe", equipe ?? []);
  planilha(livro, "Fiscal", fiscal.data ?? []);

  const buffer = XLSX.write(livro, { type: "buffer", bookType: "xlsx" });
  const nomeArquivo = `backup-completo-${restaurant?.slug ?? "restaurante"}-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}

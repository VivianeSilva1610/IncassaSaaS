import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { gerarPeriodosMensal, gerarPeriodoAnual, calcularFechamentosEstoque } from "@/lib/delivery/estoque-historico";

function csvEscape(value: unknown) {
  const texto = String(value ?? "");
  return /[",\n;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function decimalCsv(value: number | null) {
  return value == null ? "" : value.toFixed(2).replace(".", ",");
}

const COLUNAS = ["Período", "Código", "Nome", "Unidade", "Quantidade final", "Entradas no período", "Saídas no período", "Ajustes no período", "Custo unitário atual (R$)", "Valor em estoque (custo atual, R$)"];

function mesAtualSP(): string {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  return `${partes.find((p) => p.type === "year")!.value}-${partes.find((p) => p.type === "month")!.value}`;
}

export async function GET(req: Request) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();

  const url = new URL(req.url);
  const periodoTipo = url.searchParams.get("periodo") === "anual" ? "anual" : "mensal";
  const formato = url.searchParams.get("formato") === "excel" ? "excel" : "csv";

  let periodos;
  if (periodoTipo === "anual") {
    const ano = Number(url.searchParams.get("ano")) || new Date().getFullYear();
    periodos = gerarPeriodoAnual(ano);
  } else {
    const hoje = mesAtualSP();
    const de = /^\d{4}-\d{2}$/.test(url.searchParams.get("de") ?? "") ? url.searchParams.get("de")! : hoje;
    const ateParam = /^\d{4}-\d{2}$/.test(url.searchParams.get("ate") ?? "") ? url.searchParams.get("ate")! : hoje;
    const ate = ateParam > hoje ? hoje : ateParam;
    periodos = gerarPeriodosMensal(de, ate);
  }

  if (periodos.length === 0) return NextResponse.json({ error: "Período inválido." }, { status: 400 });

  const boundaryMaisAntigo = periodos[0].boundaryMs;

  const { data: ingredientes, error: ingredientesError } = await supabase
    .from("del_ingredients")
    .select("id, codigo, nome, unidade, quantidade_atual, custo_unitario")
    .eq("owner_id", restaurantOwnerId)
    .order("nome");
  if (ingredientesError) return NextResponse.json({ error: `Falha ao consultar o estoque: ${ingredientesError.message}` }, { status: 500 });

  // Só precisa dos movimentos depois do corte do período mais antigo pedido —
  // são eles que são "desfeitos" a partir do saldo atual pra reconstruir cada
  // fechamento. Movimentos anteriores a esse corte não entram em nenhuma soma.
  const { data: movimentos, error: movimentosError } = await supabase
    .from("del_stock_movements")
    .select("ingredient_id, tipo, quantidade, created_at")
    .eq("owner_id", restaurantOwnerId)
    .gt("created_at", new Date(boundaryMaisAntigo).toISOString());
  if (movimentosError) return NextResponse.json({ error: `Falha ao consultar movimentos: ${movimentosError.message}` }, { status: 500 });

  const linhas = calcularFechamentosEstoque(ingredientes ?? [], movimentos ?? [], periodos);
  const nomeArquivo = `estoque-${periodoTipo}-${periodos[0].label.replace("/", "-")}-a-${periodos[periodos.length - 1].label.replace("/", "-")}`;

  if (formato === "excel") {
    const planilha = XLSX.utils.json_to_sheet(
      linhas.map((l) => ({
        Período: l.periodo,
        Código: l.codigo,
        Nome: l.nome,
        Unidade: l.unidade,
        "Quantidade final": l.quantidadeFinal,
        "Entradas no período": l.entradas,
        "Saídas no período": l.saidas,
        "Ajustes no período": l.ajustes,
        "Custo unitário atual": l.custoUnitarioAtual ?? "",
        "Valor em estoque (custo atual)": l.valorEmEstoqueAtual ?? "",
      })),
    );
    const livro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(livro, planilha, "Estoque por período");
    const buffer = XLSX.write(livro, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nomeArquivo}.xlsx"`,
      },
    });
  }

  const corpo = linhas.map((l) =>
    [l.periodo, l.codigo, l.nome, l.unidade, decimalCsv(l.quantidadeFinal), decimalCsv(l.entradas), decimalCsv(l.saidas), decimalCsv(l.ajustes), decimalCsv(l.custoUnitarioAtual), decimalCsv(l.valorEmEstoqueAtual)]
      .map(csvEscape)
      .join(";"),
  );
  const csv = "﻿" + [COLUNAS.map(csvEscape).join(";"), ...corpo].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivo}.csv"`,
    },
  });
}

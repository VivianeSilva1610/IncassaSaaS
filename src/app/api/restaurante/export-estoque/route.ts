import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireRestaurantSubscription } from "@/lib/subscription";

function csvEscape(value: unknown) {
  const texto = String(value ?? "");
  return /[",\n;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function decimalCsv(value: number) {
  return value.toFixed(2).replace(".", ",");
}

const COLUNAS = ["Código", "Nome", "Unidade", "Quantidade atual", "Estoque mínimo", "Custo unitário (R$)", "Valor em estoque (R$)", "Situação"];

export async function GET(req: Request) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();

  const { data: ingredientes, error } = await supabase
    .from("del_ingredients")
    .select("codigo, nome, unidade, quantidade_atual, estoque_minimo, custo_unitario")
    .eq("owner_id", restaurantOwnerId)
    .order("nome");
  if (error) return NextResponse.json({ error: `Falha ao consultar o estoque: ${error.message}` }, { status: 500 });

  const linhas = (ingredientes ?? []).map((i) => {
    const quantidade = Number(i.quantidade_atual);
    const custo = i.custo_unitario != null ? Number(i.custo_unitario) : null;
    const emFalta = i.estoque_minimo != null && quantidade <= Number(i.estoque_minimo);
    return {
      codigo: i.codigo,
      nome: i.nome,
      unidade: i.unidade,
      quantidade,
      estoqueMinimo: i.estoque_minimo != null ? Number(i.estoque_minimo) : null,
      custo,
      valorEmEstoque: custo != null ? quantidade * custo : null,
      situacao: emFalta ? "Em falta" : "OK",
    };
  });

  const formato = new URL(req.url).searchParams.get("formato") === "excel" ? "excel" : "csv";
  const nomeArquivo = `estoque-${new Date().toISOString().slice(0, 10)}`;

  if (formato === "excel") {
    const planilha = XLSX.utils.json_to_sheet(
      linhas.map((l) => ({
        Código: l.codigo,
        Nome: l.nome,
        Unidade: l.unidade,
        "Quantidade atual": l.quantidade,
        "Estoque mínimo": l.estoqueMinimo ?? "",
        "Custo unitário (R$)": l.custo ?? "",
        "Valor em estoque (R$)": l.valorEmEstoque ?? "",
        Situação: l.situacao,
      })),
      { header: COLUNAS.map((c) => c.replace(" (R$)", "")) },
    );
    const livro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(livro, planilha, "Estoque");
    const buffer = XLSX.write(livro, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nomeArquivo}.xlsx"`,
      },
    });
  }

  const corpo = linhas.map((l) =>
    [l.codigo, l.nome, l.unidade, decimalCsv(l.quantidade), l.estoqueMinimo != null ? decimalCsv(l.estoqueMinimo) : "", l.custo != null ? decimalCsv(l.custo) : "", l.valorEmEstoque != null ? decimalCsv(l.valorEmEstoque) : "", l.situacao]
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

import type { SupabaseClient } from "@supabase/supabase-js";
import { linha, dataSped, dataSpedDeYyyyMmDd, numeroSped } from "./registros";
import { offsetParaData } from "@/lib/fiscal/fechamento";

// Gerador do SPED Fiscal (EFD-ICMS/IPI) — Blocos 0 (identificação/itens),
// C (documentos fiscais — NFC-e modelo 65) e 9 (controle/encerramento).
//
// NÃO cobre ainda: Bloco C100/C170 (NF-e de compra — depende da Fase 2,
// que ainda não captura imposto do XML do fornecedor), Bloco D (serviços),
// Bloco E (apuração do ICMS — precisa do crédito de compra pra fechar
// débito×crédito), Bloco G/H/K (ativo imobilizado, inventário, produção).
//
// COD_VER (versão do leiaute) muda por Ato COTEPE periodicamente — o valor
// abaixo é um placeholder e PRECISA ser conferido contra a versão vigente
// antes de qualquer geração que vá ser transmitida de verdade.
const COD_VER_LEIAUTE_A_CONFERIR = "999";

type FiscalConfig = {
  razao_social: string | null;
  cnpj: string | null;
  inscricao_estadual: string | null;
  cnae: string | null;
  codigo_municipio_ibge: string | null;
  uf: string | null;
  nome_fantasia: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  regime_tributario: string | null;
};

type ItemSnapshot = {
  product_id: string;
  nome: string;
  quantidade: number;
  preco_unitario: number;
  valor_total: number;
  ncm: string | null;
  cfop: string | null;
  cest: string | null;
  origem: number | null;
  cst: string | null;
  csosn: string | null;
  aliquota_icms: number | null;
};

type NotaFiscal = {
  id: string;
  numero: number | null;
  status: string;
  emitida_em: string | null;
  chave_acesso: string | null;
  itens_snapshot: unknown;
  del_orders: { cliente_cpf_cnpj: string | null; totale: number } | { cliente_cpf_cnpj: string | null; totale: number }[] | null;
};

export type ResultadoSped = {
  conteudo: string;
  completo: boolean;
  avisos: string[];
  totalDocumentos: number;
};

export async function gerarEfdIcmsIpi(
  supabase: SupabaseClient,
  ownerId: string,
  dataInicial: string,
  dataFinal: string,
): Promise<ResultadoSped> {
  const avisos: string[] = [];

  const { data: config } = await supabase
    .from("del_fiscal_config")
    .select("razao_social, cnpj, inscricao_estadual, cnae, codigo_municipio_ibge, uf, nome_fantasia, cep, logradouro, numero, bairro, regime_tributario")
    .eq("owner_id", ownerId)
    .maybeSingle<FiscalConfig>();

  if (!config?.cnpj || !config?.razao_social) avisos.push("Cadastro do estabelecimento incompleto (CNPJ/razão social) — complete em Dados do estabelecimento.");
  if (!config?.codigo_municipio_ibge) avisos.push("Código do município (IBGE) não informado — obrigatório no registro 0000.");
  if (!config?.inscricao_estadual) avisos.push("Inscrição Estadual não informada.");
  if (!config?.cnae) avisos.push("CNAE não informado.");

  const { data: notas } = await supabase
    .from("del_notas_fiscais")
    .select("id, numero, status, emitida_em, chave_acesso, itens_snapshot, del_orders(cliente_cpf_cnpj, totale)")
    .eq("owner_id", ownerId)
    .in("status", ["emitida", "cancelada"])
    .gte("emitida_em", `${dataInicial}T00:00:00${offsetParaData("America/Sao_Paulo", dataInicial)}`)
    .lte("emitida_em", `${dataFinal}T23:59:59.999${offsetParaData("America/Sao_Paulo", dataFinal)}`)
    .order("emitida_em", { ascending: true })
    .returns<NotaFiscal[]>();

  const notasValidas = notas ?? [];
  if (notasValidas.length === 0) avisos.push("Nenhum documento fiscal emitido ou cancelado no período.");

  // --- Montagem das linhas por bloco, com contagem pra seção 9 ---
  const linhas0: string[] = [];
  const linhasC: string[] = [];
  const contagemPorTipo = new Map<string, number>();
  function registrar(reg: string, texto: string, destino: string[]) {
    destino.push(texto);
    contagemPorTipo.set(reg, (contagemPorTipo.get(reg) ?? 0) + 1);
  }

  // Bloco 0
  registrar("0000", linha([
    "0000", COD_VER_LEIAUTE_A_CONFERIR, "0",
    dataSpedDeYyyyMmDd(dataInicial), dataSpedDeYyyyMmDd(dataFinal),
    config?.razao_social ?? "", (config?.cnpj ?? "").replace(/\D/g, ""), "",
    config?.uf ?? "", config?.inscricao_estadual ?? "", config?.codigo_municipio_ibge ?? "",
    "", "", "C", "1",
  ]), linhas0);
  registrar("0001", linha(["0001", "0"]), linhas0);
  registrar("0005", linha([
    "0005", config?.nome_fantasia ?? "", config?.cep ?? "", config?.logradouro ?? "",
    config?.numero ?? "", "", config?.bairro ?? "", "", "", "",
  ]), linhas0);

  // Produtos vendidos no período (um 0200 por produto distinto), com
  // classificação se já preenchida
  const produtosDoPeriodo = new Map<string, ItemSnapshot>();
  for (const nota of notasValidas) {
    const itens = (Array.isArray(nota.itens_snapshot) ? nota.itens_snapshot : []) as ItemSnapshot[];
    for (const item of itens) {
      if (!produtosDoPeriodo.has(item.product_id)) produtosDoPeriodo.set(item.product_id, item);
    }
  }
  let itemSemClassificacao = false;
  for (const item of produtosDoPeriodo.values()) {
    if (!item.ncm || (!item.cst && !item.csosn) || item.aliquota_icms == null) itemSemClassificacao = true;
    registrar("0200", linha([
      "0200", item.product_id, item.nome, "", "", "UN", "00",
      item.ncm ?? "", "", "", "", numeroSped(item.aliquota_icms ?? null),
    ]), linhas0);
  }
  if (itemSemClassificacao) avisos.push("Algum produto vendido no período está sem NCM/CST-CSOSN/alíquota completos — confira em Fiscal → Classificação fiscal.");

  registrar("0990", linha(["0990", linhas0.length + 1]), linhas0);

  // Bloco C — C800 (NFC-e) + C850 (resumo analítico por CST/CFOP/alíquota)
  registrar("C001", linha(["C001", "0"]), linhasC);

  const regime = config?.regime_tributario ?? "mei";
  const analitico = new Map<string, { cfop: string; aliquota: number; vlOpr: number }>();

  for (const nota of notasValidas) {
    const pedido = Array.isArray(nota.del_orders) ? nota.del_orders[0] : nota.del_orders;
    const codSit = nota.status === "cancelada" ? "02" : "00";
    registrar("C800", linha([
      "C800", "65", codSit, nota.numero ?? "", dataSped(nota.emitida_em),
      (pedido?.cliente_cpf_cnpj ?? "").replace(/\D/g, ""),
      numeroSped(pedido?.totale ?? 0), numeroSped(0), numeroSped(0),
      nota.chave_acesso ?? "", "",
    ]), linhasC);

    if (nota.status === "cancelada") continue;
    const itens = (Array.isArray(nota.itens_snapshot) ? nota.itens_snapshot : []) as ItemSnapshot[];
    for (const item of itens) {
      const cstOuCsosn = regime === "simples_nacional" ? (item.csosn ?? "") : `${item.origem ?? 0}${item.cst ?? ""}`;
      const chave = `${cstOuCsosn}|${item.cfop ?? ""}|${item.aliquota_icms ?? 0}`;
      const atual = analitico.get(chave) ?? { cfop: item.cfop ?? "", aliquota: item.aliquota_icms ?? 0, vlOpr: 0 };
      atual.vlOpr += item.valor_total;
      analitico.set(chave, atual);
    }
  }

  for (const [chave, dados] of analitico) {
    const [cstOuCsosn] = chave.split("|");
    const vlBcIcms = dados.vlOpr;
    const vlIcms = vlBcIcms * (dados.aliquota / 100);
    registrar("C850", linha([
      "C850", cstOuCsosn, dados.cfop, numeroSped(dados.aliquota),
      numeroSped(dados.vlOpr), numeroSped(vlBcIcms), numeroSped(vlIcms),
      numeroSped(0), numeroSped(0), numeroSped(0),
    ]), linhasC);
  }

  registrar("C990", linha(["C990", linhasC.length + 1]), linhasC);

  // Bloco 9 — precisa saber, antes de gerar as linhas 9900, quantos tipos
  // distintos de registro existem no arquivo inteiro (incluindo os do
  // próprio bloco 9), porque a quantidade de linhas 9900 é 1 por tipo.
  const tiposDoArquivo = new Set([...contagemPorTipo.keys(), "9001", "9900", "9990", "9999"]);
  contagemPorTipo.set("9001", 1);
  contagemPorTipo.set("9900", tiposDoArquivo.size);
  contagemPorTipo.set("9990", 1);
  contagemPorTipo.set("9999", 1);

  const linhas9: string[] = [];
  linhas9.push(linha(["9001", "0"]));
  for (const tipo of [...tiposDoArquivo].sort((a, b) => a.localeCompare(b))) {
    linhas9.push(linha(["9900", tipo, contagemPorTipo.get(tipo) ?? 0]));
  }
  linhas9.push(linha(["9990", linhas9.length + 1]));

  const totalLinhas = linhas0.length + linhasC.length + linhas9.length + 1;
  linhas9.push(linha(["9999", totalLinhas]));

  const conteudo = [...linhas0, ...linhasC, ...linhas9].join("\r\n") + "\r\n";

  return {
    conteudo,
    completo: avisos.length === 0,
    avisos,
    totalDocumentos: notasValidas.length,
  };
}

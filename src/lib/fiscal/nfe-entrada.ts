import { XMLParser } from "fast-xml-parser";

type XmlNode = Record<string, unknown>;

export type NfeEntradaItem = {
  numeroItem: number;
  codigoFornecedor: string | null;
  ean: string | null;
  descricao: string;
  ncm: string | null;
  cest: string | null;
  cfop: string | null;
  unidade: string | null;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
};

export type NfeEntrada = {
  chaveAcesso: string;
  numero: string;
  serie: string | null;
  emitidaEm: string | null;
  fornecedorDocumento: string;
  fornecedorNome: string;
  fornecedorFantasia: string | null;
  destinatarioDocumento: string | null;
  valorTotal: number;
  protocoloAutorizacao: string | null;
  itens: NfeEntradaItem[];
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  parseTagValue: false,
  trimValues: true,
});

function node(value: unknown): XmlNode {
  return value && typeof value === "object" ? (value as XmlNode) : {};
}

function text(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

function decimal(value: unknown, field: string): number {
  const parsed = Number(text(value));
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Valor inválido no campo ${field}.`);
  return parsed;
}

export function parseNfeEntrada(xml: string): NfeEntrada {
  let document: XmlNode;
  try {
    document = node(parser.parse(xml));
  } catch {
    throw new Error("O arquivo não contém um XML válido.");
  }

  const process = node(document.nfeProc ?? document);
  const nfe = node(process.NFe ?? document.NFe);
  const inf = node(nfe.infNFe);
  const ide = node(inf.ide);
  const emit = node(inf.emit);
  const dest = node(inf.dest);
  const total = node(node(inf.total).ICMSTot);
  const protocol = node(node(process.protNFe).infProt);

  if (!text(inf["@_Id"])) throw new Error("Este XML não contém uma NF-e.");
  if (text(ide.mod) !== "55") throw new Error("Importe uma NF-e de fornecedor modelo 55, não uma NFC-e.");
  if (text(protocol.cStat) !== "100") throw new Error("A NF-e não consta como autorizada no XML.");

  const chaveAcesso = text(inf["@_Id"]).replace(/^NFe/, "");
  if (!/^\d{44}$/.test(chaveAcesso)) throw new Error("A chave de acesso da NF-e é inválida.");

  const rawItems = Array.isArray(inf.det) ? inf.det : inf.det ? [inf.det] : [];
  if (rawItems.length === 0) throw new Error("A NF-e não possui itens para importar.");

  const itens = rawItems.map((raw, index) => {
    const detail = node(raw);
    const product = node(detail.prod);
    const descricao = text(product.xProd);
    if (!descricao) throw new Error(`O item ${index + 1} não possui descrição.`);
    return {
      numeroItem: Number(text(detail["@_nItem"])) || index + 1,
      codigoFornecedor: text(product.cProd) || null,
      ean: text(product.cEAN) || null,
      descricao,
      ncm: text(product.NCM) || null,
      cest: text(product.CEST) || null,
      cfop: text(product.CFOP) || null,
      unidade: text(product.uCom) || null,
      quantidade: decimal(product.qCom, `quantidade do item ${index + 1}`),
      valorUnitario: decimal(product.vUnCom, `valor unitário do item ${index + 1}`),
      valorTotal: decimal(product.vProd, `valor total do item ${index + 1}`),
    };
  });

  const fornecedorDocumento = text(emit.CNPJ || emit.CPF).replace(/\D/g, "");
  const fornecedorNome = text(emit.xNome);
  if (!fornecedorDocumento || !fornecedorNome) throw new Error("Os dados do fornecedor estão incompletos.");

  return {
    chaveAcesso,
    numero: text(ide.nNF),
    serie: text(ide.serie) || null,
    emitidaEm: text(ide.dhEmi || ide.dEmi) || null,
    fornecedorDocumento,
    fornecedorNome,
    fornecedorFantasia: text(emit.xFant) || null,
    destinatarioDocumento: text(dest.CNPJ || dest.CPF).replace(/\D/g, "") || null,
    valorTotal: decimal(total.vNF, "valor total da NF-e"),
    protocoloAutorizacao: text(protocol.nProt) || null,
    itens,
  };
}

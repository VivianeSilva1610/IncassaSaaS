// Formatação de linha do SPED (EFD-ICMS/IPI): campos separados por "|", com
// "|" também na borda de cada linha, encerrada por CRLF — é assim que o
// Programa Validador e Assinador (PVA) da Receita exige o arquivo.
//
// Referência: Guia Prático da EFD-ICMS/IPI (Ato COTEPE). O leiaute é
// revisado pelo Fisco com alguma frequência — COD_VER (no registro 0000)
// precisa ser conferido contra a versão vigente antes de qualquer
// transmissão real, não só confiado neste código.

export function linha(campos: (string | number | null | undefined)[]): string {
  const valores = campos.map((c) => (c == null ? "" : String(c)));
  return `|${valores.join("|")}|`;
}

export function dataSped(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const dia = String(d.getUTCDate()).padStart(2, "0");
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  const ano = d.getUTCFullYear();
  return `${dia}${mes}${ano}`;
}

export function dataSpedDeYyyyMmDd(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split("-");
  return `${dia}${mes}${ano}`;
}

// Formato numérico do SPED: vírgula decimal, sem separador de milhar.
export function numeroSped(valor: number | null | undefined, casas = 2): string {
  if (valor == null) return "";
  return valor.toFixed(casas).replace(".", ",");
}

export class ContadorRegistros {
  private contagem = new Map<string, number>();
  private linhas: string[] = [];

  add(reg: string, campos: (string | number | null | undefined)[]) {
    const texto = linha([reg, ...campos]);
    this.linhas.push(texto);
    this.contagem.set(reg, (this.contagem.get(reg) ?? 0) + 1);
    return texto;
  }

  todasAsLinhas(): string[] {
    return this.linhas;
  }

  contagemPorRegistro(): [string, number][] {
    return [...this.contagem.entries()].sort(([a], [b]) => a.localeCompare(b));
  }

  totalDeLinhas(): number {
    return this.linhas.length;
  }
}

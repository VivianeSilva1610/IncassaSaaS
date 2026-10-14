import type { DocumentoFiscal } from "../documento";
import type { ProvedorFiscal, ResultadoCancelamento, ResultadoEmissao } from "../provedor";

// Gera números/chaves falsos só pra exercitar o fluxo (emitir → aparecer na
// lista de notas → cancelar) sem depender de SEFAZ nem de provedor
// contratado. A chave de acesso é propositalmente não-numérica
// ("SIMULACAO-...") pra nunca passar por uma chave real de 44 dígitos, mesmo
// fora de contexto. NÃO É um documento fiscal válido.
export class ProvedorSimulado implements ProvedorFiscal {
  readonly id = "simulado";

  async emitir(documento: DocumentoFiscal): Promise<ResultadoEmissao> {
    const sufixo = Math.random().toString(36).slice(2, 10).toUpperCase();
    return {
      status: "autorizado",
      numero: documento.numero,
      serie: documento.serie,
      chaveAcesso: `SIMULACAO-${sufixo}`,
      protocolo: `SIMULACAO-PROTOCOLO-${sufixo}`,
    };
  }

  async cancelar(): Promise<ResultadoCancelamento> {
    return {
      status: "cancelado",
      protocolo: `SIMULACAO-CANCELAMENTO-${Date.now()}`,
      canceladoEm: new Date().toISOString(),
    };
  }
}

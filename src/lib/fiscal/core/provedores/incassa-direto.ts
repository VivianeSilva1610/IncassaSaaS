import type { ProvedorFiscal, ResultadoCancelamento, ResultadoEmissao } from "../provedor";
import type { DocumentoFiscal } from "../documento";
import { validarDocumentoParaTransmissao } from "../validacao";

// A transmissão em homologação foi autorizada, mas continua condicionada a
// CNPJ/IE, certificado ICP-Brasil, assinatura XMLDSig, XSD e endpoint oficial.
// Este provedor não faz rede enquanto essas dependências não forem injetadas.
export class ProvedorIncassaDireto implements ProvedorFiscal {
  readonly id = "incassa_direto";

  async emitir(documento: DocumentoFiscal): Promise<ResultadoEmissao> {
    const validacao = validarDocumentoParaTransmissao(documento);
    if (!validacao.prontoParaTransmissao) {
      return { status: "erro", mensagem: `Documento não está pronto para a SEFAZ: ${validacao.erros.join(" ")}` };
    }
    return {
      status: "erro",
      mensagem: "Documento validado, mas faltam conversão segura do A1/PFX, validação XSD e endpoint oficial de homologação; nenhuma transmissão foi realizada.",
    };
  }

  async cancelar(): Promise<ResultadoCancelamento> {
    return {
      status: "erro",
      mensagem: "Motor INCASSA direto ainda não transmitiu documentos; cancelamento indisponível.",
    };
  }
}

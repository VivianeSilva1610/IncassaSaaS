import type { ProdutoFiscal } from "../documento";
import type { ProvedorFiscal, ResultadoCancelamento, ResultadoEmissao } from "../provedor";

const ONDE_CONFIGURAR: Record<ProdutoFiscal, string> = {
  restaurante: "Restaurante → Fiscal",
  comercio: "Comércio → Fiscal",
};

export class ProvedorNaoConfigurado implements ProvedorFiscal {
  readonly id = "nenhum";
  private readonly produto: ProdutoFiscal;

  constructor(produto: ProdutoFiscal) {
    this.produto = produto;
  }

  async emitir(): Promise<ResultadoEmissao> {
    return {
      status: "erro",
      mensagem: `Nenhum provedor de NFC-e configurado ainda. Preencha CNPJ, Inscrição Estadual e escolha um provedor em ${ONDE_CONFIGURAR[this.produto]} — e contrate o provedor escolhido — antes de emitir.`,
    };
  }

  async cancelar(): Promise<ResultadoCancelamento> {
    return {
      status: "erro",
      mensagem: "Nenhum provedor de NFC-e configurado ainda — não há como cancelar uma nota que não foi emitida por um provedor real.",
    };
  }
}

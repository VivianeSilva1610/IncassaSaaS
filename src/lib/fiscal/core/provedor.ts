// Camada de integração fiscal comum ao Restaurante e ao Comércio. O caminho
// principal será o motor privado do INCASSA, comunicando diretamente com a
// SEFAZ com o certificado dos estabelecimentos da proprietária. A Focus NFe
// continua prevista como alternativa testável, sem ser dependência do motor
// direto. Nenhum provedor real está implementado ainda. Pra adicionar um,
// implementar ProvedorFiscal em core/provedores/ e incluir no switch abaixo;
// o resto do sistema não muda.
import type { DocumentoFiscal, ProdutoFiscal } from "./documento";
import { ProvedorNaoConfigurado } from "./provedores/nao-configurado";
import { ProvedorSimulado } from "./provedores/simulado";
import { ProvedorIncassaDireto } from "./provedores/incassa-direto";

export type ResultadoEmissao = {
  // processando: o provedor aceitou e vai responder depois (NF-e assíncrona).
  status: "autorizado" | "rejeitado" | "processando" | "erro";
  numero?: number;
  serie?: number;
  chaveAcesso?: string;
  protocolo?: string;
  urlDanfe?: string;
  urlXml?: string;
  mensagem?: string;
};

export type PedidoCancelamento = {
  ref: string;
  chaveAcesso: string | null;
  justificativa: string;
};

export type ResultadoCancelamento = {
  status: "cancelado" | "erro";
  protocolo?: string;
  canceladoEm?: string;
  mensagem?: string;
};

export interface ProvedorFiscal {
  readonly id: string;
  emitir(documento: DocumentoFiscal): Promise<ResultadoEmissao>;
  // A SEFAZ só aceita cancelamento numa janela curta após a emissão (NFC-e:
  // 30 min; NF-e: varia por UF). Fora dela o provedor recusa e a correção
  // vira devolução/estorno.
  cancelar(pedido: PedidoCancelamento): Promise<ResultadoCancelamento>;
}

export function getProvedorFiscal(
  provedor: string | null,
  opcoes: { produto: ProdutoFiscal; credencial?: string | null },
): ProvedorFiscal {
  // A credencial vai para o construtor do provedor real quando existir;
  // nenhum dos provedores atuais usa.
  void opcoes.credencial;
  switch (provedor) {
    case "simulado":
      return new ProvedorSimulado();
    case "incassa_direto":
      return new ProvedorIncassaDireto();
    // case "focus_nfe": return new FocusNfeProvider(opcoes.credencial, ...);
    default:
      return new ProvedorNaoConfigurado(opcoes.produto);
  }
}

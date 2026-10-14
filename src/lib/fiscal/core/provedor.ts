// Camada de integração fiscal comum ao Restaurante e ao Comércio. Cada
// cliente contrata o próprio provedor e informa a credencial — o INCASSA não
// revende emissão nem guarda certificado. Nenhum provedor real está
// implementado ainda: a Focus NFe é a primeira prevista (Fase 4 do plano em
// docs/comercio-plano-nfe-provedores.md). Pra adicionar um provedor,
// implementar ProvedorFiscal em core/provedores/ e incluir no switch abaixo;
// o resto do sistema não muda.
import type { DocumentoFiscal, ProdutoFiscal } from "./documento";
import { ProvedorNaoConfigurado } from "./provedores/nao-configurado";
import { ProvedorSimulado } from "./provedores/simulado";

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
    // case "focus_nfe": return new FocusNfeProvider(opcoes.credencial, ...);
    default:
      return new ProvedorNaoConfigurado(opcoes.produto);
  }
}

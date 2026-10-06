// Camada de integração fiscal. Nenhum provedor está contratado ainda (a
// Viviane está como MEI, sem Inscrição Estadual) — então por enquanto só
// existe o stub abaixo, que recusa emitir e explica o que falta. Quando ela
// contratar um provedor (Focus NFe, PlugNotas ou eNotas), implementar a
// classe correspondente aqui e adicionar no switch de getFiscalProvider —
// o resto do sistema (dados do pedido, numeração, histórico de notas) já
// está pronto e não muda.

export type NfceOrderItem = {
  nome: string;
  quantidade: number;
  precoUnitario: number;
  ncm: string | null;
  cfop: string;
  cest: string | null;
  origem: number;
};

export type NfceEmitirInput = {
  fiscalConfig: {
    razaoSocial: string | null;
    cnpj: string | null;
    inscricaoEstadual: string | null;
    crt: number | null;
    ambiente: "homologacao" | "producao";
    logradouro: string | null;
    numero: string | null;
    bairro: string | null;
    municipio: string | null;
    uf: string | null;
    cep: string | null;
  };
  pedido: {
    id: string;
    totale: number;
    clienteNome: string | null;
    clienteCpfCnpj: string | null;
    items: NfceOrderItem[];
  };
  numero: number;
  serie: number;
};

export type NfceEmitirResultado = {
  status: "emitida" | "erro";
  numero?: number;
  serie?: number;
  chaveAcesso?: string;
  protocoloAutorizacao?: string;
  urlDanfe?: string;
  urlXml?: string;
  mensagemErro?: string;
};

export type NfceCancelarInput = {
  chaveAcesso: string;
  justificativa: string;
};

export type NfceCancelarResultado = {
  status: "cancelada" | "erro";
  mensagemErro?: string;
};

export interface FiscalProvider {
  nome: string;
  emitirNFCe(input: NfceEmitirInput): Promise<NfceEmitirResultado>;
  // SEFAZ só aceita cancelamento dentro de uma janela curta após a
  // emissão (varia por estado — confirmar com o provedor). Depois disso
  // o provedor real deve recusar, e a correção vira uma devolução à
  // parte, não um cancelamento.
  cancelarNFCe(input: NfceCancelarInput): Promise<NfceCancelarResultado>;
}

class ProvedorNaoConfigurado implements FiscalProvider {
  nome = "nenhum";

  async emitirNFCe(): Promise<NfceEmitirResultado> {
    return {
      status: "erro",
      mensagemErro:
        "Nenhum provedor de NFC-e configurado ainda. Preencha CNPJ, Inscrição Estadual e escolha um provedor em Restaurante → Fiscal — e contrate o provedor escolhido — antes de emitir.",
    };
  }

  async cancelarNFCe(): Promise<NfceCancelarResultado> {
    return {
      status: "erro",
      mensagemErro: "Nenhum provedor de NFC-e configurado ainda — não há como cancelar uma nota que não foi emitida por um provedor real.",
    };
  }
}

export function getFiscalProvider(provedor: string | null): FiscalProvider {
  switch (provedor) {
    // case "focus_nfe": return new FocusNfeProvider();
    // case "plugnotas": return new PlugNotasProvider();
    // case "enotas": return new ENotasProvider();
    default:
      return new ProvedorNaoConfigurado();
  }
}

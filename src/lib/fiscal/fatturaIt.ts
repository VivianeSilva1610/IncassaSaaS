// Camada de integração fiscal italiana — espelha nfce.ts (Brasil). Nenhum
// provedor de fattura elettronica está contratado ainda, então só existe o
// stub abaixo, que recusa emitir e explica o que falta. Quando um provedor
// for contratado (ex: integração via SdI), implementar a classe
// correspondente aqui e adicionar no switch de getFiscalProviderIt — o
// resto do sistema (fiscal_documents, fiscal_events, numeração) já está
// pronto e não muda.

export type FatturaItEmitirInput = {
  config: {
    ragioneSociale: string | null;
    partitaIva: string | null;
    codiceFiscale: string | null;
    ambiente: "homologacao" | "producao";
  };
  pedido: {
    id: string;
    totale: number;
    clienteNome: string | null;
  };
};

export type FatturaItEmitirResultado = {
  status: "emitido" | "erro";
  protocolloSdi?: string;
  esito?: string;
  mensagemErro?: string;
};

export type FatturaItCancelarResultado = {
  status: "cancelado" | "erro";
  mensagemErro?: string;
};

export interface FiscalProviderIt {
  nome: string;
  emitirDocumento(input: FatturaItEmitirInput): Promise<FatturaItEmitirResultado>;
  cancelarDocumento(): Promise<FatturaItCancelarResultado>;
}

class ProvedorNaoConfiguradoIt implements FiscalProviderIt {
  nome = "nenhum";

  async emitirDocumento(): Promise<FatturaItEmitirResultado> {
    return {
      status: "erro",
      mensagemErro:
        "Nenhum provedor de fattura elettronica configurado ainda. Preencha Ragione Sociale, Partita IVA e Codice Fiscale e escolha um provedor em Restaurante → Fiscal — e contrate o provedor escolhido — antes de emitir.",
    };
  }

  async cancelarDocumento(): Promise<FatturaItCancelarResultado> {
    return {
      status: "erro",
      mensagemErro: "Nenhum provedor configurado — não há como anular um documento que não foi emitido por um provedor real.",
    };
  }
}

// Gera um protocollo SdI falso só pra exercitar o fluxo (Fiscal → emitir →
// aparecer na lista → anular) sem depender de um provedor contratado. O
// prefixo "SIMULAZIONE-" é proposital pra nunca passar por um protocollo
// real. NÃO É um documento fiscal válido.
class ProvedorSimuladoIt implements FiscalProviderIt {
  nome = "simulado";

  async emitirDocumento(): Promise<FatturaItEmitirResultado> {
    const sufixo = Math.random().toString(36).slice(2, 10).toUpperCase();
    return {
      status: "emitido",
      protocolloSdi: `SIMULAZIONE-${sufixo}`,
      esito: "simulato",
    };
  }

  async cancelarDocumento(): Promise<FatturaItCancelarResultado> {
    return { status: "cancelado" };
  }
}

// apiKey é a credencial que o próprio restaurante colou em Fiscal →
// Estabelecimento (restaurant_fiscal_it.provedor_api_key) — mesma lógica
// de nfce.ts (Brasil): preparada pra quando uma classe real existir.
export function getFiscalProviderIt(provedor: string | null, apiKey?: string | null): FiscalProviderIt {
  void apiKey;
  switch (provedor) {
    case "simulado":
      return new ProvedorSimuladoIt();
    default:
      return new ProvedorNaoConfiguradoIt();
  }
}

// Camada de integração fiscal italiana. Nenhum provedor/intermediário SdI
// está contratado ainda — por enquanto só existe o stub abaixo, que recusa
// emitir e explica o que falta. Quando um provedor for contratado e
// homologado com o commercialista, implementar a classe correspondente
// aqui e adicionar no switch de getFatturaProvider() — o resto do sistema
// (fiscal_documents, fiscal_documents_it, fiscal_events) já está pronto.

export type FatturaOrderItem = {
  nome: string;
  quantidade: number;
  precoUnitario: number;
};

export type FatturaEmettiInput = {
  fiscalConfig: {
    ragioneSociale: string | null;
    partitaIva: string | null;
    codiceFiscale: string | null;
    regimeFiscale: string | null;
    pec: string | null;
    codiceDestinatario: string | null;
    ambiente: "homologacao" | "producao";
  };
  ordine: {
    id: string;
    totale: number;
    clienteNome: string | null;
    clientePartitaIvaOCodiceFiscale: string | null;
    items: FatturaOrderItem[];
  };
};

export type FatturaEmettiResultado = {
  status: "emitido" | "erro";
  protocolloSdi?: string;
  ricevutaConsegna?: string;
  mensagemErro?: string;
};

export type FatturaAnnullaInput = {
  protocolloSdi: string;
  motivo: string;
};

export type FatturaAnnullaResultado = {
  status: "cancelado" | "erro";
  mensagemErro?: string;
};

export interface FatturaProvider {
  nome: string;
  emettiFattura(input: FatturaEmettiInput): Promise<FatturaEmettiResultado>;
  // Una fattura già trasmessa allo SdI non si "cancella": l'unico
  // strumento è una nota di credito separata. Questo método existe só
  // pra manter o mesmo formato de interface do lado brasileiro — um
  // provedor real deve recusar e orientar a emitir uma nota de credito.
  annullaFattura(input: FatturaAnnullaInput): Promise<FatturaAnnullaResultado>;
}

class ProvedorNaoConfigurado implements FatturaProvider {
  nome = "nenhum";

  async emettiFattura(): Promise<FatturaEmettiResultado> {
    return {
      status: "erro",
      mensagemErro:
        "Nenhum provedor de fattura elettronica configurado ainda. Preencha Partita IVA, Codice Fiscale e escolha um provedor em Restaurante → Fiscal — e contrate/homologue o provedor escolhido — antes de emitir.",
    };
  }

  async annullaFattura(): Promise<FatturaAnnullaResultado> {
    return {
      status: "erro",
      mensagemErro: "Nenhum provedor configurado ainda — não há como anular uma fattura que não foi emitida por um provedor real.",
    };
  }
}

// Gera protocolos falsos só pra exercitar o fluxo sem depender do SdI nem
// de um provedor contratado. O protocolo é propositalmente não-numérico
// ("SIMULAZIONE-...") pra nunca passar por um protocolo real. NÃO É um
// documento fiscal válido.
class ProvedorSimulado implements FatturaProvider {
  nome = "simulado";

  async emettiFattura(): Promise<FatturaEmettiResultado> {
    const sufixo = Math.random().toString(36).slice(2, 10).toUpperCase();
    return {
      status: "emitido",
      protocolloSdi: `SIMULAZIONE-${sufixo}`,
      ricevutaConsegna: `SIMULAZIONE-RICEVUTA-${sufixo}`,
    };
  }

  async annullaFattura(): Promise<FatturaAnnullaResultado> {
    return { status: "cancelado" };
  }
}

export function getFatturaProvider(provedor: string | null): FatturaProvider {
  switch (provedor) {
    case "simulado":
      return new ProvedorSimulado();
    default:
      return new ProvedorNaoConfigurado();
  }
}

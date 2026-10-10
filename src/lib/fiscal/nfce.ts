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
  protocoloCancelamento?: string;
  canceladaEm?: string;
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

// Gera números/chaves falsos só pra exercitar o fluxo (Vendas → emitir →
// aparecer na aba Fiscal → cancelar) sem depender de SEFAZ nem de um
// provedor contratado. A chave de acesso é propositalmente não-numérica
// ("SIMULACAO-...") pra nunca passar por uma chave real de 44 dígitos,
// mesmo fora de contexto. NÃO É um documento fiscal válido.
class ProvedorSimulado implements FiscalProvider {
  nome = "simulado";

  async emitirNFCe(input: NfceEmitirInput): Promise<NfceEmitirResultado> {
    const sufixo = Math.random().toString(36).slice(2, 10).toUpperCase();
    return {
      status: "emitida",
      numero: input.numero,
      serie: input.serie,
      chaveAcesso: `SIMULACAO-${sufixo}`,
      protocoloAutorizacao: `SIMULACAO-PROTOCOLO-${sufixo}`,
    };
  }

  async cancelarNFCe(): Promise<NfceCancelarResultado> {
    return {
      status: "cancelada",
      protocoloCancelamento: `SIMULACAO-CANCELAMENTO-${Date.now()}`,
      canceladaEm: new Date().toISOString(),
    };
  }
}

// apiKey é a credencial que o próprio restaurante colou em Fiscal →
// Estabelecimento (del_fiscal_config.provedor_api_key) — passada aqui pra
// quando as classes reais existirem, não precisar mudar a assinatura de
// novo. As classes reais ainda não existem (ver comentário no topo do
// arquivo), então por enquanto ela não é usada por nenhum provedor.
export function getFiscalProvider(provedor: string | null, apiKey?: string | null): FiscalProvider {
  void apiKey;
  switch (provedor) {
    case "simulado":
      return new ProvedorSimulado();
    // case "focus_nfe": return new FocusNfeProvider(apiKey);
    // case "plugnotas": return new PlugNotasProvider(apiKey);
    // case "enotas": return new ENotasProvider(apiKey);
    default:
      return new ProvedorNaoConfigurado();
  }
}

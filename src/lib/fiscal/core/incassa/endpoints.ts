export type ServicoNfe = "autorizacao" | "retornoAutorizacao";

type EndpointsUf = Record<ServicoNfe, string>;

// Conferidos no Portal Nacional da NF-e em 14/10/2026. A lista é
// intencionalmente fechada: UF sem URL revisada não recebe fallback genérico.
const ENDPOINTS_HOMOLOGACAO: Partial<Record<string, EndpointsUf>> = {
  MG: {
    autorizacao: "https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeAutorizacao4",
    retornoAutorizacao: "https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeRetAutorizacao4",
  },
  SP: {
    autorizacao: "https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx",
    retornoAutorizacao: "https://homologacao.nfe.fazenda.sp.gov.br/ws/nferetautorizacao4.asmx",
  },
};

const CODIGOS_UF: Partial<Record<string, string>> = { MG: "31", SP: "35" };

export function obterCodigoUfRevisado(uf: string): string {
  const sigla = uf.trim().toUpperCase();
  const codigo = CODIGOS_UF[sigla];
  if (!codigo) throw new Error(`Código e endpoint ainda não revisados para a UF ${sigla || "não informada"}.`);
  return codigo;
}

export function obterEndpointHomologacao(uf: string, servico: ServicoNfe): URL {
  const sigla = uf.trim().toUpperCase();
  const valor = ENDPOINTS_HOMOLOGACAO[sigla]?.[servico];
  if (!valor) throw new Error(`Endpoint de homologação ainda não revisado para a UF ${sigla || "não informada"}.`);
  return new URL(valor);
}

export function hostsFiscaisHomologacaoPermitidos(): ReadonlySet<string> {
  return new Set(Object.values(ENDPOINTS_HOMOLOGACAO).flatMap((item) => item ? Object.values(item).map((valor) => new URL(valor).hostname) : []));
}

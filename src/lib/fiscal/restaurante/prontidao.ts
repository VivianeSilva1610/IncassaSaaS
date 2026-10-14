export type ConfigFiscalPranzo = {
  cnpj?: string | null;
  inscricao_estadual?: string | null;
  razao_social?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  codigo_municipio_ibge?: string | null;
  uf?: string | null;
  cep?: string | null;
  crt?: number | null;
  provedor?: string | null;
};

const CAMPOS: ReadonlyArray<[keyof ConfigFiscalPranzo, string]> = [
  ["cnpj", "CNPJ"],
  ["inscricao_estadual", "Inscrição Estadual"],
  ["razao_social", "Razão social"],
  ["logradouro", "Logradouro"],
  ["numero", "Número"],
  ["bairro", "Bairro"],
  ["municipio", "Município"],
  ["codigo_municipio_ibge", "Código IBGE do município"],
  ["uf", "UF"],
  ["cep", "CEP"],
  ["crt", "CRT validado"],
];

export function pendenciasParaHomologacaoPranzo(config: ConfigFiscalPranzo | null): string[] {
  const pendencias = CAMPOS
    .filter(([campo]) => config?.[campo] === null || config?.[campo] === undefined || config?.[campo] === "")
    .map(([, rotulo]) => rotulo);
  if (!config?.provedor || config.provedor === "simulado") pendencias.push("Motor fiscal direto selecionado");
  return pendencias;
}


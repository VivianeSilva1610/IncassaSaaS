// Lista oficial dos provedores de emissão fiscal (NFC-e/NF-e) do INCASSA
// (Restaurante e Comércio) — fonte única do que é dito ao cliente nas telas
// Fiscal e na página de vendas. O cliente contrata o provedor por conta própria
// (docs/comercio-plano-nfe-provedores.md), então nunca anunciar aqui um
// provedor como "disponível" antes da integração estar testada em
// homologação e liberada.

export type StatusProvedor = "disponivel" | "em_integracao";

export type ProvedorFiscal = {
  id: string;
  nome: string;
  site: string;
  status: StatusProvedor;
  documentos: readonly ("NFC-e" | "NF-e")[];
};

export const PROVEDORES_FISCAIS: readonly ProvedorFiscal[] = [
  { id: "focus_nfe", nome: "Focus NFe", site: "https://focusnfe.com.br", status: "em_integracao", documentos: ["NFC-e", "NF-e"] },
];

export const STATUS_PROVEDOR_LABEL: Record<StatusProvedor, string> = {
  disponivel: "Disponível",
  em_integracao: "Integração em desenvolvimento — ainda não emite",
};

// Texto usado nas telas Fiscal do Restaurante e do Comércio.
export const AVISO_PROVEDORES =
  "Hoje o INCASSA ainda não transmite documentos fiscais. O primeiro provedor suportado será a Focus NFe; outros provedores (PlugNotas, eNotas etc.) não são suportados no momento. Não contrate um provedor só para usar com o INCASSA antes de anunciarmos a liberação da integração.";

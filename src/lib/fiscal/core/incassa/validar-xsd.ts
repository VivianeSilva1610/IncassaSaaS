import "server-only";

import { readFile } from "node:fs/promises";
import { validateXML } from "xmllint-wasm";

const DIRETORIO_SCHEMA = new URL("../../schemas/PL_010f_v1.04/", import.meta.url);
const ARQUIVOS = [
  "nfe_v4.00.xsd",
  "leiauteNFe_v4.00.xsd",
  "tiposBasico_v4.00.xsd",
  "DFeTiposBasicos_v1.00.xsd",
  "xmldsig-core-schema_v1.01.xsd",
] as const;

export type ResultadoValidacaoXsd = {
  valido: boolean;
  erros: string[];
  pacote: "PL_010f_v1.04";
};

function sanitizarErro(mensagem: string): string {
  return mensagem.replace(/\b\d{11,44}\b/g, "[identificador omitido]").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, 500);
}

export async function validarXmlNfeNoXsd(xml: string): Promise<ResultadoValidacaoXsd> {
  if (!xml.trim() || Buffer.byteLength(xml, "utf8") > 2_000_000) {
    return { valido: false, erros: ["XML vazio ou acima do limite permitido."], pacote: "PL_010f_v1.04" };
  }
  const conteudos = await Promise.all(ARQUIVOS.map(async (nome) => ({ fileName: nome, contents: await readFile(new URL(nome, DIRETORIO_SCHEMA), "utf8") })));
  const [principal, ...dependencias] = conteudos;
  const resultado = await validateXML({
    xml: { fileName: "documento-nfe.xml", contents: xml },
    schema: principal,
    preload: dependencias,
    initialMemoryPages: 256,
    maxMemoryPages: 512,
  });
  return {
    valido: resultado.valid,
    erros: resultado.errors.slice(0, 20).map((erro) => sanitizarErro(erro.message)),
    pacote: "PL_010f_v1.04",
  };
}


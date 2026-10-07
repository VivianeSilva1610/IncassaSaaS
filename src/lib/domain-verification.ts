import { resolveTxt } from "node:dns/promises";

// Prova de propriedade do domínio, independente do CNAME que de fato
// roteia o tráfego: o dono cria um registro TXT em
// _incassa-challenge.<hostname> com o token que a gente gerou. Só depois
// disso o domínio passa a ser aceito pelo proxy (src/proxy.ts) — nunca
// confiamos no cabeçalho Host sozinho.
export async function verificarRegistroTxt(hostname: string, token: string): Promise<boolean> {
  try {
    const registros = await resolveTxt(`_incassa-challenge.${hostname}`);
    return registros.some((partes) => partes.join("").trim() === token);
  } catch {
    return false;
  }
}

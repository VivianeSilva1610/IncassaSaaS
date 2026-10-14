import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { AmbienteFiscal, ProdutoFiscal } from "./documento";

export type TipoCredencialFiscal = "certificado_a1" | "senha_certificado" | "csc" | "token_api";

export type ContextoCredencialFiscal = {
  produto: ProdutoFiscal;
  ownerId: string;
  ambiente: AmbienteFiscal;
  provedor: "incassa_direto" | "focus_nfe";
  tipo: TipoCredencialFiscal;
  versaoChave?: number;
};

export type CredencialFiscalCifrada = {
  cifra: string;
  iv: string;
  authTag: string;
  versaoChave: number;
  ultimos4: string;
};

function chaveMestra(): Buffer {
  const valor = process.env.FISCAL_CREDENTIALS_KEY;
  if (!valor) throw new Error("FISCAL_CREDENTIALS_KEY não configurada.");
  const chave = Buffer.from(valor, "base64");
  if (chave.length !== 32) throw new Error("FISCAL_CREDENTIALS_KEY deve conter exatamente 32 bytes em base64.");
  return chave;
}

function aad(contexto: ContextoCredencialFiscal, versao: number): Buffer {
  return Buffer.from([
    "incassa-fiscal-v1",
    contexto.produto,
    contexto.ownerId,
    contexto.ambiente,
    contexto.provedor,
    contexto.tipo,
    String(versao),
  ].join(":"), "utf8");
}

export function cifrarCredencialFiscal(
  segredo: string | Buffer,
  contexto: ContextoCredencialFiscal,
): CredencialFiscalCifrada {
  const conteudo = Buffer.isBuffer(segredo) ? Buffer.from(segredo) : Buffer.from(segredo, "utf8");
  if (conteudo.length === 0) throw new Error("A credencial fiscal não pode estar vazia.");
  const versaoChave = contexto.versaoChave ?? 1;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", chaveMestra(), iv);
  cipher.setAAD(aad(contexto, versaoChave));
  const cifra = Buffer.concat([cipher.update(conteudo), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const ultimos4 = createHash("sha256").update(conteudo).digest("hex").slice(-4).toUpperCase();
  conteudo.fill(0);
  return {
    cifra: cifra.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    versaoChave,
    ultimos4,
  };
}

export function decifrarCredencialFiscal(
  credencial: Pick<CredencialFiscalCifrada, "cifra" | "iv" | "authTag" | "versaoChave">,
  contexto: ContextoCredencialFiscal,
): Buffer {
  const decipher = createDecipheriv("aes-256-gcm", chaveMestra(), Buffer.from(credencial.iv, "base64"));
  decipher.setAAD(aad(contexto, credencial.versaoChave));
  decipher.setAuthTag(Buffer.from(credencial.authTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(credencial.cifra, "base64")),
    decipher.final(),
  ]);
}

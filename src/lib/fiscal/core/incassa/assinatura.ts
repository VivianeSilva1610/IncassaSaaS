import { createPrivateKey, createPublicKey, type KeyLike } from "node:crypto";
import { SignedXml } from "xml-crypto";

const C14N = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315";
const ENVELOPED = "http://www.w3.org/2000/09/xmldsig#enveloped-signature";
const RSA_SHA1 = "http://www.w3.org/2000/09/xmldsig#rsa-sha1";
const SHA1 = "http://www.w3.org/2000/09/xmldsig#sha1";

export type AssinadorXmlNfe = {
  /** Devolve XMLDSig envelopada, referenciando o Id da infNFe. */
  assinar(xmlNaoAssinado: string, referenciaId: `NFe${string}`): Promise<string>;
};

export type MaterialAssinaturaPem = {
  chavePrivadaPem: string | Buffer;
  certificadoPem: string | Buffer;
};

function textoPem(valor: string | Buffer): string {
  return Buffer.isBuffer(valor) ? valor.toString("utf8") : valor;
}

function validarMaterial(material: MaterialAssinaturaPem): { chavePrivada: KeyLike; certificado: string } {
  const certificado = textoPem(material.certificadoPem).trim();
  if (!/^-----BEGIN CERTIFICATE-----[\s\S]+-----END CERTIFICATE-----$/.test(certificado)) {
    throw new Error("Certificado PEM X.509 inválido ou contendo cadeia adicional.");
  }
  try {
    const chavePrivada = createPrivateKey(material.chavePrivadaPem);
    createPublicKey(certificado);
    return { chavePrivada, certificado };
  } catch {
    throw new Error("Não foi possível carregar a chave privada ou o certificado X.509.");
  }
}

function contar(texto: string, trecho: string): number {
  return texto.split(trecho).length - 1;
}

/** Assina somente a infNFe indicada, conforme o perfil XMLDSig do MOC. */
export function assinarXmlNfeComPem(
  xmlNaoAssinado: string,
  referenciaId: `NFe${string}`,
  material: MaterialAssinaturaPem,
): string {
  if (contar(xmlNaoAssinado, `Id="${referenciaId}"`) !== 1) {
    throw new Error("A referência da infNFe deve existir exatamente uma vez.");
  }
  if (xmlNaoAssinado.includes("<Signature")) throw new Error("O XML já contém uma assinatura.");
  const { chavePrivada, certificado } = validarMaterial(material);
  const assinatura = new SignedXml({
    privateKey: chavePrivada,
    publicCert: certificado,
    canonicalizationAlgorithm: C14N,
    signatureAlgorithm: RSA_SHA1,
  });
  assinatura.addReference({
    xpath: `//*[local-name(.)='infNFe' and @Id='${referenciaId}']`,
    uri: referenciaId,
    transforms: [ENVELOPED, C14N],
    digestAlgorithm: SHA1,
  });
  assinatura.computeSignature(xmlNaoAssinado, {
    location: { reference: "//*[local-name(.)='infNFe']", action: "after" },
  });
  const xmlAssinado = assinatura.getSignedXml();
  exigirXmlAssinado(xmlAssinado, referenciaId);
  if (!verificarAssinaturaXmlNfe(xmlAssinado, certificado)) throw new Error("A chave privada não corresponde ao certificado informado.");
  return xmlAssinado;
}

export function verificarAssinaturaXmlNfe(xmlAssinado: string, certificadoPem: string | Buffer): boolean {
  const assinaturas = xmlAssinado.match(/<Signature\b[\s\S]*?<\/Signature>/g);
  if (assinaturas?.length !== 1) return false;
  try {
    const certificado = textoPem(certificadoPem);
    createPublicKey(certificado);
    const verificador = new SignedXml({ publicCert: certificado, getCertFromKeyInfo: () => null });
    verificador.loadSignature(assinaturas[0]);
    return verificador.checkSignature(xmlAssinado) && verificador.getSignedReferences().length === 1;
  } catch {
    return false;
  }
}

export function exigirXmlAssinado(xml: string, referenciaId: `NFe${string}`): void {
  if (!xml.includes(`<Reference URI="#${referenciaId}">`) || !xml.includes("<Signature")) {
    throw new Error("XML não contém assinatura XMLDSig vinculada à infNFe.");
  }
}

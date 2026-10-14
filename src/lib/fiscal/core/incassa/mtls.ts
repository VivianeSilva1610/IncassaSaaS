import { request as httpsRequest, type RequestOptions } from "node:https";

export type MaterialMtls = {
  certificadoPem: string | Buffer;
  chavePrivadaPem: string | Buffer;
};

type RespostaMtls = { status: number; corpo: string };
export type ExecutorMtls = (opcoes: RequestOptions, corpo: string, limiteBytes: number) => Promise<RespostaMtls>;

const executorPadrao: ExecutorMtls = (opcoes, corpo, limiteBytes) => new Promise((resolve, reject) => {
  const requisicao = httpsRequest(opcoes, (resposta) => {
    const partes: Buffer[] = [];
    let total = 0;
    resposta.on("data", (parte: Buffer) => {
      total += parte.length;
      if (total > limiteBytes) {
        requisicao.destroy(new Error("Resposta da SEFAZ acima do limite permitido."));
        return;
      }
      partes.push(parte);
    });
    resposta.on("end", () => resolve({ status: resposta.statusCode ?? 0, corpo: Buffer.concat(partes).toString("utf8") }));
  });
  requisicao.on("error", reject);
  requisicao.end(corpo);
});

export async function transmitirSoapHomologacaoMtls(params: {
  endpoint: URL;
  soapAction: string;
  envelope: string;
  hostsPermitidos: ReadonlySet<string>;
  material: MaterialMtls;
  timeoutMs?: number;
  executor?: ExecutorMtls;
}): Promise<string> {
  if (params.endpoint.protocol !== "https:") throw new Error("Endpoint fiscal mTLS deve usar HTTPS.");
  if (!params.hostsPermitidos.has(params.endpoint.hostname)) throw new Error("Endpoint fiscal mTLS fora da lista oficial permitida.");
  if (!params.envelope.includes("<soap:Envelope")) throw new Error("Envelope SOAP 1.2 inválido.");
  const timeoutMs = params.timeoutMs ?? 30_000;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 60_000) throw new Error("Timeout fiscal fora do intervalo permitido.");
  const resposta = await (params.executor ?? executorPadrao)({
    protocol: "https:",
    hostname: params.endpoint.hostname,
    port: params.endpoint.port || 443,
    path: `${params.endpoint.pathname}${params.endpoint.search}`,
    method: "POST",
    cert: params.material.certificadoPem,
    key: params.material.chavePrivadaPem,
    rejectUnauthorized: true,
    minVersion: "TLSv1.2",
    timeout: timeoutMs,
    headers: {
      "content-type": `application/soap+xml; charset=utf-8; action="${params.soapAction}"`,
      "content-length": Buffer.byteLength(params.envelope, "utf8"),
      accept: "application/soap+xml, text/xml",
    },
  }, params.envelope, 2_000_000);
  if (resposta.status < 200 || resposta.status >= 300) throw new Error(`SEFAZ homologação respondeu HTTP ${resposta.status}.`);
  return resposta.corpo;
}

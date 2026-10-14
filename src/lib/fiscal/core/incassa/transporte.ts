export type RequisicaoSoapHomologacao = {
  endpoint: URL;
  soapAction: string;
  envelope: string;
  hostsPermitidos: ReadonlySet<string>;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export async function transmitirSoapHomologacao(requisicao: RequisicaoSoapHomologacao): Promise<string> {
  if (requisicao.endpoint.protocol !== "https:") throw new Error("Endpoint fiscal deve usar HTTPS.");
  if (!requisicao.hostsPermitidos.has(requisicao.endpoint.hostname)) throw new Error("Endpoint fiscal fora da lista oficial permitida.");
  if (!requisicao.envelope.includes("<soap")) throw new Error("Envelope SOAP inválido.");
  const timeoutMs = requisicao.timeoutMs ?? 30_000;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 60_000) throw new Error("Timeout fiscal fora do intervalo permitido.");
  const resposta = await (requisicao.fetchImpl ?? fetch)(requisicao.endpoint, {
    method: "POST",
    headers: { "content-type": `application/soap+xml; charset=utf-8; action="${requisicao.soapAction}"` },
    body: requisicao.envelope,
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  const corpo = await resposta.text();
  if (!resposta.ok) throw new Error(`SEFAZ homologação respondeu HTTP ${resposta.status}.`);
  if (corpo.length > 2_000_000) throw new Error("Resposta da SEFAZ acima do limite permitido.");
  return corpo;
}

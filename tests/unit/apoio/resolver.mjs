import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = new URL("../../../src/", import.meta.url);

function arquivo(href) {
  for (const sufixo of ["", ".ts", ".tsx", "/index.ts"]) {
    const url = new URL(href + sufixo);
    try {
      if (statSync(fileURLToPath(url)).isFile()) return url.href;
    } catch {
      // não existe com este sufixo; tenta o próximo
    }
  }
  return null;
}

export async function resolve(especificador, contexto, proximo) {
  // `server-only` é uma sentinela do Next, sem implementação Node. Nos testes
  // puros ela vira um módulo vazio; a proteção real continua no build Next.
  if (especificador === "server-only") {
    return { url: "data:text/javascript,export%20default%20undefined", shortCircuit: true };
  }
  if (especificador.startsWith("@/")) {
    const achado = arquivo(new URL(especificador.slice(2), SRC).href);
    if (achado) return { url: achado, shortCircuit: true };
  }
  if ((especificador.startsWith("./") || especificador.startsWith("../")) && contexto.parentURL?.startsWith("file:")) {
    const achado = arquivo(new URL(especificador, contexto.parentURL).href);
    if (achado) return { url: achado, shortCircuit: true };
  }
  return proximo(especificador, contexto);
}

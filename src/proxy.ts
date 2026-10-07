import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// FASE 3 — domínios personalizados. Hosts que são sempre a própria
// plataforma, nunca um domínio de restaurante — checar isso primeiro evita
// consulta ao banco na esmagadora maioria das requisições (todo o tráfego
// de hoje, já que nenhum domínio próprio existe ainda).
const PLATFORM_HOSTS = new Set(["incassa.eu", "www.incassa.eu", "localhost:3000", "localhost"]);

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0].toLowerCase();
  const ehHostDaPlataforma = PLATFORM_HOSTS.has(hostname) || hostname.endsWith(".vercel.app");

  // Resolve o restaurante pelo Host só quando NÃO é um host conhecido da
  // plataforma. Nunca confia no Host sozinho: só reescreve quando o
  // domínio está marcado como verificado no nosso banco — um host
  // desconhecido ou pendente de verificação segue o roteamento normal.
  if (!ehHostDaPlataforma) {
    const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
      auth: { persistSession: false },
    });

    const { data: dominio } = await admin
      .from("restaurant_domains")
      .select("restaurant_id")
      .eq("hostname", hostname)
      .eq("verification_status", "verified")
      .maybeSingle();

    if (dominio) {
      const { data: restaurante } = await admin
        .from("restaurants")
        .select("slug")
        .eq("id", dominio.restaurant_id)
        .eq("status", "active")
        .maybeSingle();

      if (restaurante) {
        // Todo caminho num domínio próprio cai na loja do restaurante —
        // não existe (ainda) uma versão por-restaurante de cada rota
        // interna da plataforma (ex: pedido-confirmado), então manter
        // simples: sempre a vitrine, independente do caminho pedido.
        const url = request.nextUrl.clone();
        url.pathname = `/loja/${restaurante.slug}`;
        return NextResponse.rewrite(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  // O produto INCASSA (/app/*) foi desativado — a única coisa que este
  // proxy ainda faz é resolver domínio personalizado pelo Host. A sessão
  // de cada página do restaurante é lida direto no Server Component via
  // requireRestaurantSubscription(), não precisa de refresh aqui.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|manifest.webmanifest).*)"],
};

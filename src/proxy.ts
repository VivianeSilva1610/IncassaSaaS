import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
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

  if (!request.nextUrl.pathname.startsWith("/app")) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/app")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  // Antes só cobria /app/:path* (sessão/redirect). Agora cobre
  // praticamente toda página, pra poder resolver domínio pelo Host — mas
  // a lógica de sessão continua só rodando de fato pra /app/*, igual
  // antes (ver o "if (!pathname.startsWith('/app')) return next()" acima).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|manifest.webmanifest).*)"],
};

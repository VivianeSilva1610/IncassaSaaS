import { NextResponse } from "next/server";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { gerarEfdIcmsIpi } from "@/lib/fiscal/sped/gerarEfdIcmsIpi";

export async function GET(req: Request) {
  const { supabase, restaurantOwnerId, isOwner } = await requireRestaurantSubscription();
  if (!isOwner) return NextResponse.json({ error: "Apenas o dono pode exportar o SPED." }, { status: 403 });

  const { data: restaurant } = await supabase.from("restaurants").select("country_code").eq("owner_user_id", restaurantOwnerId).maybeSingle();
  if (restaurant?.country_code === "IT") {
    return NextResponse.json({ error: "SPED é uma obrigação fiscal brasileira — não se aplica a este restaurante." }, { status: 400 });
  }

  const url = new URL(req.url);
  const de = url.searchParams.get("de");
  const ate = url.searchParams.get("ate");
  if (!de || !ate || !/^\d{4}-\d{2}-\d{2}$/.test(de) || !/^\d{4}-\d{2}-\d{2}$/.test(ate)) {
    return NextResponse.json({ error: "Informe as datas inicial e final do período." }, { status: 400 });
  }

  const resultado = await gerarEfdIcmsIpi(supabase, restaurantOwnerId, de, ate);

  const nome = `sped-efd-icms-ipi-${de}-a-${ate}${resultado.completo ? "" : "-RASCUNHO-INCOMPLETO"}.txt`;
  return new NextResponse(resultado.conteudo, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nome}"`,
      "X-Sped-Completo": String(resultado.completo),
      "X-Sped-Avisos": encodeURIComponent(resultado.avisos.join(" | ")),
      "X-Sped-Documentos": String(resultado.totalDocumentos),
    },
  });
}

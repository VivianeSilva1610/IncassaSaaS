import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug")?.trim().toLowerCase() ?? "";
  if (!/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/.test(slug)) {
    return NextResponse.json({ disponivel: false, motivo: "Use só letras minúsculas, números e hífen." });
  }

  const admin = getSupabaseAdmin();
  const { data } = await admin.from("restaurants").select("id").eq("slug", slug).maybeSingle();

  return NextResponse.json({ disponivel: !data });
}

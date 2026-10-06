import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  const orderId = new URL(req.url).searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId obrigatório." }, { status: 400 });
  }

  const { data: order } = await getSupabaseAdmin().from("del_orders").select("status").eq("id", orderId).maybeSingle();
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ status: order.status });
}

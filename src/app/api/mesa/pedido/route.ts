import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { deduzirEstoquePorVenda } from "@/lib/delivery/stock";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const qrToken = String(body.qrToken ?? "");
  const itemsRaw: { productId?: string; quantidade?: number }[] = Array.isArray(body.items) ? body.items : [];
  const observacao = String(body.observacao ?? "") || null;

  if (!qrToken || itemsRaw.length === 0) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: mesa } = await admin.from("del_mesas").select("id, owner_id").eq("qr_token", qrToken).maybeSingle();
  if (!mesa) {
    return NextResponse.json({ error: "Mesa não encontrada." }, { status: 404 });
  }

  // Nunca confiar em preço enviado pelo cliente — busca o preço real de cada
  // produto, já filtrado pelo dono da mesa, pra ninguém mandar item de fora.
  const productIds = itemsRaw.map((i) => i.productId).filter(Boolean) as string[];
  const { data: produtos } = await admin
    .from("del_products")
    .select("id, preco")
    .eq("owner_id", mesa.owner_id)
    .eq("ativo", true)
    .in("id", productIds);

  const precoPorId = new Map((produtos ?? []).map((p) => [p.id, Number(p.preco)]));
  const items = itemsRaw
    .filter((i) => i.productId && precoPorId.has(i.productId) && Number(i.quantidade) > 0)
    .map((i) => ({ productId: i.productId as string, quantidade: Number(i.quantidade), precoUnitario: precoPorId.get(i.productId as string)! }));

  if (items.length === 0) {
    return NextResponse.json({ error: "Nenhum item válido no pedido." }, { status: 400 });
  }

  let { data: comanda } = await admin
    .from("del_comandas")
    .select("id")
    .eq("mesa_id", mesa.id)
    .eq("status", "aberta")
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (!comanda) {
    const { data: novaComanda, error: comandaError } = await admin
      .from("del_comandas")
      .insert({ owner_id: mesa.owner_id, mesa_id: mesa.id })
      .select("id")
      .single();
    if (comandaError || !novaComanda) {
      return NextResponse.json({ error: "Não foi possível abrir a comanda." }, { status: 500 });
    }
    comanda = novaComanda;
  }

  const totale = items.reduce((sum, item) => sum + item.quantidade * item.precoUnitario, 0);

  const { data: order, error: orderError } = await admin
    .from("del_orders")
    .insert({
      owner_id: mesa.owner_id,
      mesa_id: mesa.id,
      comanda_id: comanda.id,
      canal: "mesa",
      status: "novo",
      note: observacao,
      totale,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Não foi possível registrar o pedido." }, { status: 500 });
  }

  const { error: itemsError } = await admin.from("del_order_items").insert(
    items.map((item) => ({
      owner_id: mesa.owner_id,
      order_id: order.id,
      product_id: item.productId,
      quantidade: item.quantidade,
      preco_unitario: item.precoUnitario,
    })),
  );

  if (itemsError) {
    return NextResponse.json({ error: "Não foi possível salvar os itens do pedido." }, { status: 500 });
  }

  await deduzirEstoquePorVenda(admin, {
    ownerId: mesa.owner_id,
    orderId: order.id,
    items: items.map((item) => ({ productId: item.productId, quantidade: item.quantidade })),
  });

  return NextResponse.json({ ok: true, orderId: order.id });
}

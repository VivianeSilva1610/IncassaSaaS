import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

const OWNER_EMAIL = "viroedu@gmail.com";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const itemsRaw: { productId?: string; quantidade?: number }[] = Array.isArray(body.items) ? body.items : [];
  const clienteNome = String(body.clienteNome ?? "").trim();
  const clienteTelefone = String(body.clienteTelefone ?? "").trim() || null;
  const endereco = String(body.endereco ?? "").trim() || null;
  const note = String(body.note ?? "").trim() || null;

  if (!clienteNome || itemsRaw.length === 0) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: usersPage, error: usersError } = await admin.auth.admin.listUsers();
  const owner = usersError ? null : usersPage.users.find((u) => u.email === OWNER_EMAIL);
  if (!owner) {
    return NextResponse.json({ error: "Loja não encontrada." }, { status: 500 });
  }
  const ownerId = owner.id;

  // Preço sempre buscado no banco, nunca confiado no que o cliente mandou.
  const productIds = itemsRaw.map((i) => i.productId).filter(Boolean) as string[];
  const { data: produtos } = await admin
    .from("del_products")
    .select("id, nome, preco")
    .eq("owner_id", ownerId)
    .eq("ativo", true)
    .in("id", productIds);

  const produtoPorId = new Map((produtos ?? []).map((p) => [p.id, p]));
  const items = itemsRaw
    .filter((i) => i.productId && produtoPorId.has(i.productId) && Number(i.quantidade) > 0)
    .map((i) => {
      const produto = produtoPorId.get(i.productId as string)!;
      return { productId: produto.id, nome: produto.nome, quantidade: Number(i.quantidade), precoUnitario: Number(produto.preco) };
    });

  if (items.length === 0) {
    return NextResponse.json({ error: "Nenhum item válido no pedido." }, { status: 400 });
  }

  const totale = items.reduce((sum, item) => sum + item.quantidade * item.precoUnitario, 0);

  const { data: order, error: orderError } = await admin
    .from("del_orders")
    .insert({
      owner_id: ownerId,
      cliente_nome: clienteNome,
      cliente_telefone: clienteTelefone,
      endereco,
      canal: "site",
      status: "aguardando_pagamento",
      note,
      totale,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Não foi possível registrar o pedido." }, { status: 500 });
  }

  const { error: itemsError } = await admin.from("del_order_items").insert(
    items.map((item) => ({
      owner_id: ownerId,
      order_id: order.id,
      product_id: item.productId,
      quantidade: item.quantidade,
      preco_unitario: item.precoUnitario,
    })),
  );

  if (itemsError) {
    return NextResponse.json({ error: "Não foi possível salvar os itens do pedido." }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  let session;
  try {
    session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["pix"],
      line_items: items.map((item) => ({
        price_data: {
          currency: "brl",
          product_data: { name: item.nome },
          unit_amount: Math.round(item.precoUnitario * 100),
        },
        quantity: item.quantidade,
      })),
      success_url: `${siteUrl}/pranzo/pedido-confirmado?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pranzo?checkout=cancelled`,
      metadata: { product: "pranzo_pedido", orderId: order.id },
    });
  } catch (err) {
    // Pix pode não estar habilitado na conta Stripe ainda — avisa claro em
    // vez de deixar o pedido pendente sem explicação.
    const message = err instanceof Error ? err.message : "Erro ao criar pagamento.";
    return NextResponse.json({ error: `Não foi possível iniciar o pagamento Pix: ${message}` }, { status: 500 });
  }

  await admin.from("del_orders").update({ stripe_session_id: session.id }).eq("id", order.id);

  if (!session.url) {
    return NextResponse.json({ error: "Não foi possível criar a sessão de pagamento." }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}

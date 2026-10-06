import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { findOrCreateAsaasCustomer, createAsaasPixPayment, getAsaasPixQrCode } from "@/lib/asaas";

const OWNER_EMAIL = "viroedu@gmail.com";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const itemsRaw: { productId?: string; quantidade?: number }[] = Array.isArray(body.items) ? body.items : [];
  const clienteNome = String(body.clienteNome ?? "").trim();
  const clienteTelefone = String(body.clienteTelefone ?? "").trim() || null;
  const cpfCnpj = String(body.cpfCnpj ?? "").replace(/\D/g, "");
  const endereco = String(body.endereco ?? "").trim() || null;
  const note = String(body.note ?? "").trim() || null;

  if (!clienteNome || !cpfCnpj || itemsRaw.length === 0) {
    return NextResponse.json({ error: "Preencha nome, CPF e pelo menos um item." }, { status: 400 });
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

  try {
    const customerId = await findOrCreateAsaasCustomer({
      name: clienteNome,
      cpfCnpj,
      phone: clienteTelefone,
    });

    const payment = await createAsaasPixPayment({
      customerId,
      value: totale,
      description: `Pedido Pranzo — ${items.map((i) => `${i.quantidade}x ${i.nome}`).join(", ")}`,
      externalReference: order.id,
    });

    await admin.from("del_orders").update({ asaas_payment_id: payment.id }).eq("id", order.id);

    const qrCode = await getAsaasPixQrCode(payment.id);

    return NextResponse.json({
      orderId: order.id,
      encodedImage: qrCode.encodedImage,
      payload: qrCode.payload,
      expirationDate: qrCode.expirationDate,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao gerar pagamento Pix.";
    return NextResponse.json({ error: `Não foi possível gerar o Pix: ${message}` }, { status: 500 });
  }
}

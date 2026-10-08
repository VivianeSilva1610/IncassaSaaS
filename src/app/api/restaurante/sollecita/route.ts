import { NextResponse } from "next/server";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { generateSollecitoMessageRestaurante } from "@/lib/anthropic";
import { getFallbackMessageRestaurante } from "@/lib/delivery/fallback-message";
import { normalizePhoneForWhatsapp } from "@/lib/delivery/phone";
import type { Tone } from "@/content/kit-incassa";

export async function POST(req: Request) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();

  const body = (await req.json()) as { id: string; tono: Tone };
  const { id, tono } = body;

  const [{ data: conta, error }, { data: restaurant }] = await Promise.all([
    supabase
      .from("del_contas_a_receber")
      .select("cliente_nome, cliente_telefone, valor, data_vencimento")
      .eq("id", id)
      .eq("owner_id", restaurantOwnerId)
      .single(),
    supabase.from("restaurants").select("country_code").eq("owner_user_id", restaurantOwnerId).maybeSingle(),
  ]);

  if (error || !conta) {
    return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
  }
  const country: "BR" | "IT" = restaurant?.country_code === "IT" ? "IT" : "BR";

  const diasAtraso = Math.max(
    0,
    Math.round((Date.now() - new Date(conta.data_vencimento).getTime()) / (1000 * 60 * 60 * 24)),
  );

  let message: string;
  let fallback = false;
  try {
    message = await generateSollecitoMessageRestaurante({
      tono,
      clienteNome: conta.cliente_nome,
      valor: Number(conta.valor),
      dataVencimento: conta.data_vencimento,
      diasAtraso,
      country,
    });
    if (!message) throw new Error("Resposta vazia da IA");
  } catch (err) {
    console.error("generateSollecitoMessageRestaurante failed, using fallback:", err);
    message = getFallbackMessageRestaurante({
      tono,
      clienteNome: conta.cliente_nome,
      valor: Number(conta.valor),
      dataVencimento: conta.data_vencimento,
      country,
    });
    fallback = true;
  }

  const phone = conta.cliente_telefone ? normalizePhoneForWhatsapp(conta.cliente_telefone, country) : null;

  return NextResponse.json({ message, fallback, phone });
}

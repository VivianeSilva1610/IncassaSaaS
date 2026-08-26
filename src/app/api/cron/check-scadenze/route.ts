import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendPushToUser } from "@/lib/web-push";
import { formatEuro } from "@/lib/urgency";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const supabase = getSupabaseAdmin();

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("user_id, importo, clients(nome, user_id)")
    .eq("status", "aperta")
    .eq("data_scadenza", today);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const inv of invoices ?? []) {
    const cliente = inv.clients as unknown as { nome: string; user_id: string } | null;
    if (!cliente || cliente.user_id !== inv.user_id) {
      console.error(`Skipping invoice with mismatched client ownership (user ${inv.user_id})`);
      continue;
    }
    const clienteNome = cliente.nome;
    await sendPushToUser(inv.user_id, {
      title: "Fattura in scadenza oggi",
      body: `${clienteNome} — ${formatEuro(Number(inv.importo))}`,
      url: "/app",
    });
    sent += 1;
  }

  return NextResponse.json({ checked: invoices?.length ?? 0, sent });
}

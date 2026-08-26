import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const body = (await req.json()) as {
    clientId: string;
    tipoDocumento: "fattura" | "preventivo";
    documentId: string;
    canale: "email" | "whatsapp";
    tono: string;
  };

  await supabase.from("comunicazioni").insert({
    user_id: user.id,
    client_id: body.clientId,
    tipo_documento: body.tipoDocumento,
    document_id: body.documentId,
    canale: body.canale,
    tono: body.tono,
    automatico: false,
  });

  return NextResponse.json({ ok: true });
}

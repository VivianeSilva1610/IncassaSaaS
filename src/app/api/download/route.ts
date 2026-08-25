import { NextResponse } from "next/server";
import { verifyPaidSession } from "@/lib/verify-access";
import { buildKitText } from "@/lib/kit-file";

export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "session_id mancante" }, { status: 400 });
  }

  const access = await verifyPaidSession(sessionId);

  if (!access) {
    return NextResponse.json({ error: "Accesso non valido" }, { status: 403 });
  }

  const kitText = buildKitText();

  return new NextResponse(kitText, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="kit-incassa-37-messaggi.txt"',
    },
  });
}

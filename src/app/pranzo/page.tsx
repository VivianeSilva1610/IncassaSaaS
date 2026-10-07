import { redirect } from "next/navigation";

// FASE 2 — /pranzo vira um alias/redirecionamento compatível pra
// /loja/pranzo, que agora é a implementação real (dados 100% do banco,
// resolvidos pelo slug). Links e QR codes já impressos com /pranzo
// continuam funcionando.
export default function PranzoRedirect() {
  redirect("/loja/pranzo");
}

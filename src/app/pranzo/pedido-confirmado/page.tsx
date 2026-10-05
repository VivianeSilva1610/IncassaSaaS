import Link from "next/link";

export default function PedidoConfirmadoPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold text-stone-900">Pedido recebido! 🎉</h1>
      <p className="mt-3 text-stone-600">
        Assim que o pagamento Pix for confirmado (geralmente em poucos segundos), seu pedido já vai
        direto para a cozinha. Você pode fechar esta página.
      </p>
      <Link href="/pranzo" className="mt-6 text-sm font-medium text-amber-700 underline underline-offset-2">
        Voltar ao cardápio
      </Link>
    </main>
  );
}

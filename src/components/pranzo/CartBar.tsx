"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function CartBar() {
  const { itens, remover, adicionar, total, quantidadeTotal } = useCart();
  const [aberto, setAberto] = useState(false);
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "enviando" | "erro">("idle");
  const [erro, setErro] = useState<string | null>(null);

  if (quantidadeTotal === 0 && !aberto) return null;

  async function finalizarPedido() {
    if (!clienteNome.trim() || !endereco.trim()) {
      setErro("Preencha nome e endereço de entrega.");
      return;
    }
    setStatus("enviando");
    setErro(null);
    try {
      const res = await fetch("/api/pedido-site/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itens.map((i) => ({ productId: i.productId, quantidade: i.quantidade })),
          clienteNome,
          clienteTelefone,
          endereco,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao iniciar pagamento");
      window.location.href = data.url;
    } catch (err) {
      setStatus("erro");
      setErro(err instanceof Error ? err.message : "Erro ao iniciar pagamento");
    }
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
          <span className="text-sm font-medium text-stone-900">
            {quantidadeTotal} {quantidadeTotal === 1 ? "item" : "itens"} — {formatReal(total)}
          </span>
          <button
            type="button"
            onClick={() => setAberto(true)}
            className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Ver sacola
          </button>
        </div>
      </div>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setAberto(false)}>
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-stone-900">Sua sacola</h2>
              <button type="button" onClick={() => setAberto(false)} className="text-stone-400">✕</button>
            </div>

            <div className="mt-3 space-y-2">
              {itens.map((i) => (
                <div key={i.productId} className="flex items-center justify-between text-sm">
                  <span className="text-stone-700">{i.nome}</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => remover(i.productId)} className="h-6 w-6 rounded-md border border-stone-300 text-xs">−</button>
                    <span className="w-5 text-center">{i.quantidade}</span>
                    <button
                      type="button"
                      onClick={() => adicionar({ productId: i.productId, nome: i.nome, preco: i.preco })}
                      className="h-6 w-6 rounded-md border border-stone-300 text-xs"
                    >
                      +
                    </button>
                    <span className="w-16 text-right font-medium text-stone-900">{formatReal(i.preco * i.quantidade)}</span>
                  </div>
                </div>
              ))}
              {itens.length === 0 && <p className="text-sm text-stone-500">Sua sacola está vazia.</p>}
            </div>

            {itens.length > 0 && (
              <>
                <p className="mt-3 text-right text-sm font-bold text-stone-900">Total: {formatReal(total)}</p>

                <div className="mt-4 space-y-2 border-t border-stone-100 pt-4">
                  <input
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                  />
                  <input
                    value={clienteTelefone}
                    onChange={(e) => setClienteTelefone(e.target.value)}
                    placeholder="Telefone / WhatsApp"
                    className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                  />
                  <input
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Endereço de entrega"
                    className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                  />
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Observações (opcional)"
                    rows={2}
                    className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={finalizarPedido}
                  disabled={status === "enviando"}
                  className="mt-4 w-full rounded-full bg-stone-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {status === "enviando" ? "Abrindo pagamento…" : "Pagar com Pix"}
                </button>
                {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
                <p className="mt-2 text-center text-xs text-stone-400">
                  O pedido só vai para a cozinha depois que o pagamento for confirmado.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

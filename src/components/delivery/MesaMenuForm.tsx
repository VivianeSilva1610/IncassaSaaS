"use client";

import { useState } from "react";

type Product = { id: string; nome: string; preco: number; categoria: string };

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const GRUPOS: { categoria: string; label: string }[] = [
  { categoria: "prato", label: "Pratos" },
  { categoria: "bebida", label: "Bebidas" },
  { categoria: "sobremesa", label: "Sobremesas" },
];

export function MesaMenuForm({ qrToken, products }: { qrToken: string; products: Product[] }) {
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});
  const [observacao, setObservacao] = useState("");
  const [status, setStatus] = useState<"idle" | "enviando" | "enviado" | "erro">("idle");
  const [erro, setErro] = useState<string | null>(null);

  const itensSelecionados = Object.entries(quantidades).filter(([, qtd]) => qtd > 0);
  const total = itensSelecionados.reduce((sum, [id, qtd]) => {
    const produto = products.find((p) => p.id === id);
    return sum + (produto ? produto.preco * qtd : 0);
  }, 0);

  function alterarQuantidade(id: string, delta: number) {
    setQuantidades((prev) => {
      const atual = prev[id] ?? 0;
      const nova = Math.max(0, atual + delta);
      return { ...prev, [id]: nova };
    });
  }

  async function enviarPedido() {
    setStatus("enviando");
    setErro(null);
    try {
      const res = await fetch("/api/mesa/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrToken,
          observacao,
          items: itensSelecionados.map(([productId, quantidade]) => ({ productId, quantidade })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao enviar pedido");

      setStatus("enviado");
      setQuantidades({});
      setObservacao("");
    } catch (err) {
      setStatus("erro");
      setErro(err instanceof Error ? err.message : "Erro ao enviar pedido");
    }
  }

  if (status === "enviado") {
    return (
      <div className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
        <p>Pedido enviado para a cozinha! 🎉</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-2 text-xs text-emerald-700 underline underline-offset-2"
        >
          Fazer outro pedido
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {GRUPOS.map(({ categoria, label }) => {
        const itensDaCategoria = products.filter((p) => p.categoria === categoria);
        if (itensDaCategoria.length === 0) return null;
        return (
          <div key={categoria} className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">{label}</p>
            <div className="mt-1.5 space-y-1.5">
              {itensDaCategoria.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-stone-900">{p.nome}</p>
                    <p className="text-xs text-stone-500">{formatReal(p.preco)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => alterarQuantidade(p.id, -1)}
                      className="h-7 w-7 rounded-md border border-stone-300 text-sm text-stone-600"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm">{quantidades[p.id] ?? 0}</span>
                    <button
                      type="button"
                      onClick={() => alterarQuantidade(p.id, 1)}
                      className="h-7 w-7 rounded-md border border-stone-300 text-sm text-stone-600"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <textarea
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
        placeholder="Alguma observação? (opcional)"
        rows={2}
        className="mt-4 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
      />

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-medium text-stone-900">Total: {formatReal(total)}</span>
        <button
          type="button"
          onClick={enviarPedido}
          disabled={itensSelecionados.length === 0 || status === "enviando"}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {status === "enviando" ? "Enviando…" : "Enviar pedido à cozinha"}
        </button>
      </div>
      {status === "erro" && <p className="mt-2 text-sm text-red-600">{erro}</p>}
    </div>
  );
}

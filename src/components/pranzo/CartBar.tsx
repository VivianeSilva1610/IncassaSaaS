"use client";

import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

type PixData = { orderId: string; encodedImage: string; payload: string };
type ZonaEntrega = { id: string; bairro: string; taxa: number; pedidoMinimoGratis: number | null };

export function CartBar({
  zonasEntrega,
  whatsappRetiradaHref,
}: {
  zonasEntrega: ZonaEntrega[];
  whatsappRetiradaHref: string;
}) {
  const { itens, remover, adicionar, total, quantidadeTotal, limpar } = useCart();
  const [aberto, setAberto] = useState(false);
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [bairroId, setBairroId] = useState("");
  const [endereco, setEndereco] = useState("");
  const [note, setNote] = useState("");
  const zonaSelecionada = zonasEntrega.find((z) => z.id === bairroId) ?? null;
  const atingiuMinimo =
    !!zonaSelecionada && zonaSelecionada.pedidoMinimoGratis != null && total >= zonaSelecionada.pedidoMinimoGratis;
  const taxaEntregaAtual = zonaSelecionada && !atingiuMinimo ? zonaSelecionada.taxa : 0;
  const faltaParaGratis =
    zonaSelecionada && zonaSelecionada.pedidoMinimoGratis != null && !atingiuMinimo
      ? zonaSelecionada.pedidoMinimoGratis - total
      : null;
  const totalComEntrega = total + taxaEntregaAtual;
  const [status, setStatus] = useState<"idle" | "enviando" | "erro" | "aguardando_pix" | "confirmado">("idle");
  const [erro, setErro] = useState<string | null>(null);
  const [pix, setPix] = useState<PixData | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (status !== "aguardando_pix" || !pix) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/pedido-site/status?orderId=${pix.orderId}`);
      const data = await res.json();
      if (data.status && data.status !== "aguardando_pagamento") {
        setStatus("confirmado");
        limpar();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [status, pix, limpar]);

  if (quantidadeTotal === 0 && !aberto && status === "idle") return null;

  async function finalizarPedido() {
    if (!clienteNome.trim() || !endereco.trim() || !cpfCnpj.trim() || !bairroId) {
      setErro("Preencha nome, CPF, bairro e endereço de entrega.");
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
          cpfCnpj,
          bairroId,
          endereco,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao gerar Pix");
      setPix({ orderId: data.orderId, encodedImage: data.encodedImage, payload: data.payload });
      setStatus("aguardando_pix");
    } catch (err) {
      setStatus("erro");
      setErro(err instanceof Error ? err.message : "Erro ao gerar Pix");
    }
  }

  function copiarCodigo() {
    if (!pix) return;
    navigator.clipboard.writeText(pix.payload).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  return (
    <>
      {status === "idle" && (
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
      )}

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => status !== "aguardando_pix" && setAberto(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {status === "aguardando_pix" && pix && (
              <div className="text-center">
                <h2 className="text-lg font-bold text-stone-900">Pague com Pix</h2>
                <p className="mt-1 text-sm text-stone-600">Escaneie o QR code ou copie o código abaixo.</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${pix.encodedImage}`}
                  alt="QR Code Pix"
                  className="mx-auto mt-4 h-56 w-56"
                />
                <button
                  type="button"
                  onClick={copiarCodigo}
                  className="mt-3 w-full rounded-md border border-stone-300 px-3 py-2 text-xs text-stone-600"
                >
                  {copiado ? "Copiado!" : "Copiar código Pix"}
                </button>
                <p className="mt-4 flex items-center justify-center gap-2 text-sm text-stone-500">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                  Aguardando confirmação do pagamento…
                </p>
              </div>
            )}

            {status === "confirmado" && (
              <div className="py-6 text-center">
                <h2 className="text-lg font-bold text-stone-900">Pagamento confirmado! 🎉</h2>
                <p className="mt-2 text-sm text-stone-600">Seu pedido já foi enviado para a cozinha.</p>
                <button
                  type="button"
                  onClick={() => {
                    setAberto(false);
                    setStatus("idle");
                    setPix(null);
                  }}
                  className="mt-4 rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-white"
                >
                  Fechar
                </button>
              </div>
            )}

            {(status === "idle" || status === "enviando" || status === "erro") && (
              <>
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
                    <p className="mt-3 text-right text-sm text-stone-500">Itens: {formatReal(total)}</p>
                    {zonaSelecionada && taxaEntregaAtual === 0 && (
                      <p className="text-right text-sm font-semibold text-emerald-700">🎉 Frete grátis</p>
                    )}
                    {zonaSelecionada && taxaEntregaAtual > 0 && (
                      <p className="text-right text-sm text-stone-500">Entrega: {formatReal(taxaEntregaAtual)}</p>
                    )}
                    {faltaParaGratis != null && faltaParaGratis > 0 && (
                      <p className="text-right text-xs text-emerald-700">
                        Faltam {formatReal(faltaParaGratis)} pra ganhar frete grátis nesse bairro
                      </p>
                    )}
                    <p className="text-right text-sm font-bold text-stone-900">Total: {formatReal(totalComEntrega)}</p>

                    <div className="mt-4 space-y-2 border-t border-stone-100 pt-4">
                      <input
                        value={clienteNome}
                        onChange={(e) => setClienteNome(e.target.value)}
                        placeholder="Seu nome"
                        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                      />
                      <input
                        value={cpfCnpj}
                        onChange={(e) => setCpfCnpj(e.target.value)}
                        placeholder="CPF (necessário para o Pix)"
                        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                      />
                      <input
                        value={clienteTelefone}
                        onChange={(e) => setClienteTelefone(e.target.value)}
                        placeholder="Telefone / WhatsApp"
                        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                      />
                      <select
                        value={bairroId}
                        onChange={(e) => setBairroId(e.target.value)}
                        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-700"
                      >
                        <option value="">Seu bairro…</option>
                        {zonasEntrega.map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.bairro} —{" "}
                            {z.taxa === 0
                              ? "entrega grátis"
                              : z.pedidoMinimoGratis != null
                                ? `grátis a partir de ${formatReal(z.pedidoMinimoGratis)}`
                                : `entrega ${formatReal(z.taxa)}`}
                          </option>
                        ))}
                      </select>
                      {zonasEntrega.length === 0 ? (
                        <p className="text-xs text-red-600">
                          Ainda não atendemos nenhum bairro pelo site.{" "}
                          <a href={whatsappRetiradaHref} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                            Peça pelo WhatsApp e retire no local
                          </a>
                          .
                        </p>
                      ) : (
                        <p className="text-xs text-stone-500">
                          Entregamos num raio de até 30km. Não achou seu bairro?{" "}
                          <a href={whatsappRetiradaHref} target="_blank" rel="noreferrer" className="underline underline-offset-2 text-stone-700">
                            Peça pelo WhatsApp e retire no local
                          </a>
                          .
                        </p>
                      )}
                      <input
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        placeholder="Endereço de entrega (rua, número, complemento)"
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
                      disabled={status === "enviando" || zonasEntrega.length === 0}
                      className="mt-4 w-full rounded-full bg-stone-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {status === "enviando" ? "Gerando Pix…" : "Pagar com Pix"}
                    </button>
                    {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
                    <p className="mt-2 text-center text-xs text-stone-400">
                      O pedido só vai para a cozinha depois que o pagamento for confirmado.
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

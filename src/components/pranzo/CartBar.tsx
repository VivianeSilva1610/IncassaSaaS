"use client";

import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";

export type CartBarLocale = "pt-BR" | "it";

function formatMoney(value: number, locale: CartBarLocale) {
  return locale === "it"
    ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const CONTEUDO: Record<CartBarLocale, {
  item: string; itens: string; verSacola: string;
  pagueComPix: string; escaneieQr: string; copiado: string; copiarCodigo: string; aguardandoPagamento: string;
  pagueComCartao: string; abrimosAba: string; abrirPaginaPagamento: string;
  pagamentoConfirmado: string; pedidoEnviadoCozinha: string; fechar: string;
  suaSacola: string; sacolaVazia: string; itensLabel: string; freteGratis: string; entrega: string;
  faltamPara: string; totalLabel: string;
  seuNome: string; cpfNecessario: string; telefone: string; seuBairro: string; gratisEntrega: string;
  gratisAPartir: (valor: string) => string; entregaValor: (valor: string) => string;
  semBairro: string; pecaRetirada: string; raio30km: string; naoAchouBairro: string;
  enderecoPlaceholder: string; observacoesPlaceholder: string;
  pix: string; cartaoCredito: string; gerandoPagamento: string; pagarComPix: string; pagarComCartao: string;
  avisoConfirmacao: string; preencherCpf: string; preencherSemCpf: string; erroGenerico: string;
}> = {
  "pt-BR": {
    item: "item", itens: "itens", verSacola: "Ver sacola",
    pagueComPix: "Pague com Pix", escaneieQr: "Escaneie o QR code ou copie o código abaixo.",
    copiado: "Copiado!", copiarCodigo: "Copiar código Pix", aguardandoPagamento: "Aguardando confirmação do pagamento…",
    pagueComCartao: "Pague com cartão", abrimosAba: "Abrimos uma aba segura pra você digitar os dados do cartão. Não encontrou? Clique abaixo.",
    abrirPaginaPagamento: "Abrir página de pagamento",
    pagamentoConfirmado: "Pagamento confirmado! 🎉", pedidoEnviadoCozinha: "Seu pedido já foi enviado para a cozinha.", fechar: "Fechar",
    suaSacola: "Sua sacola", sacolaVazia: "Sua sacola está vazia.", itensLabel: "Itens", freteGratis: "🎉 Frete grátis",
    entrega: "Entrega", faltamPara: "pra ganhar frete grátis nesse bairro", totalLabel: "Total",
    seuNome: "Seu nome", cpfNecessario: "CPF (necessário para o pagamento)", telefone: "Telefone / WhatsApp",
    seuBairro: "Seu bairro…", gratisEntrega: "entrega grátis",
    gratisAPartir: (valor) => `grátis a partir de ${valor}`, entregaValor: (valor) => `entrega ${valor}`,
    semBairro: "Ainda não atendemos nenhum bairro pelo site.", pecaRetirada: "Peça pelo WhatsApp e retire no local",
    raio30km: "Entregamos num raio de até 30km. Não achou seu bairro?", naoAchouBairro: "Não achou seu bairro?",
    enderecoPlaceholder: "Endereço de entrega (rua, número, complemento)", observacoesPlaceholder: "Observações (opcional)",
    pix: "Pix", cartaoCredito: "Cartão de crédito", gerandoPagamento: "Gerando pagamento…",
    pagarComPix: "Pagar com Pix", pagarComCartao: "Pagar com cartão",
    avisoConfirmacao: "O pedido só vai para a cozinha depois que o pagamento for confirmado.",
    preencherCpf: "Preencha nome, CPF, bairro e endereço de entrega.", preencherSemCpf: "Preencha nome, bairro e endereço de entrega.",
    erroGenerico: "Erro ao gerar pagamento",
  },
  it: {
    item: "articolo", itens: "articoli", verSacola: "Vedi il carrello",
    pagueComPix: "Paga con Pix", escaneieQr: "Scansiona il codice QR o copia il codice qui sotto.",
    copiado: "Copiato!", copiarCodigo: "Copia codice Pix", aguardandoPagamento: "In attesa di conferma del pagamento…",
    pagueComCartao: "Paga con carta", abrimosAba: "Abbiamo aperto una scheda sicura per inserire i dati della carta. Non la trovi? Clicca qui sotto.",
    abrirPaginaPagamento: "Apri la pagina di pagamento",
    pagamentoConfirmado: "Pagamento confermato! 🎉", pedidoEnviadoCozinha: "Il tuo ordine è già stato inviato in cucina.", fechar: "Chiudi",
    suaSacola: "Il tuo carrello", sacolaVazia: "Il tuo carrello è vuoto.", itensLabel: "Articoli", freteGratis: "🎉 Consegna gratuita",
    entrega: "Consegna", faltamPara: "per avere la consegna gratuita in questa zona", totalLabel: "Totale",
    seuNome: "Il tuo nome", cpfNecessario: "Codice Fiscale (necessario per il pagamento)", telefone: "Telefono / WhatsApp",
    seuBairro: "La tua zona…", gratisEntrega: "consegna gratuita",
    gratisAPartir: (valor) => `gratuita a partire da ${valor}`, entregaValor: (valor) => `consegna ${valor}`,
    semBairro: "Non serviamo ancora nessuna zona tramite il sito.", pecaRetirada: "Ordina su WhatsApp e ritira sul posto",
    raio30km: "Consegniamo in un raggio di 30km. Non trovi la tua zona?", naoAchouBairro: "Non trovi la tua zona?",
    enderecoPlaceholder: "Indirizzo di consegna (via, numero, dettagli)", observacoesPlaceholder: "Note (opzionale)",
    pix: "Pix", cartaoCredito: "Carta di credito", gerandoPagamento: "Generazione pagamento…",
    pagarComPix: "Paga con Pix", pagarComCartao: "Paga con carta",
    avisoConfirmacao: "L'ordine viene inviato in cucina solo dopo la conferma del pagamento.",
    preencherCpf: "Inserisci nome, codice fiscale, zona e indirizzo di consegna.", preencherSemCpf: "Inserisci nome, zona e indirizzo di consegna.",
    erroGenerico: "Errore nella generazione del pagamento",
  },
};

type PixData = { encodedImage: string; payload: string };
type ZonaEntrega = { id: string; bairro: string; taxa: number; pedidoMinimoGratis: number | null };

export function CartBar({
  zonasEntrega,
  whatsappRetiradaHref,
  restaurantSlug,
  exigirCpf = true,
  aceitaPix = true,
  locale = "pt-BR",
}: {
  zonasEntrega: ZonaEntrega[];
  whatsappRetiradaHref: string;
  restaurantSlug: string;
  exigirCpf?: boolean;
  aceitaPix?: boolean;
  locale?: CartBarLocale;
}) {
  const t = CONTEUDO[locale];
  const formatReal = (value: number) => formatMoney(value, locale);
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
  const [metodoPagamento, setMetodoPagamento] = useState<"pix" | "cartao">(aceitaPix ? "pix" : "cartao");
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pix, setPix] = useState<PixData | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (status !== "aguardando_pix" || !pendingOrderId) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/pedido-site/status?orderId=${pendingOrderId}`);
      const data = await res.json();
      if (data.status && data.status !== "aguardando_pagamento") {
        setStatus("confirmado");
        limpar();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [status, pendingOrderId, limpar]);

  if (quantidadeTotal === 0 && !aberto && status === "idle") return null;

  async function finalizarPedido() {
    if (!clienteNome.trim() || !endereco.trim() || !bairroId || (exigirCpf && !cpfCnpj.trim())) {
      setErro(exigirCpf ? t.preencherCpf : t.preencherSemCpf);
      return;
    }
    setStatus("enviando");
    setErro(null);
    setPix(null);
    setInvoiceUrl(null);
    try {
      const res = await fetch("/api/pedido-site/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantSlug,
          items: itens.map((i) => ({ productId: i.productId, quantidade: i.quantidade })),
          clienteNome,
          clienteTelefone,
          cpfCnpj,
          bairroId,
          endereco,
          note,
          metodoPagamento,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.erroGenerico);
      setPendingOrderId(data.orderId);
      if (data.invoiceUrl) {
        setInvoiceUrl(data.invoiceUrl);
        window.open(data.invoiceUrl, "_blank");
      } else {
        setPix({ encodedImage: data.encodedImage, payload: data.payload });
      }
      setStatus("aguardando_pix");
    } catch (err) {
      setStatus("erro");
      setErro(err instanceof Error ? err.message : t.erroGenerico);
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
              {quantidadeTotal} {quantidadeTotal === 1 ? t.item : t.itens} — {formatReal(total)}
            </span>
            <button
              type="button"
              onClick={() => setAberto(true)}
              className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white"
            >
              {t.verSacola}
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
                <h2 className="text-lg font-bold text-stone-900">{t.pagueComPix}</h2>
                <p className="mt-1 text-sm text-stone-600">{t.escaneieQr}</p>
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
                  {copiado ? t.copiado : t.copiarCodigo}
                </button>
                <p className="mt-4 flex items-center justify-center gap-2 text-sm text-stone-500">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                  {t.aguardandoPagamento}
                </p>
              </div>
            )}

            {status === "aguardando_pix" && !pix && invoiceUrl && (
              <div className="text-center">
                <h2 className="text-lg font-bold text-stone-900">{t.pagueComCartao}</h2>
                <p className="mt-2 text-sm text-stone-600">
                  {t.abrimosAba}
                </p>
                <button
                  type="button"
                  onClick={() => window.open(invoiceUrl, "_blank")}
                  className="mt-4 w-full rounded-md bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  {t.abrirPaginaPagamento}
                </button>
                <p className="mt-4 flex items-center justify-center gap-2 text-sm text-stone-500">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                  {t.aguardandoPagamento}
                </p>
              </div>
            )}

            {status === "confirmado" && (
              <div className="py-6 text-center">
                <h2 className="text-lg font-bold text-stone-900">{t.pagamentoConfirmado}</h2>
                <p className="mt-2 text-sm text-stone-600">{t.pedidoEnviadoCozinha}</p>
                <button
                  type="button"
                  onClick={() => {
                    setAberto(false);
                    setStatus("idle");
                    setPix(null);
                    setInvoiceUrl(null);
                    setPendingOrderId(null);
                  }}
                  className="mt-4 rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-white"
                >
                  {t.fechar}
                </button>
              </div>
            )}

            {(status === "idle" || status === "enviando" || status === "erro") && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-stone-900">{t.suaSacola}</h2>
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
                  {itens.length === 0 && <p className="text-sm text-stone-500">{t.sacolaVazia}</p>}
                </div>

                {itens.length > 0 && (
                  <>
                    <p className="mt-3 text-right text-sm text-stone-500">{t.itensLabel}: {formatReal(total)}</p>
                    {zonaSelecionada && taxaEntregaAtual === 0 && (
                      <p className="text-right text-sm font-semibold text-emerald-700">{t.freteGratis}</p>
                    )}
                    {zonaSelecionada && taxaEntregaAtual > 0 && (
                      <p className="text-right text-sm text-stone-500">{t.entrega}: {formatReal(taxaEntregaAtual)}</p>
                    )}
                    {faltaParaGratis != null && faltaParaGratis > 0 && (
                      <p className="text-right text-xs text-emerald-700">
                        {formatReal(faltaParaGratis)} {t.faltamPara}
                      </p>
                    )}
                    <p className="text-right text-sm font-bold text-stone-900">{t.totalLabel}: {formatReal(totalComEntrega)}</p>

                    <div className="mt-4 space-y-2 border-t border-stone-100 pt-4">
                      <input
                        value={clienteNome}
                        onChange={(e) => setClienteNome(e.target.value)}
                        placeholder={t.seuNome}
                        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                      />
                      {exigirCpf && (
                        <input
                          value={cpfCnpj}
                          onChange={(e) => setCpfCnpj(e.target.value)}
                          placeholder={t.cpfNecessario}
                          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                        />
                      )}
                      <input
                        value={clienteTelefone}
                        onChange={(e) => setClienteTelefone(e.target.value)}
                        placeholder={t.telefone}
                        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                      />
                      <select
                        value={bairroId}
                        onChange={(e) => setBairroId(e.target.value)}
                        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-700"
                      >
                        <option value="">{t.seuBairro}</option>
                        {zonasEntrega.map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.bairro} —{" "}
                            {z.taxa === 0
                              ? t.gratisEntrega
                              : z.pedidoMinimoGratis != null
                                ? t.gratisAPartir(formatReal(z.pedidoMinimoGratis))
                                : t.entregaValor(formatReal(z.taxa))}
                          </option>
                        ))}
                      </select>
                      {zonasEntrega.length === 0 ? (
                        <p className="text-xs text-red-600">
                          {t.semBairro}{" "}
                          <a href={whatsappRetiradaHref} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                            {t.pecaRetirada}
                          </a>
                          .
                        </p>
                      ) : (
                        <p className="text-xs text-stone-500">
                          {t.raio30km}{" "}
                          <a href={whatsappRetiradaHref} target="_blank" rel="noreferrer" className="underline underline-offset-2 text-stone-700">
                            {t.pecaRetirada}
                          </a>
                          .
                        </p>
                      )}
                      <input
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        placeholder={t.enderecoPlaceholder}
                        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                      />
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={t.observacoesPlaceholder}
                        rows={2}
                        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                      />
                    </div>

                    {aceitaPix && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setMetodoPagamento("pix")}
                          className={`rounded-md border px-3 py-2 text-sm font-medium ${metodoPagamento === "pix" ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 text-stone-600"}`}
                        >
                          {t.pix}
                        </button>
                        <button
                          type="button"
                          onClick={() => setMetodoPagamento("cartao")}
                          className={`rounded-md border px-3 py-2 text-sm font-medium ${metodoPagamento === "cartao" ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 text-stone-600"}`}
                        >
                          {t.cartaoCredito}
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={finalizarPedido}
                      disabled={status === "enviando" || zonasEntrega.length === 0}
                      className="mt-3 w-full rounded-full bg-stone-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {status === "enviando"
                        ? t.gerandoPagamento
                        : metodoPagamento === "pix"
                          ? t.pagarComPix
                          : t.pagarComCartao}
                    </button>
                    {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
                    <p className="mt-2 text-center text-xs text-stone-400">
                      {t.avisoConfirmacao}
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

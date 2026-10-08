import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintFiscalDocumentButton } from "@/components/delivery/PrintFiscalDocumentButton";
import { requireRestaurantSubscription } from "@/lib/subscription";
import styles from "./print.module.css";

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatData(iso: string | null) {
  return iso ? new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—";
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
}

export default async function ImprimirNotaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, country_code")
    .eq("owner_user_id", restaurantOwnerId)
    .maybeSingle();

  if (restaurant?.country_code === "IT") {
    const [{ data: documento }, { data: configIt }] = await Promise.all([
      supabase
        .from("fiscal_documents")
        .select("*, del_orders(*, del_mesas(numero), del_order_items(quantidade, preco_unitario, del_products(nome))), fiscal_documents_it(protocollo_sdi, esito)")
        .eq("id", id)
        .eq("restaurant_id", restaurant.id)
        .maybeSingle(),
      supabase.from("restaurant_fiscal_it").select("ragione_sociale, partita_iva, codice_fiscale").eq("restaurant_id", restaurant.id).maybeSingle(),
    ]);
    if (!documento?.del_orders) notFound();

    const pedidoIt = documento.del_orders;
    const simulacaoIt = true; // nenhum provedor real contratado ainda — sempre simulação por ora.
    const itensIt = pedidoIt.del_order_items ?? [];
    const detalhesIt = Array.isArray(documento.fiscal_documents_it) ? documento.fiscal_documents_it[0] : documento.fiscal_documents_it;

    return (
      <main className="py-6">
        <div className={`${styles.actions} print:hidden`}>
          <Link href="/restaurante/vendas/pedidos" className="rounded-md border border-stone-300 px-4 py-2 text-sm">Indietro</Link>
          <PrintFiscalDocumentButton />
        </div>
        <div className={styles.page}>
          <article className={styles.receipt}>
            <header className={styles.center}>
              <p className={styles.title}>{configIt?.ragione_sociale || "Ristorante"}</p>
              {configIt?.partita_iva && <p>Partita IVA: {configIt.partita_iva}</p>}
              {configIt?.codice_fiscale && <p>Codice Fiscale: {configIt.codice_fiscale}</p>}
            </header>

            {simulacaoIt && <div className={styles.warning}>SIMULAZIONE — NESSUN VALORE FISCALE<br />NON TRASMESSO ALLO SDI</div>}
            {documento.status === "cancelado" && <div className={styles.warning}>DOCUMENTO ANNULLATO</div>}

            <div className={styles.center}>
              <strong>Rappresentazione di fattura elettronica</strong>
              <p>Emissione: {formatData(documento.updated_at ?? documento.created_at)}</p>
            </div>

            <div className={styles.divider} />
            {itensIt.map((item: { quantidade: number; preco_unitario: number; del_products: { nome: string } | null }, index: number) => (
              <div key={index} className={styles.item}>
                <div>{item.quantidade}x {item.del_products?.nome ?? "Prodotto"}</div>
                <div className={styles.row}><span>{formatEuro(Number(item.preco_unitario))} cad.</span><strong>{formatEuro(Number(item.quantidade) * Number(item.preco_unitario))}</strong></div>
              </div>
            ))}
            <div className={styles.divider} />
            <div className={`${styles.row} ${styles.total}`}><span>TOTALE</span><span>{formatEuro(Number(documento.totale))}</span></div>
            {pedidoIt.forma_pagamento && <div className={styles.row}><span>Pagamento</span><span>{String(pedidoIt.forma_pagamento).replaceAll("_", " ")}</span></div>}

            <div className={styles.divider} />
            <p>Cliente: {pedidoIt.cliente_nome || "Non identificato"}</p>
            {pedidoIt.del_mesas?.numero && <p>Tavolo: {pedidoIt.del_mesas.numero}</p>}
            <p>Ordine: {pedidoIt.id}</p>

            <div className={styles.divider} />
            <p className={styles.key}>Protocollo SdI: {detalhesIt?.protocollo_sdi || "Non disponibile"}</p>
            <p className={`${styles.center} ${styles.muted}`}>Documento generato solo per verifica visiva del sistema.</p>
          </article>
        </div>
      </main>
    );
  }

  const [{ data: nota }, { data: config }] = await Promise.all([
    supabase
      .from("del_notas_fiscais")
      .select("*, del_orders(*, del_mesas(numero), del_order_items(quantidade, preco_unitario, del_products(nome)))")
      .eq("id", id)
      .eq("owner_id", restaurantOwnerId)
      .maybeSingle(),
    supabase
      .from("del_fiscal_config")
      .select("razao_social, nome_fantasia, cnpj, inscricao_estadual, logradouro, numero, bairro, municipio, uf, cep")
      .eq("owner_id", restaurantOwnerId)
      .maybeSingle(),
  ]);
  if (!nota?.del_orders) notFound();

  const pedido = nota.del_orders;
  const simulacao = nota.provedor === "simulado" || nota.ambiente === "homologacao";
  const itens = pedido.del_order_items ?? [];

  return (
    <main className="py-6">
      <div className={`${styles.actions} print:hidden`}>
        <Link href="/restaurante/vendas/pedidos" className="rounded-md border border-stone-300 px-4 py-2 text-sm">Voltar</Link>
        <PrintFiscalDocumentButton />
      </div>
      <div className={styles.page}>
        <article className={styles.receipt}>
          <header className={styles.center}>
            <p className={styles.title}>{config?.nome_fantasia || config?.razao_social || "Restaurante"}</p>
            {config?.razao_social && config.razao_social !== config.nome_fantasia && <p>{config.razao_social}</p>}
            {config?.cnpj && <p>CNPJ: {config.cnpj}</p>}
            {config?.inscricao_estadual && <p>IE: {config.inscricao_estadual}</p>}
            {(config?.logradouro || config?.municipio) && <p>{[config.logradouro, config.numero, config.bairro, config.municipio, config.uf, config.cep].filter(Boolean).join(" · ")}</p>}
          </header>

          {simulacao && <div className={styles.warning}>SIMULAÇÃO — SEM VALOR FISCAL<br />NÃO AUTORIZADA PELA SEFAZ</div>}
          {nota.status === "cancelada" && <div className={styles.warning}>DOCUMENTO CANCELADO</div>}

          <div className={styles.center}>
            <strong>Representação da NFC-e modelo {nota.modelo ?? "65"}</strong>
            <p>Nota nº {nota.numero ?? "—"} · Série {nota.serie ?? "—"}</p>
            <p>Emissão: {formatData(nota.emitida_em ?? nota.created_at)}</p>
          </div>

          <div className={styles.divider} />
          {itens.map((item: { quantidade: number; preco_unitario: number; del_products: { nome: string } | null }, index: number) => (
            <div key={index} className={styles.item}>
              <div>{item.quantidade}x {item.del_products?.nome ?? "Produto"}</div>
              <div className={styles.row}><span>{formatReal(Number(item.preco_unitario))} cada</span><strong>{formatReal(Number(item.quantidade) * Number(item.preco_unitario))}</strong></div>
            </div>
          ))}
          <div className={styles.divider} />
          <div className={`${styles.row} ${styles.total}`}><span>TOTAL</span><span>{formatReal(Number(pedido.totale))}</span></div>
          {pedido.forma_pagamento && <div className={styles.row}><span>Pagamento</span><span>{String(pedido.forma_pagamento).replaceAll("_", " ")}</span></div>}

          <div className={styles.divider} />
          <p>Consumidor: {pedido.cliente_nome || "Não identificado"}</p>
          {pedido.cliente_cpf_cnpj && <p>CPF/CNPJ: {pedido.cliente_cpf_cnpj}</p>}
          {pedido.del_mesas?.numero && <p>Mesa: {pedido.del_mesas.numero}</p>}
          <p>Pedido: {pedido.id}</p>

          <div className={styles.divider} />
          <p className={styles.key}>Chave: {nota.chave_acesso || "Não disponível"}</p>
          <p className={styles.key}>Protocolo: {nota.protocolo_autorizacao || "Não disponível"}</p>
          <p className={`${styles.center} ${styles.muted}`}>Documento gerado apenas para conferência visual do sistema.</p>
        </article>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import styles from "../../pranzo/pranzo.module.css";
import { CartProvider } from "@/components/pranzo/CartProvider";
import { AddToCartButton } from "@/components/pranzo/AddToCartButton";
import { CartBar } from "@/components/pranzo/CartBar";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getRestaurantBySlug } from "@/lib/restaurant";
import { getPaymentProviderForRestaurant } from "@/lib/delivery/providers";

// FASE 2a — loja pública multiempresa. Cardápio, preços, disponibilidade
// e zonas de entrega já vêm 100% do banco, resolvidos pelo slug da URL
// (nunca por e-mail fixo nem por ID vindo do navegador). A identidade
// visual (hero, bio do chef etc.) ainda é só a do Pranzo — generalizar
// isso é Fase 2b, quando houver um segundo restaurante de verdade pra
// desenhar um template genérico em cima. Pra qualquer slug que não seja
// "pranzo", a página já funciona com os dados certos, só com uma capa
// simples no lugar da identidade visual do Pranzo.

type LojaLocale = "pt-BR" | "it";

function resolverLocaleLoja(defaultLocale: string): LojaLocale {
  return defaultLocale === "it" ? "it" : "pt-BR";
}

const CONTEUDO_LOJA: Record<LojaLocale, {
  navCardapio: string; fazerPedido: string; heroTextoGenerico: string; verCardapio: string;
  cardapioEyebrow: string; cardapioTitulo: string; cardapioDescricao: string;
  menuVazio: string; adicionarSacola: string;
  sobremesasEyebrow: string; sobremesasTitulo: string; bebidasEyebrow: string; bebidasTitulo: string; adicionar: string;
  menuCtaPergunta: string; menuCtaBotao: string;
  voltarTopo: string; pedidoVia: string; naoAchouBairro: string; pecaRetirada: string;
  mensagemPedido: (nome: string) => string; mensagemRetirada: (nome: string) => string; assuntoPedido: (nome: string) => string;
}> = {
  "pt-BR": {
    navCardapio: "Cardápio", fazerPedido: "Fazer pedido",
    heroTextoGenerico: "Veja o cardápio de hoje e faça seu pedido.", verCardapio: "Ver cardápio",
    cardapioEyebrow: "Nosso cardápio", cardapioTitulo: "Cardápio.",
    cardapioDescricao: "Nosso cardápio muda ao longo da semana para você sempre ter um almoço especial esperando.",
    menuVazio: "Nenhum prato disponível hoje — volte mais tarde ou confira nossas bebidas e sobremesas.",
    adicionarSacola: "Adicionar à sacola",
    sobremesasEyebrow: "Para fechar com chave de ouro", sobremesasTitulo: "Sobremesas.",
    bebidasEyebrow: "Para beber", bebidasTitulo: "Bebidas.", adicionar: "Adicionar",
    menuCtaPergunta: "Quer saber quais pratos estão saindo hoje?", menuCtaBotao: "Receber cardápio do dia",
    voltarTopo: "Voltar ao topo ↑", pedidoVia: "Peça pelo WhatsApp e retire no local",
    naoAchouBairro: "Não achou seu bairro?", pecaRetirada: "Peça pelo WhatsApp e retire no local",
    mensagemPedido: (nome) => `Olá! Quero conhecer o cardápio de hoje e fazer um pedido (${nome}).`,
    mensagemRetirada: (nome) => `Olá! Meu bairro não está na área de entrega do site — gostaria de fazer um pedido para retirar no local (${nome}).`,
    assuntoPedido: (nome) => `Pedido — ${nome}`,
  },
  it: {
    navCardapio: "Menù", fazerPedido: "Ordina ora",
    heroTextoGenerico: "Guarda il menù di oggi e fai il tuo ordine.", verCardapio: "Vedi il menù",
    cardapioEyebrow: "Il nostro menù", cardapioTitulo: "Menù.",
    cardapioDescricao: "Il nostro menù cambia durante la settimana, per avere sempre un pranzo speciale ad aspettarti.",
    menuVazio: "Nessun piatto disponibile oggi — torna più tardi o guarda bevande e dolci.",
    adicionarSacola: "Aggiungi al carrello",
    sobremesasEyebrow: "Per finire in dolcezza", sobremesasTitulo: "Dolci.",
    bebidasEyebrow: "Da bere", bebidasTitulo: "Bevande.", adicionar: "Aggiungi",
    menuCtaPergunta: "Vuoi sapere quali piatti escono oggi?", menuCtaBotao: "Ricevi il menù del giorno",
    voltarTopo: "Torna su ↑", pedidoVia: "Ordina su WhatsApp e ritira sul posto",
    naoAchouBairro: "Non hai trovato il tuo quartiere?", pecaRetirada: "Ordina su WhatsApp e ritira sul posto",
    mensagemPedido: (nome) => `Ciao! Vorrei conoscere il menù di oggi e fare un ordine (${nome}).`,
    mensagemRetirada: (nome) => `Ciao! Il mio quartiere non è nell'area di consegna del sito — vorrei fare un ordine da ritirare sul posto (${nome}).`,
    assuntoPedido: (nome) => `Ordine — ${nome}`,
  },
};

type ItemCardapio = {
  productId: string;
  nome: string;
  descricao: string | null;
  imagem: string | null;
  video: string | null;
  destaque: string | null;
  preco: number;
};

type ZonaEntrega = { id: string; bairro: string; taxa: number; pedidoMinimoGratis: number | null };

async function buscarCardapio(
  admin: SupabaseClient,
  ownerId: string,
): Promise<{ pratos: ItemCardapio[]; sobremesas: ItemCardapio[]; bebidas: ItemCardapio[] }> {
  const { data, error } = await admin
    .from("del_products")
    .select("id, nome, descrizione, imagem_url, video_url, destaque, preco, categoria, dias_site, ordem")
    .eq("owner_id", ownerId)
    .eq("ativo", true)
    .eq("visivel_site", true)
    .in("categoria", ["prato", "sobremesa", "bebida"])
    .order("ordem")
    .order("nome");

  if (error) {
    // Página pública não deve quebrar por isso — mas precisa ficar
    // visível no log do servidor, não falhar em silêncio.
    console.error("buscarCardapio: falha ao consultar del_products", error);
  }

  const hoje = new Date().getDay();
  const disponiveisHoje = (data ?? []).filter(
    (p) => !p.dias_site || p.dias_site.length === 0 || p.dias_site.includes(hoje),
  );

  const mapear = (p: (typeof disponiveisHoje)[number]): ItemCardapio => ({
    productId: p.id,
    nome: p.nome,
    descricao: p.descrizione,
    imagem: p.imagem_url,
    video: p.video_url,
    destaque: p.destaque,
    preco: Number(p.preco),
  });

  return {
    pratos: disponiveisHoje.filter((p) => p.categoria === "prato").map(mapear),
    sobremesas: disponiveisHoje.filter((p) => p.categoria === "sobremesa").map(mapear),
    bebidas: disponiveisHoje.filter((p) => p.categoria === "bebida").map(mapear),
  };
}

async function buscarZonasEntrega(admin: SupabaseClient, ownerId: string): Promise<ZonaEntrega[]> {
  const { data } = await admin
    .from("del_zonas_entrega")
    .select("id, bairro, taxa, pedido_minimo_gratis")
    .eq("owner_id", ownerId)
    .eq("ativo", true)
    .order("bairro");

  return (data ?? []).map((z) => ({
    id: z.id,
    bairro: z.bairro,
    taxa: Number(z.taxa),
    pedidoMinimoGratis: z.pedido_minimo_gratis != null ? Number(z.pedido_minimo_gratis) : null,
  }));
}

function formatMoney(value: number, locale: LojaLocale) {
  return locale === "it"
    ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.buttonIcon}>
      <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LeafMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 52 52" className={styles.leafMark}>
      <path d="M41 8C24 9 12 18 11 35c8 1 15-1 20-6 6-6 8-14 10-21Z" fill="currentColor" />
      <path d="M10 43c5-12 13-20 25-27" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const admin = getSupabaseAdmin();
  const restaurant = await getRestaurantBySlug(admin, slug);
  if (!restaurant) return { title: "Restaurante não encontrado" };
  const locale = resolverLocaleLoja(restaurant.defaultLocale);
  return {
    title: locale === "it" ? `${restaurant.name} — cibo vero, pronto per te` : `${restaurant.name} — comida de verdade, pronta para você`,
    description: locale === "it" ? "Guarda il menù e fai il tuo ordine." : "Veja o cardápio e faça seu pedido.",
  };
}

// A disponibilidade depende do dia da semana e de toggles do admin —
// não pode ser congelada numa página estática gerada no build.
export const dynamic = "force-dynamic";

export default async function LojaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = getSupabaseAdmin();
  const restaurant = await getRestaurantBySlug(admin, slug);
  if (!restaurant) notFound();

  const [cardapio, zonasEntrega, paymentProvider] = await Promise.all([
    buscarCardapio(admin, restaurant.ownerUserId),
    buscarZonasEntrega(admin, restaurant.ownerUserId),
    getPaymentProviderForRestaurant(admin, restaurant.id),
  ]);
  // CPF/CNPJ só existe no Brasil — a Asaas (Pix/boleto) exige, o Stripe não.
  const exigirCpf = paymentProvider?.provider !== "stripe";
  const aceitaPix = paymentProvider?.provider === "asaas";

  const ehPranzo = restaurant.slug === "pranzo";
  const locale = resolverLocaleLoja(restaurant.defaultLocale);
  const t = CONTEUDO_LOJA[locale];
  const formatPreco = (value: number) => formatMoney(value, locale);

  const whatsappNumber = (process.env.NEXT_PUBLIC_RESTAURANTE_WHATSAPP ?? "").replace(/\D/g, "");
  const contactEmail = "viverevivi37@gmail.com";
  const orderMessage = t.mensagemPedido(restaurant.name);
  const whatsappMessage = encodeURIComponent(orderMessage);
  const emailSubject = encodeURIComponent(t.assuntoPedido(restaurant.name));
  const emailBody = encodeURIComponent(orderMessage);
  const contactHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`
    : `mailto:${contactEmail}?subject=${emailSubject}&body=${emailBody}`;
  const contactTarget = whatsappNumber ? "_blank" : undefined;

  const retiradaMessage = encodeURIComponent(t.mensagemRetirada(restaurant.name));
  const whatsappRetiradaHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${retiradaMessage}`
    : `mailto:${contactEmail}?subject=${encodeURIComponent(t.assuntoPedido(restaurant.name))}&body=${retiradaMessage}`;

  const corPersonalizada = !ehPranzo && restaurant.corPrimaria ? ({ "--orange": restaurant.corPrimaria } as React.CSSProperties) : undefined;

  return (
    <CartProvider>
      <main className={styles.page} style={corPersonalizada}>
        <header className={styles.header}>
          <Link href={`/loja/${restaurant.slug}`} className={styles.brand} aria-label={`${restaurant.name}, início`}>
            {restaurant.logoUrl ? (
              <span className={styles.brandMark} style={{ overflow: "hidden" }}>
                <Image src={restaurant.logoUrl} alt="" width={42} height={42} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
              </span>
            ) : (
              <span className={styles.brandMark}><LeafMark /></span>
            )}
            <span>
              <strong>{restaurant.name.toUpperCase()}</strong>
              {ehPranzo && <small>cucina italiana</small>}
            </span>
          </Link>

          <nav className={styles.nav} aria-label="Navegação principal">
            <a href="#cardapio">{t.navCardapio}</a>
            {ehPranzo && <a href="#como-funciona">Como pedir</a>}
            {ehPranzo && <a href="#sobre">Nossa cozinha</a>}
          </nav>

          <a className={styles.headerCta} href={contactHref} target={contactTarget} rel="noreferrer">
            {t.fazerPedido}
          </a>
        </header>

        <div className={styles.tricolore} aria-hidden="true"><span /><span /><span /></div>

        {ehPranzo ? (
          <section className={styles.hero}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}><span /> Cucina italiana · Ricette di famiglia</p>
              <h1>Um pedacinho da Itália no seu <em>pranzo.</em></h1>
              <p className={styles.heroText}>
                Marmitas italianas artesanais, ingredientes frescos e receitas com aquele sabor acolhedor de comida feita em casa.
              </p>
              <div className={styles.heroActions}>
                <a className={styles.primaryButton} href={contactHref} target={contactTarget} rel="noreferrer">
                  Ver cardápio de hoje <ArrowIcon />
                </a>
                <a className={styles.textLink} href="#como-funciona">Como funciona <span>↓</span></a>
              </div>
              <div className={styles.trustRow}>
                <div><strong>Fatto a mano</strong><span>feito por nós</span></div>
                <div><strong>Ogni giorno</strong><span>comida fresquinha</span></div>
                <div><strong>Con amore</strong><span>em cada marmita</span></div>
              </div>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.sunShape} />
              <div className={styles.heroImageWrap}>
                <Image
                  src="/cardapio/pollo-alla-pizzaiola.jpg"
                  alt="Marmita artesanal de frango à pizzaiola com acompanhamentos"
                  fill
                  sizes="(max-width: 900px) 92vw, 48vw"
                  className={styles.heroImage}
                  priority
                />
              </div>
              <div className={styles.freshCard}>
                <span className={styles.freshIcon}>✦</span>
                <span><strong>Fatto al momento</strong><small>Preparado na hora para você</small></span>
              </div>
              <p className={styles.handNote}>buon appetito! <span>↗</span></p>
            </div>
          </section>
        ) : (
          <section className={styles.hero} style={restaurant.capaUrl ? undefined : { gridTemplateColumns: "1fr" }}>
            <div className={styles.heroCopy}>
              <h1>{restaurant.name}</h1>
              <p className={styles.heroText}>{t.heroTextoGenerico}</p>
              <div className={styles.heroActions}>
                <a className={styles.primaryButton} href="#cardapio">
                  {t.verCardapio} <ArrowIcon />
                </a>
              </div>
            </div>
            {restaurant.capaUrl && (
              <div className={styles.heroVisual}>
                <div className={styles.heroImageWrap}>
                  <Image
                    src={restaurant.capaUrl}
                    alt={restaurant.name}
                    fill
                    sizes="(max-width: 900px) 92vw, 48vw"
                    className={styles.heroImage}
                    priority
                  />
                </div>
              </div>
            )}
          </section>
        )}

        {ehPranzo && (
          <section className={styles.marquee} aria-label="Nossos diferenciais">
            <span>Sapore italiano</span><i>✦</i><span>Ingredientes frescos</span><i>✦</i><span>Porções generosas</span><i>✦</i><span>Ricette di famiglia</span>
          </section>
        )}

        <section id="cardapio" className={styles.menuSection}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}><span /> {ehPranzo ? "Il nostro menù" : t.cardapioEyebrow}</p>
              <h2>{ehPranzo ? "Cardápio." : t.cardapioTitulo}</h2>
            </div>
            <p>{ehPranzo ? "Nosso cardápio muda ao longo da semana para você sempre ter um almoço especial esperando." : t.cardapioDescricao}</p>
          </div>

          <div className={styles.menuGrid}>
            {cardapio.pratos.map((prato, index) => (
              <article className={styles.foodCard} key={prato.productId}>
                {prato.video ? (
                  <div className={styles.foodImageWrap}>
                    <video src={prato.video} controls playsInline preload="metadata" className={styles.foodImage} aria-label={`Vídeo de ${prato.nome}`} />
                  </div>
                ) : prato.imagem && (
                  <div className={styles.foodImageWrap}>
                    <Image src={prato.imagem} alt={prato.nome} fill sizes="(max-width: 700px) 92vw, (max-width: 1100px) 45vw, 30vw" className={styles.foodImage} />
                    <span className={styles.foodNumber}>{String(index + 1).padStart(2, "0")}</span>
                  </div>
                )}
                <div className={styles.foodCardBody}>
                  {prato.destaque && <span className={styles.foodBadge}>{prato.destaque}</span>}
                  <h3>{prato.nome}</h3>
                  {prato.descricao && <p>{prato.descricao}</p>}
                  <p className={styles.foodPrice}>{formatPreco(prato.preco)}</p>
                  <AddToCartButton productId={prato.productId} nome={prato.nome} preco={prato.preco} className={styles.foodCardCta}>
                    {t.adicionarSacola} <ArrowIcon />
                  </AddToCartButton>
                </div>
              </article>
            ))}
            {cardapio.pratos.length === 0 && (
              <p className={styles.menuEmpty}>{t.menuVazio}</p>
            )}
          </div>

          {cardapio.sobremesas.length > 0 && (
            <>
              <div className={styles.dessertHeading}>
                <p className={styles.eyebrow}><span /> {ehPranzo ? "Per finire in dolcezza" : t.sobremesasEyebrow}</p>
                <h2>{ehPranzo ? "Sobremesas." : t.sobremesasTitulo}</h2>
              </div>

              <div className={styles.dessertGrid}>
                {cardapio.sobremesas.map((sobremesa, index) => (
                  <article className={`${styles.foodCard} ${styles.dessertCard}`} key={sobremesa.productId}>
                    {sobremesa.video ? (
                      <div className={styles.foodImageWrap}>
                        <video src={sobremesa.video} controls playsInline preload="metadata" className={styles.foodImage} aria-label={`Vídeo de ${sobremesa.nome}`} />
                      </div>
                    ) : sobremesa.imagem && (
                      <div className={styles.foodImageWrap}>
                        <Image src={sobremesa.imagem} alt={sobremesa.nome} fill sizes="(max-width: 700px) 92vw, 45vw" className={styles.foodImage} />
                        <span className={styles.foodNumber}>D{index + 1}</span>
                      </div>
                    )}
                    <div className={styles.foodCardBody}>
                      {sobremesa.destaque && <span className={styles.foodBadge}>{sobremesa.destaque}</span>}
                      <h3>{sobremesa.nome}</h3>
                      {sobremesa.descricao && <p>{sobremesa.descricao}</p>}
                      <p className={styles.foodPrice}>{formatPreco(sobremesa.preco)}</p>
                      <AddToCartButton productId={sobremesa.productId} nome={sobremesa.nome} preco={sobremesa.preco} className={styles.foodCardCta}>
                        {t.adicionarSacola} <ArrowIcon />
                      </AddToCartButton>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {cardapio.bebidas.length > 0 && (
            <>
              <div className={styles.dessertHeading}>
                <p className={styles.eyebrow}><span /> {ehPranzo ? "Da bere" : t.bebidasEyebrow}</p>
                <h2>{ehPranzo ? "Bebidas." : t.bebidasTitulo}</h2>
              </div>

              <div className={styles.drinkGrid}>
                {cardapio.bebidas.map((bebida) => (
                  <div className={styles.drinkCard} key={bebida.productId}>
                    <span className={styles.drinkName}>{bebida.nome}</span>
                    <span className={styles.drinkPrice}>{formatPreco(bebida.preco)}</span>
                    <AddToCartButton productId={bebida.productId} nome={bebida.nome} preco={bebida.preco} className={styles.drinkCta}>
                      {t.adicionar} <ArrowIcon />
                    </AddToCartButton>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className={styles.menuCta}>
            <p>{t.menuCtaPergunta}</p>
            <a href={contactHref} target={contactTarget} rel="noreferrer">{t.menuCtaBotao} <ArrowIcon /></a>
          </div>
        </section>

        {ehPranzo && (
          <>
            <section id="sobre" className={styles.storySection}>
              <div className={styles.storyImages}>
                <div className={styles.storyMainImage}>
                  <Image src="/cardapio/pasta-al-ragu.jpg" alt="Massa artesanal ao ragu" fill sizes="(max-width: 800px) 90vw, 42vw" className={styles.coverImage} />
                </div>
                <div className={styles.storySmallImage}>
                  <Image src="/cardapio/tiramisu.jpg" alt="Tiramisù artesanal" fill sizes="240px" className={styles.coverImage} />
                </div>
                <span className={styles.roundStamp}>FEITO COM CARINHO · TODOS OS DIAS ·</span>
              </div>
              <div className={styles.storyCopy}>
                <p className={styles.eyebrow}><span /> La nostra cucina</p>
                <h2>Receitas de família.<br />Sabor inesquecível.</h2>
                <p>
                  Inspirados na cozinha das nonnas italianas, cozinhamos em pequenos lotes, respeitamos o tempo de cada receita e escolhemos ingredientes que nós mesmos serviríamos à nossa família.
                </p>
                <ul>
                  <li><span>✓</span> Produção artesanal e cuidadosa</li>
                  <li><span>✓</span> Cardápio variado durante a semana</li>
                  <li><span>✓</span> Opções com e sem carne</li>
                </ul>
                <a className={styles.darkButton} href={contactHref} target={contactTarget} rel="noreferrer">Provar hoje <ArrowIcon /></a>
              </div>
            </section>

            <section className={styles.chefSection}>
              <div className={styles.chefCopy}>
                <p className={styles.eyebrow}><span /> Dietro ogni piatto</p>
                <h2>Chef<br />Nicolaj Mellace.</h2>
                <p className={styles.chefLead}>Cozinhar é a nossa forma de receber você à mesa.</p>
                <p>
                  Na cozinha da PRANZO, cada receita começa com ingredientes bem escolhidos, respeito ao tempo de preparo e o cuidado que transforma uma refeição simples em um momento especial.
                </p>
                <div className={styles.chefCredential}>
                  <span className={styles.credentialMark}>N</span>
                  <span><small>Formação profissional</small><strong>PiuItalia SRL · Pesaro–Perugia, Italia</strong></span>
                </div>
                <span className={styles.chefSignature}>Lo chef · PRANZO</span>
              </div>

              <div className={styles.chefPortrait}>
                <div className={styles.chefImageWrap}>
                  <Image
                    src="/chef-nicolaj-mellace.png"
                    alt="Chef Nicolaj Mellace em uma cozinha italiana"
                    fill
                    sizes="(max-width: 800px) 92vw, 46vw"
                    className={styles.chefImage}
                  />
                </div>
                <div className={styles.chefSeal} aria-hidden="true">
                  <strong>NICOLAJ</strong>
                  <span>FATTO CON AMORE</span>
                </div>
              </div>
            </section>

            <section id="como-funciona" className={styles.stepsSection}>
              <div className={styles.centerHeading}>
                <p className={styles.eyebrow}><span /> Come ordinare</p>
                <h2>Seu pranzo em três passos.</h2>
              </div>
              <div className={styles.stepsGrid}>
                <article><span>01</span><h3>Veja o cardápio</h3><p>Entre em contato e receba as opções disponíveis no dia.</p></article>
                <article><span>02</span><h3>Escolha seu prato</h3><p>Conte para a gente o seu favorito e confirme os detalhes do pedido.</p></article>
                <article><span>03</span><h3>Receba e aproveite</h3><p>Sua marmita chega pronta para transformar a pausa do almoço.</p></article>
              </div>
            </section>

            <section className={styles.finalCta}>
              <div>
                <p>Buon appetito</p>
                <h2>Hoje a Itália chega<br />à sua mesa.</h2>
              </div>
              <a href="#cardapio">Ver cardápio <ArrowIcon /></a>
            </section>
          </>
        )}

        <footer className={styles.footer}>
          <div className={styles.brand}>
            {restaurant.logoUrl ? (
              <span className={styles.brandMark} style={{ overflow: "hidden" }}>
                <Image src={restaurant.logoUrl} alt="" width={42} height={42} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
              </span>
            ) : (
              <span className={styles.brandMark}><LeafMark /></span>
            )}
            <span><strong>{restaurant.name.toUpperCase()}</strong>{ehPranzo && <small>cucina italiana</small>}</span>
          </div>
          {ehPranzo && <p>Comida de verdade, feita com carinho.</p>}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          {ehPranzo && (
            <>
              <Link href="/loja/pranzo/termos">Termos de Uso</Link>
              <Link href="/loja/pranzo/privacidade">Privacidade</Link>
            </>
          )}
          <a href="#cardapio">{t.voltarTopo}</a>
        </footer>
      </main>
      <CartBar
        zonasEntrega={zonasEntrega}
        whatsappRetiradaHref={whatsappRetiradaHref}
        restaurantSlug={restaurant.slug}
        exigirCpf={exigirCpf}
        aceitaPix={aceitaPix}
        locale={locale}
      />
    </CartProvider>
  );
}

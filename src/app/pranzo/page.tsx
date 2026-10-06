import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./pranzo.module.css";
import { CartProvider } from "@/components/pranzo/CartProvider";
import { AddToCartButton } from "@/components/pranzo/AddToCartButton";
import { CartBar } from "@/components/pranzo/CartBar";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getPranzoOwnerId } from "@/lib/pranzo";

export const metadata: Metadata = {
  title: "Pranzo — comida de verdade, pronta para você",
  description:
    "Marmitas artesanais com sabor de comida feita em casa. Veja o cardápio e faça seu pedido.",
};

// A disponibilidade depende do dia da semana e de toggles do admin —
// não pode ser congelada numa página estática gerada no build.
export const dynamic = "force-dynamic";

const pratos = [
  {
    productId: "01377895-5e99-44f6-b043-a07d88ae8f71",
    nome: "Parmigiana da casa",
    descricao: "Berinjela gratinada, arroz soltinho, feijão e salada fresca.",
    imagem: "/cardapio/parmigiana-di-melanzane.jpg",
    destaque: "Mais pedido",
    preco: 8.5,
  },
  {
    productId: "166eec79-9a12-4d7a-a007-4ad7e7775010",
    nome: "Frango à pizzaiola",
    descricao: "Frango suculento ao molho de tomate, arroz e batatas douradas.",
    imagem: "/cardapio/pollo-alla-pizzaiola.jpg",
    destaque: "Favorito da casa",
    preco: 9.5,
  },
  {
    productId: "58caa404-15d6-4e9f-a0a7-edb57aeec347",
    nome: "Almôndegas ao molho",
    descricao: "Almôndegas macias ao molho artesanal, arroz e feijão.",
    imagem: "/cardapio/polpette-al-sugo.jpg",
    destaque: "Receita de família",
    preco: 11.5,
  },
  {
    productId: "4a6f63c7-7a16-4f93-b642-ecfe714f20c6",
    nome: "Spezzatino",
    descricao: "Ensopado rústico e macio, servido com arroz e polenta cremosa.",
    imagem: "/cardapio/spezzatino.jpg",
    destaque: "Especial italiano",
    preco: 10.0,
  },
  {
    productId: "cc9c5ee8-73c2-43ff-815a-022817ef0a6d",
    nome: "Frango à caçadora",
    descricao: "Frango cozido lentamente em molho encorpado, com arroz e feijão.",
    imagem: "/cardapio/pollo-alla-cacciatora.jpg",
    destaque: "Bem servido",
    preco: 8.5,
  },
  {
    productId: "a0c0b21b-f3ba-402b-b7f6-6191d5cfdbdd",
    nome: "Polpette de lentilha",
    descricao: "Almôndegas de lentilha e legumes, uma opção leve e cheia de sabor.",
    imagem: "/cardapio/polpette-di-lenticchie.jpg",
    destaque: "Sem carne",
    preco: 7.0,
  },
  {
    productId: "e0293f4d-55cf-4fc3-982d-1fe1abf087fd",
    nome: "Tagliatelle al ragù",
    descricao: "Massa envolvida em ragù cozido lentamente, acompanhada de salada fresca.",
    imagem: "/cardapio/pasta-al-ragu.jpg",
    destaque: "Clássico italiano",
    preco: 8.0,
  },
  {
    productId: "058053d5-d059-419e-90d0-6e2e1fbd3a71",
    nome: "Salsiccia ao molho",
    descricao: "Linguiça ao molho de tomate, servida com polenta, arroz e feijão.",
    imagem: "/cardapio/salsiccia-al-sugo.jpg",
    destaque: "Sabor da trattoria",
    preco: 10.5,
  },
  {
    productId: "3ce28e86-3da2-4404-a8de-d5249e812723",
    nome: "Cotoletta de frango",
    descricao: "Frango empanado, dourado e crocante, com acompanhamentos da casa.",
    imagem: "/cardapio/cotoletta-di-pollo.jpg",
    destaque: "Crocante",
    preco: 9.5,
  },
];

const sobremesas = [
  {
    productId: "a10d1590-4d48-462b-8a82-2f4e8d1b8fe6",
    nome: "Tiramisù",
    descricao: "O clássico italiano em camadas cremosas, com café e cacau.",
    imagem: "/cardapio/tiramisu.jpg",
    destaque: "Il dolce italiano",
    preco: 7.0,
  },
  {
    productId: "f988f659-573d-4de5-af52-b0f5f7a3ab25",
    nome: "Panna cotta",
    descricao: "Delicada, cremosa e finalizada com uma cobertura irresistível.",
    imagem: "/cardapio/panna-cotta.jpg",
    destaque: "Leve e cremosa",
    preco: 5.0,
  },
];

const bebidas = [
  { productId: "220adf8c-9ed3-46a4-8b72-4dd99b021873", nome: "Água Mineral (Sem Gás)", preco: 4.0 },
  { productId: "7fb55954-3d8c-4061-8c95-8d9dfe8af0ac", nome: "Coca-Cola (Lata)", preco: 7.0 },
  { productId: "e6938c88-308f-47b2-834c-ca1f5d690185", nome: "Guaraná Antarctica (Lata)", preco: 6.5 },
  { productId: "23cbaae1-109f-444a-bd2f-eeb660dac5fe", nome: "Guaraná Mineiro (Lata)", preco: 6.0 },
  { productId: "4e179b13-87dd-41c7-90fb-013e38700acb", nome: "H2OH! Limão (500ml)", preco: 7.5 },
  { productId: "09531674-9926-4847-a720-6dcae6ad9399", nome: "Suco Prats Laranja (330ml)", preco: 9.0 },
];

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

type Disponibilidade = { preco: number; ativo: boolean; visivelSite: boolean; diasSite: number[] | null };

async function buscarZonasEntrega(): Promise<
  { id: string; bairro: string; taxa: number; pedidoMinimoGratis: number | null }[]
> {
  const admin = getSupabaseAdmin();
  const ownerId = await getPranzoOwnerId(admin);
  if (!ownerId) return [];

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

async function buscarDisponibilidade(): Promise<Map<string, Disponibilidade> | null> {
  const admin = getSupabaseAdmin();
  const ownerId = await getPranzoOwnerId(admin);
  if (!ownerId) return null;

  const todosIds = [...pratos, ...sobremesas, ...bebidas].map((item) => item.productId);
  const { data: produtosDb } = await admin
    .from("del_products")
    .select("id, preco, ativo, visivel_site, dias_site")
    .eq("owner_id", ownerId)
    .in("id", todosIds);

  return new Map(
    (produtosDb ?? []).map((p) => [
      p.id,
      { preco: Number(p.preco), ativo: p.ativo, visivelSite: p.visivel_site !== false, diasSite: p.dias_site },
    ]),
  );
}

function disponivelHoje(disponibilidade: Map<string, Disponibilidade> | null, productId: string): boolean {
  if (!disponibilidade) return true;
  const p = disponibilidade.get(productId);
  if (!p || !p.ativo || !p.visivelSite) return false;
  if (p.diasSite && p.diasSite.length > 0) {
    const hoje = new Date().getDay();
    if (!p.diasSite.includes(hoje)) return false;
  }
  return true;
}

function precoAtual(disponibilidade: Map<string, Disponibilidade> | null, item: { productId: string; preco: number }): number {
  return disponibilidade?.get(item.productId)?.preco ?? item.preco;
}

const whatsappNumber = (process.env.NEXT_PUBLIC_RESTAURANTE_WHATSAPP ?? "").replace(/\D/g, "");
const contactEmail = "viverevivi37@gmail.com";
const orderMessage = "Olá! Quero conhecer o cardápio de hoje e fazer um pedido.";
const whatsappMessage = encodeURIComponent(orderMessage);
const emailSubject = encodeURIComponent("Pedido de marmita — Pranzo");
const emailBody = encodeURIComponent(orderMessage);
const contactHref = whatsappNumber
  ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`
  : `mailto:${contactEmail}?subject=${emailSubject}&body=${emailBody}`;
const contactTarget = whatsappNumber ? "_blank" : undefined;

const retiradaMessage = encodeURIComponent(
  "Olá! Meu bairro não está na área de entrega do site — gostaria de fazer um pedido para retirar no local.",
);
const whatsappRetiradaHref = whatsappNumber
  ? `https://wa.me/${whatsappNumber}?text=${retiradaMessage}`
  : `mailto:${contactEmail}?subject=${encodeURIComponent("Pedido para retirada — Pranzo")}&body=${retiradaMessage}`;

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

export default async function PranzoPage() {
  const [disponibilidade, zonasEntrega] = await Promise.all([buscarDisponibilidade(), buscarZonasEntrega()]);
  const pratosDisponiveis = pratos.filter((p) => disponivelHoje(disponibilidade, p.productId));
  const sobremesasDisponiveis = sobremesas.filter((s) => disponivelHoje(disponibilidade, s.productId));
  const bebidasDisponiveis = bebidas.filter((b) => disponivelHoje(disponibilidade, b.productId));

  return (
    <CartProvider>
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/pranzo" className={styles.brand} aria-label="Pranzo, início">
          <span className={styles.brandMark}><LeafMark /></span>
          <span>
            <strong>PRANZO</strong>
            <small>cucina italiana</small>
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Navegação principal">
          <a href="#cardapio">Cardápio</a>
          <a href="#como-funciona">Como pedir</a>
          <a href="#sobre">Nossa cozinha</a>
        </nav>

        <a className={styles.headerCta} href={contactHref} target={contactTarget} rel="noreferrer">
          Fazer pedido
        </a>
      </header>

      <div className={styles.tricolore} aria-hidden="true"><span /><span /><span /></div>

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

      <section className={styles.marquee} aria-label="Nossos diferenciais">
        <span>Sapore italiano</span><i>✦</i><span>Ingredientes frescos</span><i>✦</i><span>Porções generosas</span><i>✦</i><span>Ricette di famiglia</span>
      </section>

      <section id="cardapio" className={styles.menuSection}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}><span /> Il nostro menù</p>
            <h2>Sabores da Itália.</h2>
          </div>
          <p>Nosso cardápio muda ao longo da semana para você sempre ter um almoço especial esperando.</p>
        </div>

        <div className={styles.menuGrid}>
          {pratosDisponiveis.map((prato, index) => (
            <article className={styles.foodCard} key={prato.nome}>
              <div className={styles.foodImageWrap}>
                <Image src={prato.imagem} alt={prato.nome} fill sizes="(max-width: 700px) 92vw, (max-width: 1100px) 45vw, 30vw" className={styles.foodImage} />
                <span className={styles.foodNumber}>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className={styles.foodCardBody}>
                <span className={styles.foodBadge}>{prato.destaque}</span>
                <h3>{prato.nome}</h3>
                <p>{prato.descricao}</p>
                <p className={styles.foodPrice}>{formatReal(precoAtual(disponibilidade, prato))}</p>
                <AddToCartButton productId={prato.productId} nome={prato.nome} preco={precoAtual(disponibilidade, prato)} className={styles.foodCardCta}>
                  Adicionar à sacola <ArrowIcon />
                </AddToCartButton>
              </div>
            </article>
          ))}
          {pratosDisponiveis.length === 0 && (
            <p className={styles.menuEmpty}>Nenhum prato disponível hoje — volte mais tarde ou confira nossas bebidas e sobremesas.</p>
          )}
        </div>

        <div className={styles.dessertHeading}>
          <p className={styles.eyebrow}><span /> Per finire in dolcezza</p>
          <h2>I nostri dolci.</h2>
          <p>Porque todo bom almoço italiano merece terminar com um doce especial.</p>
        </div>

        <div className={styles.dessertGrid}>
          {sobremesasDisponiveis.map((sobremesa, index) => (
            <article className={`${styles.foodCard} ${styles.dessertCard}`} key={sobremesa.nome}>
              <div className={styles.foodImageWrap}>
                <Image src={sobremesa.imagem} alt={sobremesa.nome} fill sizes="(max-width: 700px) 92vw, 45vw" className={styles.foodImage} />
                <span className={styles.foodNumber}>D{index + 1}</span>
              </div>
              <div className={styles.foodCardBody}>
                <span className={styles.foodBadge}>{sobremesa.destaque}</span>
                <h3>{sobremesa.nome}</h3>
                <p>{sobremesa.descricao}</p>
                <p className={styles.foodPrice}>{formatReal(precoAtual(disponibilidade, sobremesa))}</p>
                <AddToCartButton productId={sobremesa.productId} nome={sobremesa.nome} preco={precoAtual(disponibilidade, sobremesa)} className={styles.foodCardCta}>
                  Adicionar à sacola <ArrowIcon />
                </AddToCartButton>
              </div>
            </article>
          ))}
        </div>

        {bebidasDisponiveis.length > 0 && (
          <>
            <div className={styles.dessertHeading}>
              <p className={styles.eyebrow}><span /> Da bere</p>
              <h2>Bebidas.</h2>
              <p>Para acompanhar o seu pranzo.</p>
            </div>

            <div className={styles.drinkGrid}>
              {bebidasDisponiveis.map((bebida) => (
                <div className={styles.drinkCard} key={bebida.nome}>
                  <span className={styles.drinkName}>{bebida.nome}</span>
                  <span className={styles.drinkPrice}>{formatReal(precoAtual(disponibilidade, bebida))}</span>
                  <AddToCartButton productId={bebida.productId} nome={bebida.nome} preco={precoAtual(disponibilidade, bebida)} className={styles.drinkCta}>
                    Adicionar <ArrowIcon />
                  </AddToCartButton>
                </div>
              ))}
            </div>
          </>
        )}

        <div className={styles.menuCta}>
          <p>Quer saber quais pratos estão saindo hoje?</p>
          <a href={contactHref} target={contactTarget} rel="noreferrer">Receber cardápio do dia <ArrowIcon /></a>
        </div>
      </section>

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

      <footer className={styles.footer}>
        <div className={styles.brand}>
          <span className={styles.brandMark}><LeafMark /></span>
          <span><strong>PRANZO</strong><small>cucina italiana</small></span>
        </div>
        <p>Comida de verdade, feita com carinho.</p>
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        <a href="#cardapio">Voltar ao topo ↑</a>
      </footer>
    </main>
    <CartBar zonasEntrega={zonasEntrega} whatsappRetiradaHref={whatsappRetiradaHref} />
    </CartProvider>
  );
}

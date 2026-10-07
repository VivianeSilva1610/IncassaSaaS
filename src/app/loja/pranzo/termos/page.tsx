import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso — Pranzo",
};

const WHATSAPP_DISPLAY = "+55 34 99853227";
const WHATSAPP_HREF = "https://wa.me/553499853227";
const CONTACT_EMAIL = "viverevivi37@gmail.com";
const LAST_UPDATED = "7 de outubro de 2026";

export default function TermosPranzoPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-stone-700">
      <Link href="/loja/pranzo" className="text-sm text-amber-700 underline underline-offset-2">
        ← Voltar ao cardápio do Pranzo
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-stone-900">Termos de Uso — Pranzo</h1>
      <p className="mt-1 text-sm text-stone-400">Última atualização: {LAST_UPDATED}</p>
      <p className="mt-2 text-sm text-stone-500">
        Estes Termos de Uso regulam a compra de produtos através da loja online do Pranzo
        (incassa.eu/loja/pranzo), em Uberaba, Minas Gerais. Ao fazer um pedido, você concorda com
        estes termos.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-stone-900">1. Quem somos</h2>
          <p className="mt-2">
            O Pranzo é um negócio de comida italiana com entrega em Uberaba-MG, operado por
            Viviane Silva, atualmente em processo de formalização como MEI. Contato: WhatsApp{" "}
            <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" className="text-amber-700 underline underline-offset-2">
              {WHATSAPP_DISPLAY}
            </a>{" "}
            ou e-mail{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">2. Como funciona o pedido</h2>
          <p className="mt-2">
            O cardápio é exibido em incassa.eu/loja/pranzo. Você monta seu pedido no carrinho do
            site, informa nome, telefone, CPF/CNPJ e endereço de entrega, e paga via Pix. O pedido
            é confirmado assim que o pagamento é identificado.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">3. Preços e taxa de entrega</h2>
          <p className="mt-2">
            Os preços do cardápio incluem apenas os produtos. A taxa de entrega varia por bairro e
            pode ser gratuita a partir do valor mínimo de pedido indicado no site para cada zona de
            entrega. Fora do raio de entrega (acima de 30 km), não realizamos entrega, mas você
            pode combinar a retirada do pedido no local pelo WhatsApp.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">4. Pagamento</h2>
          <p className="mt-2">
            Aceitamos pagamento via Pix, processado pelo fornecedor externo Asaas. O CPF/CNPJ
            informado é exigido pela Asaas para gerar a cobrança. O Pranzo não recebe nem armazena
            dados de cartão de crédito ou débito.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">5. Prazo e entrega</h2>
          <p className="mt-2">
            O prazo estimado informado no momento do pedido pode variar por fatores como trânsito,
            clima ou volume de pedidos no momento. Não garantimos um horário exato de entrega.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">6. Cancelamento</h2>
          <p className="mt-2">
            Você pode cancelar o pedido, sem custo, enquanto ele ainda não entrou em preparo —
            basta avisar pelo WhatsApp. Depois que o preparo é iniciado, não é possível cancelar,
            já que se trata de alimento perecível preparado especialmente para o seu pedido. Por
            essa mesma razão, o direito de arrependimento do art. 49 do Código de Defesa do
            Consumidor deixa de ser aplicável a partir do início do preparo ou da entrega do
            pedido.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">7. Qualidade, alergias e reclamações</h2>
          <p className="mt-2">
            Se o seu pedido chegar errado, incompleto ou com algum problema de qualidade, avise
            pelo WhatsApp o quanto antes para que possamos resolver (reposição ou reembolso, total
            ou parcial, conforme o caso).
          </p>
          <p className="mt-2">
            Se você tiver alergias ou restrições alimentares, informe no campo de observações do
            pedido antes de finalizar a compra. Preparamos os alimentos em uma cozinha
            compartilhada e não garantimos ausência total de contaminação cruzada com outros
            ingredientes (como glúten, lactose, frutos do mar, oleaginosas ou outros alérgenos).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">8. Foro</h2>
          <p className="mt-2">
            Estes Termos são regidos pela lei brasileira. Fica eleito o foro da comarca de Uberaba,
            MG, para dirimir eventuais controvérsias, sem prejuízo do direito do consumidor de
            buscar o foro do seu próprio domicílio, quando aplicável.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">9. Alterações</h2>
          <p className="mt-2">
            Estes Termos podem ser atualizados. A versão mais recente está sempre disponível neste
            endereço.
          </p>
        </section>

        <p className="mt-4 text-xs text-stone-400">
          Para saber como tratamos seus dados pessoais, veja a nossa{" "}
          <Link href="/loja/pranzo/privacidade" className="text-amber-700 underline underline-offset-2">
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

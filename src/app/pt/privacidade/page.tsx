import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — Restaurante (rascunho) — INCASSA",
};

const SUPPORT_EMAIL = "viverevivi37@gmail.com";
const PEC_EMAIL = "supporto@pec.incassa.eu";
const LAST_UPDATED = "7 de outubro de 2026 (rascunho)";

export default function PrivacidadePtPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-stone-700">
      <Link href="/pt" className="text-sm text-amber-700 underline underline-offset-2">
        ← Voltar para a home
      </Link>

      <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Rascunho aguardando revisão jurídica.</strong> Este texto ainda não foi validado
        por um advogado e não deve ser considerado definitivo nem vinculante até nova indicação.
      </div>

      <h1 className="mt-6 text-2xl font-bold text-stone-900">
        Política de Privacidade — Plataforma para Restaurantes
      </h1>
      <p className="mt-1 text-sm text-stone-400">Última atualização: {LAST_UPDATED}</p>
      <p className="mt-2 text-sm text-stone-500">
        Esta política cobre a assinatura da plataforma de gestão para restaurantes da INCASSA,
        incluindo a Loja Online de cada restaurante e os pedidos dos respectivos Clientes Finais.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-stone-900">1. Controlador dos dados</h2>
          <p className="mt-2">
            O controlador dos seus dados pessoais é Viviane Silva, Itália. Para qualquer dúvida
            sobre esta política ou sobre o tratamento dos seus dados, você pode escrever para{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>{" "}
            ou por PEC (correio certificado italiano) para{" "}
            <a href={`mailto:${PEC_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {PEC_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">2. Dados coletados</h2>
          <p className="mt-2">Do Proprietário do Restaurante e dos Membros da Equipe, coletamos:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>E-mail e senha para acesso à conta</li>
            <li>Nome do restaurante, slug/endereço escolhido e eventual domínio personalizado</li>
            <li>Dados de cobrança e status da assinatura (gerenciados pela Stripe)</li>
            <li>
              Os dados que o Restaurante insere para seu próprio funcionamento: cardápio e preços,
              estoque, custos, mesas, dados de caixa e dados dos Membros da Equipe convidados
            </li>
          </ul>
          <p className="mt-2">
            Dos Clientes Finais que fazem um pedido pela Loja Online, coletamos por conta do
            Restaurante:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Nome e telefone</li>
            <li>Endereço de entrega e bairro/zona</li>
            <li>CPF/CNPJ, exigido pelo provedor de pagamento Pix para processar o pagamento</li>
            <li>Conteúdo do pedido (produtos, quantidades, observações, valor)</li>
          </ul>
          <p className="mt-2">
            Não recebemos nem armazenamos os dados completos do cartão de pagamento da assinatura:
            isso é feito inteiramente pela Stripe. Os pagamentos via Pix dos pedidos dos Clientes
            Finais são processados inteiramente pelo fornecedor externo Asaas.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">3. Finalidade e base legal</h2>
          <p className="mt-2">
            Tratamos os dados do Proprietário do Restaurante e dos Membros da Equipe para fornecer
            o acesso à Plataforma, processar o pagamento da assinatura e prestar suporte (base
            legal: execução de contrato), além de cumprir obrigações contábeis e fiscais previstas
            em lei (base legal: obrigação legal).
          </p>
          <p className="mt-2">
            Os dados dos Clientes Finais coletados pela Loja Online são tratados exclusivamente
            para permitir que o Restaurante administre e entregue o pedido, e para processar o
            respectivo pagamento. O Restaurante permanece controlador desses dados perante seus
            próprios Clientes Finais; a INCASSA atua como operadora por conta do Restaurante.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">4. Fornecedores e destinatários dos dados</h2>
          <p className="mt-2">Para fornecer o Serviço, contamos com os seguintes fornecedores, que atuam como operadores:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Stripe</strong> — processamento dos pagamentos da assinatura do Restaurante</li>
            <li><strong>Asaas</strong> — processamento dos pagamentos via Pix dos pedidos dos Clientes Finais (recebe nome, CPF/CNPJ e telefone do Cliente Final)</li>
            <li><strong>Supabase</strong> — hospedagem do banco de dados e autenticação das contas</li>
            <li><strong>Resend</strong> — envio dos e-mails transacionais</li>
            <li><strong>Vercel</strong> — hospedagem do site e roteamento dos domínios personalizados</li>
          </ul>
          <p className="mt-2">
            Alguns desses fornecedores podem tratar dados fora do Espaço Econômico Europeu, com
            base em garantias adequadas previstas em suas respectivas políticas (ex.: cláusulas
            contratuais padrão).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">5. Retenção dos dados</h2>
          <p className="mt-2">
            Mantemos os dados do Proprietário do Restaurante pelo tempo necessário para administrar
            a assinatura e, posteriormente, pelo período exigido pelas obrigações contábeis e
            fiscais aplicáveis. Os dados dos pedidos dos Clientes Finais são mantidos pelo tempo
            necessário para administrar o pedido e pelas obrigações contábeis e fiscais aplicáveis
            do Restaurante. Se o Proprietário do Restaurante excluir sua conta, os dados inseridos
            na Plataforma são excluídos conforme descrito no art. 18 dos Termos de Serviço.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">6. Seus direitos</h2>
          <p className="mt-2">
            Você tem direito de acessar seus dados, corrigi-los, solicitar sua exclusão, a
            limitação ou a oposição ao tratamento, e a portabilidade dos dados.
          </p>
          <p className="mt-2">
            Se você é o Proprietário do Restaurante ou um Membro da Equipe, pode exercer esses
            direitos escrevendo para{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>
            . Se você é um Cliente Final e quer exercer esses direitos sobre os dados do seu
            pedido, pode contatar diretamente o Restaurante onde fez o pedido, ou escrever para o
            endereço acima, que encaminhará a solicitação ao Restaurante responsável. Você também
            tem direito de apresentar reclamação à autoridade italiana de proteção de dados
            (www.garanteprivacy.it) ou à autoridade de proteção de dados do seu país (no Brasil, a
            ANPD).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">7. Cookies</h2>
          <p className="mt-2">
            Este site não usa cookies de perfilamento, análise ou marketing. Usamos apenas cookies
            técnicos necessários para manter sua sessão de acesso à conta. O pagamento da
            assinatura ocorre em uma página hospedada pela Stripe (domínio stripe.com); o
            pagamento dos pedidos dos Clientes Finais ocorre via Pix gerado pela Asaas.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">8. Alterações desta política</h2>
          <p className="mt-2">
            Esta política pode ser atualizada ao longo do tempo. A versão mais recente está sempre
            disponível neste endereço.
          </p>
        </section>
      </div>
    </main>
  );
}

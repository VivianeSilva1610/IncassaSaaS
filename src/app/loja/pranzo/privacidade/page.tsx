import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — Pranzo",
};

const WHATSAPP_DISPLAY = "+55 34 99853227";
const WHATSAPP_HREF = "https://wa.me/553499853227";
const CONTACT_EMAIL = "viverevivi37@gmail.com";
const LAST_UPDATED = "7 de outubro de 2026";

export default function PrivacidadePranzoPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-stone-700">
      <Link href="/loja/pranzo" className="text-sm text-amber-700 underline underline-offset-2">
        ← Voltar ao cardápio do Pranzo
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-stone-900">Política de Privacidade — Pranzo</h1>
      <p className="mt-1 text-sm text-stone-400">Última atualização: {LAST_UPDATED}</p>
      <p className="mt-2 text-sm text-stone-500">
        Esta política explica quais dados coletamos quando você faz um pedido na loja online do
        Pranzo e o que fazemos com eles, em conformidade com a Lei Geral de Proteção de Dados
        (LGPD).
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-stone-900">1. Controlador dos dados</h2>
          <p className="mt-2">
            O Pranzo é operado por Viviane Silva, em Uberaba, MG. Para qualquer dúvida sobre esta
            política ou sobre seus dados, escreva pelo WhatsApp{" "}
            <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" className="text-amber-700 underline underline-offset-2">
              {WHATSAPP_DISPLAY}
            </a>{" "}
            ou pelo e-mail{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">2. Dados que coletamos</h2>
          <p className="mt-2">Quando você faz um pedido, coletamos:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Nome e telefone</li>
            <li>CPF ou CNPJ, exigido pelo provedor de pagamento Pix para processar a cobrança</li>
            <li>Endereço de entrega e bairro</li>
            <li>Conteúdo do pedido: produtos, quantidades, observações e valor</li>
          </ul>
          <p className="mt-2">
            Não recebemos nem armazenamos dados de cartão de crédito ou débito — hoje aceitamos
            apenas Pix, processado inteiramente pelo fornecedor externo Asaas.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">3. Para que usamos seus dados</h2>
          <p className="mt-2">
            Usamos seus dados exclusivamente para processar, preparar e entregar o seu pedido, e
            para gerar a cobrança do pagamento via Pix (base legal: execução de contrato, art. 7º,
            V, da LGPD). Não usamos seus dados para enviar marketing ou publicidade não
            solicitada.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">4. Com quem compartilhamos</h2>
          <p className="mt-2">
            Compartilhamos seu nome, CPF/CNPJ e telefone com a <strong>Asaas</strong>, responsável
            por processar o pagamento via Pix. Seu endereço de entrega é usado internamente pela
            equipe do Pranzo para a entrega do pedido. Não vendemos nem compartilhamos seus dados
            com terceiros para qualquer outra finalidade.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">5. Por quanto tempo guardamos seus dados</h2>
          <p className="mt-2">
            Guardamos os dados do seu pedido pelo tempo necessário para resolver eventuais
            problemas com a entrega ou o pagamento, e pelo prazo exigido por obrigações contábeis e
            fiscais aplicáveis.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">6. Seus direitos</h2>
          <p className="mt-2">
            Você tem direito a confirmar a existência de tratamento, acessar, corrigir ou solicitar
            a exclusão dos seus dados, e a revogar o consentimento quando aplicável (arts. 17–22 da
            LGPD). Para exercer esses direitos, escreva pelo WhatsApp ou e-mail indicados no item
            1. Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados
            (ANPD).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">7. Alterações a esta política</h2>
          <p className="mt-2">
            Esta política pode ser atualizada com o tempo. A versão mais recente está sempre
            disponível neste endereço.
          </p>
        </section>

        <p className="mt-4 text-xs text-stone-400">
          Veja também os{" "}
          <Link href="/loja/pranzo/termos" className="text-amber-700 underline underline-offset-2">
            Termos de Uso
          </Link>{" "}
          do Pranzo.
        </p>
      </div>
    </main>
  );
}

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos e Condições — Restaurante — INCASSA",
};

const SUPPORT_EMAIL = "viverevivi37@gmail.com";
const PEC_EMAIL = "supporto@pec.incassa.eu";
const LAST_UPDATED = "7 de outubro de 2026";

export default function TermosPtPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-stone-700">
      <Link href="/pt" className="text-sm text-amber-700 underline underline-offset-2">
        ← Voltar para a home
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-stone-900">
        Termos e Condições de Serviço — Plataforma para Restaurantes
      </h1>
      <p className="mt-1 text-sm text-stone-400">Última atualização: {LAST_UPDATED}</p>
      <p className="mt-2 text-sm text-stone-500">
        Estes Termos e Condições (&quot;Termos&quot;) regulam o acesso e o uso da plataforma de
        gestão para restaurantes fornecida pela INCASSA (&quot;Plataforma&quot; ou
        &quot;Serviço&quot;), disponível em incassa.eu e nos subdomínios ou domínios
        personalizados de cada restaurante.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-stone-900">1. Responsável pelo Serviço</h2>
          <p className="mt-2">
            O Serviço é fornecido por Viviane Silva, pessoa física, com sede em Catanzaro, Itália
            (&quot;INCASSA&quot;, &quot;Fornecedor&quot; ou &quot;Responsável&quot;).
          </p>
          <p className="mt-2">
            E-mail:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>{" "}
            — PEC (correio certificado italiano):{" "}
            <a href={`mailto:${PEC_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {PEC_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">2. Definições</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>&quot;Plataforma&quot;</strong> é o software multi-tenant de gestão para
              restaurantes fornecido pela INCASSA.
            </li>
            <li>
              <strong>&quot;Restaurante&quot;</strong> é o estabelecimento que assina o Serviço e
              cria seu próprio espaço (&quot;tenant&quot;) na Plataforma.
            </li>
            <li>
              <strong>&quot;Proprietário do Restaurante&quot;</strong> é a pessoa física ou
              jurídica que cria a Conta inicial do Restaurante e figura como sua proprietária
              (&quot;owner&quot;).
            </li>
            <li>
              <strong>&quot;Membro da Equipe&quot;</strong> são as pessoas convidadas pelo
              Proprietário do Restaurante ou por um Gerente para acessar a Plataforma com
              permissões específicas.
            </li>
            <li>
              <strong>&quot;Gerente&quot;</strong> é um Membro da Equipe a quem foram concedidas
              permissões de gestão (por exemplo, editar ou excluir cadastros e conceder o papel a
              outros Membros).
            </li>
            <li>
              <strong>&quot;Cliente Final&quot;</strong> é a pessoa que faz um pedido na loja
              online do Restaurante, sem criar uma Conta na Plataforma.
            </li>
            <li>
              <strong>&quot;Loja Online&quot;</strong> é a página pública do Restaurante
              (subdomínio incassa.eu ou domínio personalizado) onde os Clientes Finais podem
              consultar o cardápio e fazer pedidos.
            </li>
            <li>
              <strong>&quot;Assinatura&quot;</strong> é o plano pago que dá acesso às
              funcionalidades da Plataforma reservadas ao Restaurante.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">3. Objeto do Serviço</h2>
          <p className="mt-2">
            A Plataforma é uma ferramenta digital de gestão operacional para restaurantes.
            Dependendo do plano e das funcionalidades ativadas, pode incluir, a título
            exemplificativo: gestão de cardápio e catálogo de produtos; gestão de pedidos e
            comandas; organização da cozinha; controle de estoque; gestão de mesas; controle de
            custos; registro de caixa; gestão de equipe com permissões diferenciadas; uma loja
            online pública com possibilidade de pedido e pagamento pelos Clientes Finais; um
            módulo relativo a documentos fiscais (ver art. 11); e, quando ativada pelo
            Proprietário do Restaurante, a associação de um domínio personalizado.
          </p>
          <p className="mt-2">
            A INCASSA é uma ferramenta organizacional e de gestão. A INCASSA não é um banco, uma
            instituição de pagamento, um intermediário financeiro, um escritório de advocacia nem
            um contador, e não presta consultoria jurídica, fiscal, contábil ou financeira.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">4. Cadastro, Conta e papéis</h2>
          <p className="mt-2">
            Para ativar um Restaurante na Plataforma, o Proprietário do Restaurante deve criar uma
            Conta fornecendo informações corretas, completas e atualizadas, incluindo o nome do
            Restaurante e o endereço (&quot;slug&quot;) escolhido para seu espaço.
          </p>
          <p className="mt-2">
            O Proprietário do Restaurante pode convidar Membros da Equipe e conceder a um ou mais
            deles o papel de Gerente. O Proprietário do Restaurante é responsável pelas ações dos
            Membros da Equipe convidados, dentro dos limites das permissões efetivamente
            concedidas.
          </p>
          <p className="mt-2">
            As credenciais de acesso são pessoais e não devem ser cedidas a terceiros. O usuário
            deve informar prontamente a INCASSA em caso de acesso não autorizado ou suspeita de
            comprometimento da Conta.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">5. Domínio e identidade do Restaurante</h2>
          <p className="mt-2">
            Cada Restaurante tem um endereço público no formato incassa.eu/loja/[slug]. Quando
            disponível e ativada pelo Proprietário do Restaurante, a Plataforma permite associar um
            domínio personalizado de propriedade do Restaurante, mediante verificação técnica do
            controle sobre esse domínio. A gestão, a renovação e os custos do domínio
            personalizado ficam a cargo e sob responsabilidade do Proprietário do Restaurante.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">6. Assinatura e preços</h2>
          <p className="mt-2">
            O acesso às funcionalidades da Plataforma reservadas ao Restaurante depende da
            assinatura de um plano pago. Preço, periodicidade, funcionalidades incluídas e
            condições econômicas aplicáveis são informadas claramente antes da conclusão da
            compra.
          </p>
          <p className="mt-2">
            Quando previsto, a Assinatura pode incluir um período de teste gratuito, com a duração
            indicada no momento da ativação (atualmente 7 dias), ao final do qual, salvo
            cancelamento, será cobrado automaticamente o preço da Assinatura no método de pagamento
            fornecido.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">7. Pagamentos da Assinatura</h2>
          <p className="mt-2">
            Os pagamentos da Assinatura são processados pelo fornecedor externo Stripe. A INCASSA
            não armazena diretamente os dados completos do cartão de pagamento. Em caso de
            pagamento recusado, vencido ou não concluído, a INCASSA poderá solicitar a atualização
            do método de pagamento e, após comunicação adequada quando exigida, limitar ou
            suspender o acesso às funcionalidades pagas.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">8. Pagamentos dos pedidos dos Clientes Finais</h2>
          <p className="mt-2">
            Quando o Restaurante ativar a Loja Online, os pedidos dos Clientes Finais podem ser
            pagos por um ou mais fornecedores externos de pagamento habilitados pela Plataforma
            (por exemplo Pix via Asaas no Brasil, ou outros métodos disponíveis conforme o país e
            as configurações escolhidas pelo Restaurante). A INCASSA não é parte do contrato de
            venda entre o Restaurante e o Cliente Final, não custodia os valores relativos a esses
            pagamentos e não garante o resultado, o recebimento ou a liquidação do pagamento. O
            Restaurante é o único responsável, perante seus Clientes Finais, pela entrega dos
            pedidos, pela qualidade dos produtos e pela eventual gestão de reembolsos ou reclamações
            relacionadas aos pedidos.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">
            9. Duração, renovação e cancelamento da Assinatura
          </h2>
          <p className="mt-2">
            Quando a Assinatura prever renovação automática, ela será renovada de acordo com a
            periodicidade indicada no checkout, salvo cancelamento feito antes da renovação, pelas
            funcionalidades disponíveis na Conta ou pelos demais canais indicados pela INCASSA.
          </p>
          <p className="mt-2">
            Salvo indicação diferente ou direito irrenunciável previsto em lei, o cancelamento
            impede as renovações seguintes, mas não gera automaticamente o reembolso do período já
            pago. O cancelamento da Assinatura não se confunde com o exercício do direito legal de
            arrependimento, quando aplicável (ver art. 10).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">10. Direito de arrependimento do Consumidor</h2>
          <p className="mt-2">
            <strong>10.1 Prazo de 14 dias.</strong> Caso o Proprietário do Restaurante se qualifique
            como Consumidor, nos contratos celebrados a distância ele dispõe, salvo as exceções
            previstas em lei, de 14 dias para se arrepender do contrato sem precisar apresentar
            nenhuma justificativa, nos termos dos artigos 52 e seguintes do Código do Consumo
            italiano — a lei aplicável a este contrato, conforme o art. 24.
          </p>
          <p className="mt-2">
            <strong>10.2 Início do Serviço durante o prazo de arrependimento.</strong> Caso o
            Consumidor queira usar a Plataforma imediatamente, inclusive durante um período de teste
            gratuito, antes do fim do prazo de arrependimento, ele poderá solicitar expressamente
            que a execução do Serviço comece durante esse prazo. Nos casos previstos em lei, se o
            Consumidor exercer o arrependimento após ter solicitado expressamente o início da
            prestação, ele poderá ser obrigado a pagar um valor proporcional ao que foi fornecido
            até o momento do arrependimento.
          </p>
          <p className="mt-2">
            <strong>10.3 Como exercer o arrependimento.</strong> O Consumidor pode comunicar sua
            decisão de se arrepender por meio de declaração explícita enviada para{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>
            , indicando ao menos os dados necessários para identificar a Conta e o Restaurante. A
            INCASSA enviará, sem demora indevida, uma confirmação por meio durável (e-mail) contendo
            as informações exigidas por lei.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">
            11. Módulo fiscal — situação atual e limites
          </h2>
          <p className="mt-2">
            A Plataforma pode incluir um módulo relacionado a documentos fiscais (por exemplo,
            classificação fiscal de produtos, rascunhos de documentos ou, no futuro, emissão de
            documentos como a NFC-e brasileira). <strong>Até que a INCASSA comunique
            expressamente o contrário</strong>, essas funcionalidades podem operar em modo simulado
            ou de teste e não constituem emissão de documentos fiscais válidos, não substituem as
            obrigações fiscais do Restaurante perante as autoridades competentes, e não substituem
            o trabalho de um contador ou consultor fiscal habilitado.
          </p>
          <p className="mt-2">
            O Restaurante permanece o único responsável pelo cumprimento de suas obrigações
            fiscais, tributárias, contábeis e de emissão de documentos de acordo com a legislação
            do seu país, inclusive quando usa ferramentas ou automações disponibilizadas pela
            Plataforma. A INCASSA não se responsabiliza pelo cumprimento fiscal e tributário do
            Restaurante perante as autoridades competentes.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">
            12. Dados inseridos pelo Restaurante e pelos Clientes Finais
          </h2>
          <p className="mt-2">
            A INCASSA não verifica automaticamente a exatidão, a integridade ou a licitude dos
            dados inseridos pelo Restaurante ou coletados dos Clientes Finais pela Loja Online,
            salvo quando expressamente indicado para uma funcionalidade específica. O Restaurante é
            responsável por verificar que esses dados estejam corretos, atualizados e coletados em
            conformidade com a legislação aplicável. Isso inclui dados fiscais e tributários (por
            exemplo, regime, alíquotas e classificação fiscal) usados por funcionalidades da
            Plataforma que dependem dessas informações — a INCASSA não se responsabiliza pelas
            consequências de dados fiscais ou tributários incorretos informados pelo Restaurante.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">13. Uso permitido</h2>
          <p className="mt-2">
            O Proprietário do Restaurante e os Membros da Equipe se comprometem a não usar a
            Plataforma:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>para atividades ilícitas ou fraudulentas;</li>
            <li>para assediar, ameaçar ou enganar terceiros, incluindo os Clientes Finais;</li>
            <li>para inserir informações intencionalmente falsas, inclusive sobre produtos, preços ou pagamentos;</li>
            <li>para comprometer a segurança, a disponibilidade ou a integridade da Plataforma;</li>
            <li>para tentar acessos não autorizados a outros espaços tenant;</li>
            <li>
              para copiar, decompilar ou explorar indevidamente o software e a infraestrutura, além
              do permitido por lei;
            </li>
            <li>violando direitos de terceiros.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">14. Disponibilidade do Serviço</h2>
          <p className="mt-2">
            A INCASSA adota medidas razoáveis para garantir a continuidade e a segurança do
            Serviço. Ainda assim, podem ocorrer interrupções devidas a manutenção, atualizações,
            problemas técnicos, serviços de terceiros (incluindo Stripe, os fornecedores de
            pagamento habilitados pelo Restaurante, e provedores de DNS/hospedagem), casos de
            força maior ou necessidades de segurança.
          </p>
          <p className="mt-2">
            Nenhuma disposição destes Termos exclui ou limita direitos irrenunciáveis reconhecidos
            ao Consumidor.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">15. Alterações do Serviço</h2>
          <p className="mt-2">
            A INCASSA pode atualizar ou modificar funcionalidades da Plataforma por motivos
            técnicos, de segurança, regulatórios, operacionais ou de melhoria do produto. Quando
            uma alteração afetar significativamente um serviço já adquirido, serão respeitados os
            deveres de informação e os eventuais direitos do usuário previstos na legislação
            aplicável.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">16. Propriedade intelectual</h2>
          <p className="mt-2">
            Software, design, marcas, logotipos, textos, elementos gráficos, bancos de dados,
            documentação e outros conteúdos pertencentes à INCASSA são protegidos pelas normas
            aplicáveis de propriedade intelectual. A assinatura concede exclusivamente um direito
            pessoal, limitado, não exclusivo e intransferível de usar o Serviço de acordo com estes
            Termos.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">17. Dados do Restaurante e papéis no tratamento</h2>
          <p className="mt-2">
            O Restaurante mantém os direitos sobre os dados e conteúdos próprios inseridos na
            Plataforma (cardápio, preços, dados de cozinha/estoque) e permanece controlador dos
            dados pessoais dos próprios Clientes Finais coletados pela Loja Online (nome, telefone,
            endereço de entrega, documento fiscal quando exigido pelo pagamento). A INCASSA atua
            como operadora desses dados por conta do Restaurante, na medida necessária para
            fornecer o Serviço.
          </p>
          <p className="mt-2">
            O tratamento dos dados pessoais do Proprietário do Restaurante e dos Membros da Equipe
            é disciplinado pela{" "}
            <Link href="/pt/privacidade" className="text-amber-700 underline underline-offset-2">
              Política de Privacidade — Plataforma para Restaurantes
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">18. Exportação e exclusão dos dados</h2>
          <p className="mt-2">
            Quando tecnicamente disponível, o Restaurante poderá exportar seus próprios dados
            usando as funcionalidades oferecidas pela Plataforma. Em caso de encerramento da Conta,
            os dados serão tratados conforme previsto na Política de Privacidade, na legislação
            aplicável e em eventuais obrigações legais de retenção.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">19. Suspensão da Conta</h2>
          <p className="mt-2">
            A INCASSA poderá suspender ou limitar o acesso à Conta quando isso for razoavelmente
            necessário, em particular em caso de: violação grave destes Termos; uso fraudulento ou
            ilícito; risco à segurança da Plataforma, de outros tenants ou de outros usuários;
            falta de pagamento; ou obrigação imposta por lei ou por autoridade competente.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">20. Responsabilidade</h2>
          <p className="mt-2">
            A INCASSA fornece uma ferramenta tecnológica de apoio à gestão da atividade do
            Restaurante. A INCASSA não garante o recebimento dos pagamentos dos pedidos, a validade
            fiscal dos documentos gerados pelo módulo fiscal descrito no art. 11, nem o sucesso
            comercial do Restaurante.
          </p>
          <p className="mt-2">
            <strong>Exatidão dos dados inseridos.</strong> O Restaurante é o único responsável pela
            exatidão, integridade e atualização dos dados que insere ou coleta por meio do Serviço,
            incluindo preços, disponibilidade, dados fiscais e tributários e dados dos Clientes Finais. A INCASSA
            não verifica nem garante a correção desses dados.
          </p>
          <p className="mt-2">
            Perante os Proprietários do Restaurante que atuam no âmbito de sua atividade empresarial,
            e nos limites permitidos por lei, a INCASSA não responde por danos indiretos, perda de
            oportunidades comerciais, lucros cessantes ou consequências decorrentes de informações
            incorretas inseridas pelo usuário ou do uso do Serviço em violação a estes Termos.
          </p>
          <p className="mt-2">
            Nenhuma limitação ou exclusão prevista nestes Termos se aplica nos casos em que a
            responsabilidade não possa ser excluída ou limitada por lei, nem limita os direitos
            irrenunciáveis do Consumidor.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">21. Indenização — Proprietário do Restaurante</h2>
          <p className="mt-2">
            Nos limites permitidos por lei, o Proprietário do Restaurante que atua no âmbito de sua
            atividade empresarial se compromete a indenizar a INCASSA por reclamações de terceiros,
            incluindo dos Clientes Finais, decorrentes de uso ilícito do Serviço atribuível ao
            Restaurante, da inserção de dados que violem direitos de terceiros, da falta de entrega
            ou da qualidade dos pedidos, ou do descumprimento das próprias obrigações fiscais do
            Restaurante.
          </p>
          <p className="mt-2">
            Esta disposição não se aplica na medida em que o dano seja atribuível à INCASSA.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">22. Suporte</h2>
          <p className="mt-2">
            Pedidos de suporte podem ser enviados para{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">23. Alterações destes Termos</h2>
          <p className="mt-2">
            A INCASSA pode alterar estes Termos por motivos regulatórios, técnicos, de segurança ou
            por mudanças substanciais do Serviço. Quando exigido por lei ou quando a alteração
            afetar significativamente a relação contratual em andamento, o usuário será informado
            com antecedência razoável.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">24. Lei aplicável</h2>
          <p className="mt-2">
            Estes Termos são regidos pela lei italiana, independentemente do país em que o
            Restaurante ou seus Clientes Finais estejam estabelecidos ou residam. Para o
            Consumidor, permanecem válidas as disposições imperativas de proteção aplicáveis e
            qualquer foro irrenunciável previsto na legislação. Para usuários que atuam no âmbito de
            sua atividade empresarial, o foro competente é o de Catanzaro, salvo disposição
            irrenunciável diversa prevista em lei.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">25. Nulidade parcial</h2>
          <p className="mt-2">
            Caso alguma disposição destes Termos seja declarada inválida, ineficaz ou inaplicável,
            as demais disposições continuarão em vigor na medida permitida por lei.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">26. Contato</h2>
          <p className="mt-2">
            Para dúvidas sobre estes Termos: INCASSA — E-mail:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>{" "}
            — PEC:{" "}
            <a href={`mailto:${PEC_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {PEC_EMAIL}
            </a>{" "}
            — Sede: Catanzaro, Itália.
          </p>
        </section>

        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-base font-semibold text-stone-900">
            Aprovação específica nos termos dos arts. 1341 e 1342 do Código Civil italiano
          </h2>
          <p className="mt-2">
            Nos termos dos arts. 1341 e 1342 do Código Civil italiano (lei aplicável a este
            contrato), o usuário declara ter lido atentamente e aprovar especificamente as
            seguintes cláusulas: art. 9 (duração, renovação e cancelamento); art. 11 (módulo fiscal
            — situação atual e limites); art. 12 (dados inseridos pelo Restaurante e pelos Clientes
            Finais); art. 14 (disponibilidade do Serviço); art. 15 (alterações do Serviço); art. 19
            (suspensão da Conta); art. 20 (limitações de responsabilidade); art. 21 (indenização);
            art. 23 (alterações destes Termos); art. 24 (lei aplicável e foro competente).
          </p>
          <p className="mt-2 text-xs text-stone-500">
            Esta aprovação específica é solicitada separadamente no momento da criação da conta,
            quando aplicável.
          </p>
        </section>
      </div>
    </main>
  );
}

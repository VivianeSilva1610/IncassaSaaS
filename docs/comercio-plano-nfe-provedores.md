# Plano — emissão fiscal unificada (Restaurante + Comércio)

**Decisões de base (2026-10-14):**
1. **Motor principal: INCASSA Fiscal direto.** A primeira operação real será privada, limitada aos estabelecimentos da proprietária, usando certificado A1 próprio e comunicação direta com a SEFAZ. Não haverá API pública, revenda nem certificados de clientes terceiros nesta fase.
2. **Uma única camada fiscal para os dois sistemas.** O Restaurante e o Comércio usam a mesma interface de provedor e a mesma integração com cada provedor. Cada sistema só converte os próprios dados (pedido ou venda) para um documento fiscal comum.
3. **Focus NFe preservada como alternativa.** `focus_nfe` continua na interface, na lista de provedores e no plano de testes, mas não é dependência do motor direto nem requisito para avançar. Sua implementação e homologação poderão ocorrer futuramente.
4. **Nenhuma emissão real nesta etapa.** Tanto `incassa_direto` quanto `focus_nfe` permanecem indisponíveis até testes completos em homologação e liberação explícita para produção.

> Nada deste plano transmite documento real antes da fase de liberação. Tudo roda em homologação, com CNPJ e credencial de teste.
> O fluxo fiscal da **Itália** (`emitirIt.ts`, `fatturaIt.ts`) **não é alterado**. Ele só entra nos testes de regressão.
> **As notas e documentos fiscais de teste (simulados) do Restaurante, do Brasil e da Itália, nunca são apagados**: nenhuma migration, script ou refatoração desta frente faz DELETE ou TRUNCATE neles. O provedor "simulado" continua disponível nos dois países. (Pedido da Viviane, 2026-10-14.)
> O **Comércio só existe no Brasil**: ainda não está disponível na Itália, nem em beta, porque não tem tradução nem parte fiscal italiana. Este plano trata apenas da NFC-e/NF-e brasileira.

---

## Situação atual

| | Restaurante (BR) | Comércio |
|---|---|---|
| Dados da nota (endereço do emitente, IBGE, série, numeração, CFOP, alíquota, pagamento) | ✅ | ❌ |
| Fluxo de emissão em código (`emitir.ts` + interface `FiscalProvider`) | ✅ só NFC-e | ❌ só simulação em SQL |
| Cancelamento, estorno, links de XML/DANFE, emissão automática após pagamento | ✅ | ❌ |
| Revisão do contador, trilha de auditoria, trava de produção no banco | ❌ | ✅ |
| Idempotência | parcial (uma nota ativa por pedido) | ✅ chave única |
| NF-e modelo 55 | ❌ | rascunho previsto |
| Credencial do provedor | ❌ texto aberto (`provedor_api_key`) | não guarda |
| **Provedor real implementado** | **nenhum** | **nenhum** |

Os dois sistemas param no mesmo ponto: em [`src/lib/fiscal/nfce.ts`](../src/lib/fiscal/nfce.ts) só existem os provedores "não configurado" e "simulado", e a Focus, a PlugNotas e a eNotas são linhas comentadas.

---

## Arquitetura alvo

```
src/lib/fiscal/
  core/
    documento.ts        // DocumentoFiscal comum: modelo 55|65, ambiente, emitente, destinatário,
                        // itens (NCM, CFOP, CST/CSOSN, origem, unidade, alíquotas), pagamentos, totais, ref
    provedor.ts         // interface ProvedorFiscal + getProvedorFiscal(id, credencial, ambiente)
    status.ts           // enum interno + mapeamento único dos status do provedor
    credenciais.ts      // certificado A1/segredos cifrados, com versão da chave
    provedores-suportados.ts   // lista oficial mostrada aos clientes (movida de fiscal/comercio/)
    provedores/
      nao-configurado.ts
      simulado.ts
      incassa-direto.ts // assinatura XML e comunicação direta com a SEFAZ
      sefaz-mapper.ts   // DocumentoFiscal -> XML NF-e/NFC-e
      focus-nfe.ts      // alternativa futura: HTTP e reconciliação por ref
      focus-mapper.ts   // alternativa futura: DocumentoFiscal -> JSON Focus
  restaurante/
    mapper.ts           // del_orders + del_fiscal_config -> DocumentoFiscal
    emitir.ts           // fluxo atual do Restaurante, migrado para a interface nova
  comercio/
    mapper.ts           // payload_snapshot da venda + commerce_fiscal_settings -> DocumentoFiscal
    emitir.ts
  nfce.ts               // compatibilidade: reexporta/adapta a interface nova enquanto houver chamadas antigas
  emitirIt.ts, fatturaIt.ts   // Itália: intocados
```

**Interface `ProvedorFiscal`:**
- `testarConexao()`
- `emitir(doc)`
- `consultar(ref)`
- `cancelar(ref, justificativa)`
- `cartaCorrecao(ref, texto)`
- `inutilizar(modelo, serie, inicio, fim, justificativa)`

**Regras da camada comum:**
- `ref` única por documento: é o id do documento no INCASSA, e é ela que garante a idempotência.
- Timeout de 20 s.
- **Nunca reenviar sem antes consultar pela `ref`.**
- Payloads e respostas são gravados sanitizados: sem token e sem certificado.

---

## Andamento

| Fase | Situação |
|---|---|
| 0 Linha de base | ✅ 2026-10-14: 13 testes do fluxo BR do Restaurante (`tests/unit/fiscal/restaurante-emissao.test.ts`); credenciamento, certificado A1, validação contábil e coordenação ainda pendentes |
| 1 Camada comum | ✅ 2026-10-14: `src/lib/fiscal/core/` (documento, provedor, simulado, não configurado, lista de provedores) + `restaurante/mapper.ts`; `emitir.ts` migrado e `nfce.ts` removido; os 13 testes continuam passando, mais 6 testes da camada |
| 2 Banco | 🟡 migrations `0123` e `0124` preparadas; aguardam revisão/aplicação no Supabase |
| 3 Credenciais | 🟡 AES-256-GCM com isolamento por tenant implementado e testado; persistência/tela aguardam as migrations e o futuro certificado A1 |
| 7 Governança | ✅ decidida em 2026-10-14: a revisão do contador é **só aviso nos dois sistemas**. Migration `0122` testada em Postgres 16 local e **executada no Supabase em 2026-10-14**; telas ajustadas |
| 4–6, 8, 9 | não iniciadas; Fase 4 prioriza o motor direto e mantém Focus como 4B futura |

**Numeração de migrations:** a `0121` foi usada por outra frente (`0121_pranzo_acesso_gestor.sql`, já commitada) dentro da faixa reservada a esta. Ficou assim: `0122` revisão como aviso, `0123` credenciais compartilhadas, `0124` alterações de banco do Restaurante e do Comércio da Fase 2, juntas. Se precisar de mais, reservar `0125+` no documento de divisão antes de usar.

Diferenças em relação à arquitetura alvo, decididas na Fase 1:
- `src/lib/fiscal/emitir.ts` ficou no mesmo caminho, sem ir para `restaurante/emitir.ts`. Isso evita mexer nas importações de `restaurante/actions.ts` e dos webhooks Asaas/Stripe.
- `nfce.ts` foi removido em vez de virar fachada, porque não tinha outros importadores.
- `consultar`, `cartaCorrecao` e `inutilizar` entram na interface na Fase 4, junto com o primeiro provedor que os implementa.
- A tela fiscal do Restaurante passou a listar os provedores a partir de `core/provedores-suportados.ts`. PlugNotas/eNotas só aparecem, como "não suportado", para quem já os tinha salvo.

**Rodar os testes de unidade** (Node puro, sem dependência nova):

```bash
node --experimental-strip-types --no-warnings --import ./tests/unit/apoio/registrar.mjs --test "tests/unit/**/*.test.ts"
```

## Fases

### Fase 0 — Pré-requisitos e coordenação
1. **Motor direto:** confirmar credenciamento do emitente, certificado A1, CSC/identificador do CSC, séries e numeração para homologação na UF inicial. Nunca registrar certificado ou senha no repositório, logs ou conversa.
2. **Documentação oficial:** implementar a versão vigente do MOC, schemas, Notas Técnicas, endpoints de homologação, assinatura XML, contingência e eventos da NF-e/NFC-e. Toda regra tributária continua sujeita à validação do contador.
3. **Focus opcional:** quando houver conta de teste, confirmar na documentação da Focus (`doc.focusnfe.com.br`):
   - quais dados do emitente (endereço, IE, CSC, certificado) ficam no cadastro da empresa no painel e quais vão no JSON;
   - se a numeração e a série são controladas pela Focus;
   - os campos obrigatórios de item e de pagamento;
   - a autenticação e o formato do webhook;
   - se é possível reenviar com a mesma `ref` depois de uma rejeição;
   - os prazos de cancelamento por UF.
4. **Coordenação:** registrar esta frente em `docs/comercio-divisao-codex-claude.md`, com as migrations `0122`–`0124`. Combinar as mudanças em `src/app/comercio/actions.ts` (frente Codex) e em `src/app/restaurante/actions.ts`.
5. **Jurídico:** cláusula nos Termos do Restaurante **e** do Comércio, revisada pelo advogado, dizendo que:
   - o certificado pertence ao emitente e seu uso pelo sistema é expressamente autorizado;
   - a correção dos dados fiscais é do cliente e do contador;
   - o INCASSA só transmite o que foi informado.
6. **Linha de base do Restaurante:** antes de refatorar, escrever testes do fluxo atual (simulado), tanto a emissão automática após o pagamento quanto o cancelamento, para provar depois que nada mudou.

### Fase 1 — Camada comum, sem mudar comportamento
- Criar `core/` (documento, interface, status, simulado, não configurado) e mover a lista de provedores suportados para lá.
- Migrar o fluxo do Restaurante para usar `core/` por meio de `restaurante/mapper.ts`. O `nfce.ts` continua existindo como fachada até não haver mais chamadas antigas.
- **Critério de saída:** os testes da Fase 0 continuam passando; o restaurante BR e o tenant de teste da Itália se comportam igual a antes.

### Fase 2 — Banco
**`0123` (compartilhada):**
- Nova tabela `fiscal_credentials`, com chave `(produto, owner_id, ambiente)`, onde `produto` é `'restaurante'` ou `'comercio'`.
  - Colunas: `provedor`, `cifra`, `iv`, `versao_chave`, `ultimos4`, `ultimo_teste_ok`, `ultimo_teste_em`, `webhook_segredo_hash`.
  - RLS ligado **sem nenhuma policy para `authenticated`**: só o servidor lê, depois de conferir que o usuário é dono ou gerente.
- Nova tabela `fiscal_webhook_eventos`: registro de cada notificação recebida (só a `ref`, o provedor e a data; nunca o payload bruto).

**`0124` — parte Restaurante:**
- `del_notas_fiscais`: acrescentar `referencia_provedor`, `modelo` (65 por padrão; 55 opcional depois), status `processando` e `rejeitada`, `codigo_status_sefaz`, `mensagem_sefaz`, `xml_path`, `danfe_path`, `ultima_consulta_em`.
- Tabela de eventos fiscais do Restaurante, no padrão `del_*`, com RLS por `del_effective_owner_ids()`.

**`0124` — parte Comércio:**
- `commerce_fiscal_settings`: `provedor`, endereço do emitente (logradouro, número, bairro, `codigo_municipio_ibge`, município, CEP), `serie_nfce` e `serie_nfe`.
- `commerce_products`: `cfop_venda`, `unidade_comercial` e, para CRT 3, as alíquotas de ICMS, PIS e COFINS. Mudar esses campos invalida a revisão do produto.
- `commerce_customers`: endereço do destinatário (para NF-e 55).
- `commerce_fiscal_documents`:
  - `ambiente` passa a aceitar `producao`, que continua protegido pela trava existente;
  - status reais: `enviando`, `processando`, `autorizado`, `rejeitado`, `denegado`, `erro_comunicacao`, `cancelamento_solicitado`, `cancelado`;
  - colunas `referencia_provedor`, `numero`, `serie`, `chave_acesso`, `xml_path`, `danfe_path`, `ultima_consulta_em`.
- Novas tabelas `commerce_fiscal_events` e `commerce_fiscal_inutilizacoes`.
- `commerce_preparar_documento_fiscal` passa a incluir CFOP, unidade, pagamentos, destinatário e emitente no rascunho.

Não sobra número reservado para ajustes: se os testes pedirem outra migration, reservar `0125+` no documento de divisão antes.

### Fase 3 — Credenciais cifradas (os dois sistemas)
- Implementar `core/credenciais.ts`, com a chave em `FISCAL_CREDENTIALS_KEY` (32 bytes, base64) e `versao_chave` para troca futura. O cofre deve aceitar tanto o certificado A1/senha do motor direto quanto tokens de provedores alternativos, sem misturá-los.
- **Restaurante:** um script de servidor, rodado uma vez, cifra o `provedor_api_key` existente para `fiscal_credentials` e depois zera a coluna. Uma migration posterior remove a coluna. A tela do Restaurante passa a mostrar "configurada ••••1234".
- **Comércio:** formulário de credencial, com homologação e produção separadas.
- **Botão "Testar conexão"** nos dois sistemas.
- **Backup:** garantir que `cifra` e `iv` fiquem fora da cópia enviada por e-mail. `redigirSegredos` precisa cobrir essas colunas; ajustar a expressão regular.

### Fase 4A — Motor próprio INCASSA Fiscal (principal)
- `sefaz-mapper.ts`: função pura para gerar XML NF-e/NFC-e conforme schemas oficiais vigentes, coberta por testes de estrutura e totais.
- `incassa-direto.ts`: assinatura com certificado A1, mTLS/SOAP, autorização, consulta, cancelamento, carta de correção, inutilização e contingência.
- Começar por uma única UF e somente pelos estabelecimentos da proprietária. Não expor API pública nem aceitar certificados de terceiros.
- Testes de contrato no ambiente oficial de homologação: autorizado, rejeitado, denegado, timeout, duplicidade, contingência e reconciliação.

### Fase 4B — Integração Focus NFe (alternativa futura, preservada)
- `focus-mapper.ts`: função pura, coberta por testes unitários (Simples Nacional, regime normal, desconto, vários pagamentos, CPF na nota, NF-e com destinatário).
- `focus-nfe.ts`: emitir, consultar, cancelar, carta de correção e inutilizar, com o mapeamento de status em `core/status.ts`.
- Testes de contrato com respostas reais da homologação gravadas e anonimizadas. Esta fase não bloqueia o motor direto.

### Fase 5 — Fluxos de emissão
**Restaurante:**
- Mantém a emissão automática após o pagamento.
- Passa a usar a `ref` e a regra "consultar antes de reenviar".
- Guarda o XML e o DANFE no Storage privado.

**Comércio:**
- Botão **Emitir** na tela Emissões e, opcionalmente, no PDV depois da venda.
- Uma RPC muda o documento de `validado` para `enviando` com `for update`, o que impede envio duplo.

**Os dois:**
- Rejeição aparece em português, com link para corrigir o produto ou o cadastro.
- Cancelamento dentro do prazo (NFC-e 30 min); fora dele, o sistema orienta a devolução ou o estorno.
- XML e DANFE no bucket privado `fiscal-documentos/{produto}/{owner_id}/{ano}/{chave}.xml`, servidos por URL assinada de curta duração.

### Fase 6 — Retornos assíncronos e reconciliação (compartilhado)
- **Webhook** em `/api/fiscal/webhook`:
  - autenticado por um segredo por cliente;
  - o payload **não é confiável**: ele só aciona `consultar(ref)`, que diz se a `ref` é do Restaurante ou do Comércio e atualiza o documento certo.
- **Cron de reconciliação** em `/api/cron/fiscal-pendentes`: consulta documentos em `processando`, `enviando` ou `erro_comunicacao` há mais de 5 min, com espera crescente entre tentativas.
  - Verificar o plano do Vercel: o Hobby só permite cron diário. Nesse caso, usar o webhook como caminho principal e consultar ao abrir as telas de emissões.
- **Observabilidade:** acrescentar a `/api/comercio/health` e a `/comercio/operacoes` a contagem de documentos presos há mais de 1 h e a de rejeitados nas últimas 24 h, por produto e só com números.

### Fase 7 — Governança: revisão do contador como aviso (decidido)
Decisão de 2026-10-14: nos dois sistemas, a revisão do contador é **recomendada e registrável, nunca obrigatória**.
- **Comércio** (migration `0122`):
  - estabelecimento ou produto sem revisão vira aviso no documento (`avisos_validacao`), e não erro;
  - continuam como erro só os dados que faltam de verdade: CNPJ, UF, CRT, NCM, origem e CST/CSOSN;
  - revisar um produto não exige mais revisar o estabelecimento antes;
  - produção exige só a liberação explícita.
- **Restaurante:** já não bloqueava. A tela de classificação passa a mostrar o mesmo aviso.
- O texto do aviso fica em `src/lib/fiscal/core/avisos.ts` e é o mesmo nos dois sistemas.
- Com isso, a proteção jurídica depende ainda mais da **cláusula nos Termos** (Fase 0), que diz que a correção dos dados fiscais é de quem os informa.

### Fase 8 — Telas
- **Configuração fiscal (os dois):** motor direto como padrão privado; Focus visível como alternativa ainda em integração; credencial/certificado, Testar conexão e checklist do que falta para a produção.
- **Guia privado:** passo a passo para instalar o certificado A1, cadastrar CSC, conferir credenciamento e testar em homologação. Manter também um guia Focus separado para a homologação futura.
- **Emissões:**
  - fila com status, número, chave e motivo da rejeição;
  - links para DANFE e XML;
  - Cancelar, Carta de correção (NF-e) e Inutilizar.
- **PDV do Comércio:** "Emitir NFC-e" depois da venda, com CPF na nota opcional e impressão do DANFCe.

### Fase 9 — Testes e liberação
1. **Regressão:**
   - restaurante BR: emissão automática, cancelamento, estorno e exportação para o contador;
   - tenant de teste da Itália: `teste-italia@incassa.eu`, sem mudança nenhuma;
   - Comércio inteiro: venda, devolução, caixa e DRE.
2. **Fim a fim em homologação nos dois sistemas:**
   - emitir, consultar, cancelar e inutilizar;
   - NF-e com webhook;
   - queda de rede no meio do envio, conferindo que não houve duplicidade.
3. **Segurança:**
   - funcionário sem o módulo fiscal não emite;
   - um cliente não lê documentos nem credenciais de outro;
   - o token não aparece em nenhuma resposta, log ou backup por e-mail.
4. **Liberação por cliente:** produção só com teste de conexão de produção ok e aceite da cláusula nova. A revisão do contador é recomendada, mas não exigida (Fase 7).
5. **Piloto:** um cliente real por sistema, acompanhado de perto. O Pranzo não serve como piloto enquanto for MEI sem Inscrição Estadual.
6. **Comunicação:** só depois do piloto mudar `incassa_direto` para `disponivel` em `core/provedores-suportados.ts`. A Focus só muda de status depois de sua própria homologação. Atualizar junto:
   - a página de vendas (`src/content/homepage.pt-br.ts`);
   - o FAQ fiscal do Restaurante, que hoje diz "conectamos isso assim que você tiver".

---

## Esforço relativo

| Fase | Tamanho | Depende de |
|---|---|---|
| 0 Pré-requisitos e linha de base | P | credenciamento, A1/CSC, contador e advogado |
| 1 Camada comum | M | 0 |
| 2 Banco | M | 1 |
| 3 Credenciais | P | 2 |
| 4A Motor direto SEFAZ | G | 1, 3 e documentação oficial |
| 4B Focus NFe opcional | M | 1, 3; não bloqueia 4A |
| 5 Fluxos | M | 4 |
| 6 Webhook e reconciliação | M | 5 |
| 7 Governança Restaurante | P–M | decisão |
| 8 Telas | M | 5 |
| 9 Testes e liberação | G | todas |

Em relação ao plano anterior, a camada comum continua sendo feita uma vez só para Restaurante e Comércio. O motor direto assume a prioridade; a Focus continua encaixada na mesma interface e pode ser implementada depois sem refazer os fluxos dos produtos.

## Riscos

- **Regressão no Restaurante, que hoje funciona:** mitigada pela linha de base de testes (Fase 0), pela fachada `nfce.ts` durante a transição e pela Fase 1 sem nenhuma mudança de comportamento.
- **Duplicidade de nota:** mitigada pela `ref` única, pela regra "consultar antes de reenviar" e pela trava `enviando`.
- **Classificação fiscal errada:** como a revisão do contador é só aviso, a mitigação é o aviso visível nas telas e nos documentos, o registro de quando houve revisão e, principalmente, a cláusula nos Termos.
- **Vazamento de credencial:** mitigado pela cifra, pela tabela sem select para o navegador, pela redação nos logs e no backup e pelo fim do texto aberto no Restaurante.
- **XML perdido:** a guarda por 5 anos é obrigação do emitente. Guardar cópia no Storage, deixar claro no guia que o provedor também guarda (confirmar o prazo) e avaliar uma exportação mensal dos XMLs para o cliente. O backup diário não cobre arquivos do Storage.

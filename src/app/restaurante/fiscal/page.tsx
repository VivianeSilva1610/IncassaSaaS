import Link from "next/link";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";

const CONTEUDO: Record<
  RestauranteLocale,
  { titulo: string; subtitulo: string; aviso: string; modulos: { href: string; titulo: string; descricao: string; icone: string }[]; abrir: string }
> = {
  "pt-BR": {
    titulo: "Fiscal",
    subtitulo: "Escolha uma área para configurar, consultar ou exportar as informações fiscais do restaurante.",
    aviso: "Mantenha a emissão em homologação até validar cadastro, classificação dos produtos e regras tributárias com o contador.",
    abrir: "Abrir módulo →",
    modulos: [
      { href: "/restaurante/fiscal/emissoes", titulo: "Emissões fiscais", descricao: "Vendas pagas sem nota, emissões pendentes e tentativas que precisam ser refeitas.", icone: "!" },
      { href: "/restaurante/fiscal/fechamento-diario", titulo: "Fechamento diário", descricao: "Concilie vendas, recebimentos, estornos e a relação das NFC-e do dia.", icone: "D" },
      { href: "/restaurante/fiscal/fechamento-mensal", titulo: "Fechamento mensal", descricao: "Consolide competência, caixa, documentos fiscais e pendências do mês.", icone: "M" },
      { href: "/restaurante/fiscal/exportacao", titulo: "Exportar para o contador", descricao: "Relatórios por competência ou caixa, com pagamentos, estornos e documentos fiscais.", icone: "↗" },
      { href: "/restaurante/fiscal/estabelecimento", titulo: "Dados do estabelecimento", descricao: "CNPJ, regime tributário, endereço, provedor e ambiente de emissão.", icone: "⌂" },
      { href: "/restaurante/fiscal/classificacao", titulo: "Classificação fiscal", descricao: "NCM, CFOP, CEST e origem dos produtos utilizados nos documentos fiscais.", icone: "≡" },
      { href: "/restaurante/fiscal/notas", titulo: "Notas fiscais", descricao: "Consulte emissões, erros e cancelamentos por nota, cliente ou CPF/CNPJ.", icone: "▤" },
    ],
  },
  it: {
    titulo: "Fiscale",
    subtitulo: "Scegli un'area per configurare, consultare o esportare le informazioni fiscali del ristorante.",
    aviso: "Mantieni l'emissione in homologação (test) finché anagrafica, classificazione dei prodotti e regole tributarie non sono validate con il commercialista.",
    abrir: "Apri modulo →",
    modulos: [
      { href: "/restaurante/fiscal/emissoes", titulo: "Emissioni fiscali", descricao: "Vendite pagate senza documento, emissioni pendenti e tentativi da rifare.", icone: "!" },
      { href: "/restaurante/fiscal/fechamento-diario", titulo: "Chiusura giornaliera", descricao: "Riconcilia vendite, incassi, storni e l'elenco dei documenti fiscali del giorno.", icone: "D" },
      { href: "/restaurante/fiscal/fechamento-mensal", titulo: "Chiusura mensile", descricao: "Consolida competenza, cassa, documenti fiscali e pendenze del mese.", icone: "M" },
      { href: "/restaurante/fiscal/exportacao", titulo: "Esporta per il commercialista", descricao: "Report per competenza o cassa, con pagamenti, storni e documenti fiscali.", icone: "↗" },
      { href: "/restaurante/fiscal/estabelecimento", titulo: "Dati fiscali", descricao: "Partita IVA, regime fiscale, provider e ambiente di emissione.", icone: "⌂" },
      { href: "/restaurante/fiscal/classificacao", titulo: "Classificazione fiscale", descricao: "NCM, CFOP, CEST e origine dei prodotti — classificazioni specifiche del Brasile.", icone: "≡" },
      { href: "/restaurante/fiscal/notas", titulo: "Documenti fiscali", descricao: "Consulta emissioni, errori e annullamenti per documento o cliente.", icone: "▤" },
    ],
  },
};

export default async function FiscalPage() {
  const { locale } = await requireRestaurantSubscription();
  const t = CONTEUDO[locale];

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">{t.subtitulo}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {t.modulos.map((modulo) => (
          <Link
            key={modulo.href}
            href={modulo.href}
            className="group rounded-xl border border-stone-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-sm"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-xl text-amber-700">
                {modulo.icone}
              </span>
              <div>
                <h2 className="font-semibold text-stone-900 group-hover:text-amber-800">{modulo.titulo}</h2>
                <p className="mt-1 text-sm leading-5 text-stone-500">{modulo.descricao}</p>
                <span className="mt-3 inline-block text-xs font-medium text-amber-700">{t.abrir}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{t.aviso}</p>
    </div>
  );
}

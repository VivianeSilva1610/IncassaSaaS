import Link from "next/link";

const MODULOS = [
  {
    href: "/restaurante/fiscal/exportacao",
    titulo: "Exportar para o contador",
    descricao: "Relatórios por competência ou caixa, com pagamentos, estornos e documentos fiscais.",
    icone: "↗",
  },
  {
    href: "/restaurante/fiscal/estabelecimento",
    titulo: "Dados do estabelecimento",
    descricao: "CNPJ, regime tributário, endereço, provedor e ambiente de emissão.",
    icone: "⌂",
  },
  {
    href: "/restaurante/fiscal/classificacao",
    titulo: "Classificação fiscal",
    descricao: "NCM, CFOP, CEST e origem dos produtos utilizados nos documentos fiscais.",
    icone: "≡",
  },
  {
    href: "/restaurante/fiscal/notas",
    titulo: "Notas fiscais",
    descricao: "Consulte emissões, erros e cancelamentos por nota, cliente ou CPF/CNPJ.",
    icone: "▤",
  },
];

export default function FiscalPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Fiscal</h1>
      <p className="mt-1 text-sm text-stone-600">
        Escolha uma área para configurar, consultar ou exportar as informações fiscais do restaurante.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {MODULOS.map((modulo) => (
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
                <span className="mt-3 inline-block text-xs font-medium text-amber-700">Abrir módulo →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        Mantenha a emissão em homologação até validar cadastro, classificação dos produtos e regras tributárias com o contador.
      </p>
    </div>
  );
}

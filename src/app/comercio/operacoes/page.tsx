import { notFound } from "next/navigation";
import { requireCommerceAccess } from "@/lib/commerce-subscription";
import { verificarSaudeOperacional, type NivelSaude } from "@/app/api/comercio/health/checks";

// Painel somente leitura do estado operacional da plataforma. Só para
// e-mails em ADMIN_EMAILS — pra qualquer outro usuário a rota não existe.

const nivelLabel: Record<NivelSaude, string> = { ok: "OK", atencao: "Atenção", falha: "Falha" };
const nivelClasse: Record<NivelSaude, string> = {
  ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
  atencao: "bg-amber-50 text-amber-800 border-amber-200",
  falha: "bg-red-50 text-red-700 border-red-200",
};
const execucaoClasse: Record<string, string> = {
  sucesso: "text-emerald-700",
  parcial: "text-amber-700",
  executando: "text-stone-500",
  falha: "text-red-700",
  interrompido: "text-red-700",
};

function dataHora(valor: string | null) {
  return valor
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(valor))
    : "—";
}

function tamanho(bytes: number | null) {
  if (bytes == null) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function Selo({ nivel }: { nivel: NivelSaude }) {
  return <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${nivelClasse[nivel]}`}>{nivelLabel[nivel]}</span>;
}

function Cartao({ titulo, nivel, children }: { titulo: string; nivel: NivelSaude; children: React.ReactNode }) {
  return <section className="rounded-2xl border bg-white p-5">
    <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{titulo}</h2><Selo nivel={nivel} /></div>
    <dl className="mt-3 space-y-1.5 text-sm">{children}</dl>
  </section>;
}

function Linha({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return <div className="flex justify-between gap-3"><dt className="text-stone-500">{rotulo}</dt><dd className="text-right font-medium">{valor}</dd></div>;
}

export default async function Page() {
  const { isAdmin } = await requireCommerceAccess();
  if (!isAdmin) notFound();

  const s = await verificarSaudeOperacional();
  const ultima = s.backup.ultimaExecucao;

  return <div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-3xl font-bold">Operações</h1>
        <p className="mt-1 text-sm text-stone-500">Estado da plataforma em {dataHora(s.verificadoEm)}. Somente leitura — recarregue a página para atualizar.</p>
      </div>
      <Selo nivel={s.status} />
    </div>

    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <Cartao titulo="Banco de dados" nivel={s.banco.status}>
        <Linha rotulo="Latência" valor={s.banco.latenciaMs != null ? `${s.banco.latenciaMs} ms` : "—"} />
        {s.banco.erro && <Linha rotulo="Erro" valor={s.banco.erro} />}
      </Cartao>

      <Cartao titulo="Storage (bucket de backups)" nivel={s.storage.status}>
        <Linha rotulo="Latência" valor={s.storage.latenciaMs != null ? `${s.storage.latenciaMs} ms` : "—"} />
        <Linha rotulo="Arquivos de backup guardados" valor={s.storage.arquivosBackup ?? "—"} />
        <Linha rotulo="Arquivo mais recente" valor={dataHora(s.storage.ultimoArquivoEm)} />
        {s.storage.erro && <Linha rotulo="Erro" valor={s.storage.erro} />}
      </Cartao>

      <Cartao titulo="Stripe" nivel={s.stripe.status}>
        <Linha rotulo="Chave secreta" valor={s.stripe.chaveConfigurada ? "configurada" : "ausente"} />
        <Linha rotulo="Modo" valor={s.stripe.modo === "producao" ? "produção" : s.stripe.modo === "teste" ? "teste" : s.stripe.modo ?? "—"} />
        <Linha rotulo="Segredo do webhook" valor={s.stripe.webhookConfigurado ? "configurado" : "ausente"} />
        <Linha rotulo="Preço do Comércio" valor={s.stripe.precoComercioConfigurado ? "configurado" : "ausente"} />
      </Cartao>

      <Cartao titulo="Backup diário" nivel={s.backup.status}>
        {!s.backup.registroDisponivel && <Linha rotulo="Registro" valor="indisponível — migration 0120 pendente" />}
        <Linha rotulo="Último sucesso" valor={s.backup.ultimoSucessoEm ? `${dataHora(s.backup.ultimoSucessoEm)} (há ${s.backup.horasDesdeUltimoSucesso} h)` : "nenhum registrado"} />
        <Linha rotulo="Última execução" valor={ultima ? <span className={execucaoClasse[ultima.status]}>{ultima.status}</span> : "—"} />
        <Linha rotulo="CRON_SECRET" valor={s.backup.cronSecretConfigurado ? "configurado" : "ausente ou curto"} />
        <Linha rotulo="Cópia por e-mail" valor={s.backup.emailConfigurado ? "ativa" : "RESEND_API_KEY ausente"} />
      </Cartao>
    </div>

    <section className="mt-6 rounded-2xl border bg-white">
      <h2 className="border-b p-4 font-semibold">Execuções recentes do backup</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-stone-500">
            <tr><th className="p-3">Início</th><th className="p-3">Status</th><th className="p-3">Duração</th><th className="p-3">Tamanho</th><th className="p-3">Tabelas / linhas</th><th className="p-3">Verificado</th><th className="p-3">E-mail</th></tr>
          </thead>
          <tbody className="divide-y">
            {s.backup.historico.map((r) => <tr key={r.iniciadoEm} className="align-top">
              <td className="p-3 whitespace-nowrap">{dataHora(r.iniciadoEm)}<span className="block text-xs text-stone-400">{r.origem}</span></td>
              <td className="p-3">
                <span className={`font-semibold ${execucaoClasse[r.status]}`}>{r.status}</span>
                {r.erro && <p className="mt-1 max-w-xs text-xs text-red-700">{r.erro}</p>}
                {r.avisos.length > 0 && <details className="mt-1 text-xs text-stone-600"><summary className="cursor-pointer">{r.avisos.length} aviso(s)</summary><ul className="mt-1 list-disc pl-4">{r.avisos.map((a, i) => <li key={i}>{a}</li>)}</ul></details>}
              </td>
              <td className="p-3">{r.duracaoSegundos != null ? `${r.duracaoSegundos}s` : "—"}</td>
              <td className="p-3">{tamanho(r.tamanhoBytes)}</td>
              <td className="p-3">{r.tabelas ?? "—"} / {r.linhas ?? "—"}</td>
              <td className="p-3">{r.verificado ? "sim" : "não"}</td>
              <td className="p-3">{r.emailEnviado ? "enviado" : "não"}</td>
            </tr>)}
            {s.backup.historico.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-stone-500">Nenhuma execução registrada ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>

    <p className="mt-4 text-xs text-stone-500">Procedimento de restauração e teste periódico: docs/comercio-backup-restauracao.md. O mesmo estado fica disponível em GET /api/comercio/health para monitoramento externo.</p>
  </div>;
}

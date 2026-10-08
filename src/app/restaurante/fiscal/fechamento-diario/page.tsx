import { FechamentoFiscalReport } from "@/components/delivery/FechamentoFiscalReport";
import { carregarFechamento, offsetParaData } from "@/lib/fiscal/fechamento";
import type { FechamentoDados } from "@/lib/fiscal/fechamento";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { fecharCaixaDiario } from "@/app/restaurante/actions";

function hojeNoFuso(timeZone: string) {
  const partes = new Intl.DateTimeFormat("en", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const valor = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((parte) => parte.type === tipo)!.value;
  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

const CONTEUDO: Record<RestauranteLocale, {
  labelData: string; consultar: string; fechadoEm: (quando: string, quem: string) => string;
  usuarioIdentificado: string; previa: string; observacaoPlaceholder: string; fecharBotao: string;
  tituloDefinitivo: string; tituloPrevia: string;
}> = {
  "pt-BR": {
    labelData: "Data do fechamento", consultar: "Consultar",
    fechadoEm: (quando, quem) => `Caixa fechado em ${quando} por ${quem}.`,
    usuarioIdentificado: "usuário identificado",
    previa: "Prévia: este caixa ainda não foi fechado e os valores podem mudar.",
    observacaoPlaceholder: "Observação do fechamento (opcional)",
    fecharBotao: "Fechar caixa deste dia",
    tituloDefinitivo: "Fechamento diário definitivo", tituloPrevia: "Prévia do fechamento diário",
  },
  it: {
    labelData: "Data di chiusura", consultar: "Consulta",
    fechadoEm: (quando, quem) => `Cassa chiusa il ${quando} da ${quem}.`,
    usuarioIdentificado: "utente identificato",
    previa: "Anteprima: questa cassa non è ancora stata chiusa e i valori possono cambiare.",
    observacaoPlaceholder: "Nota di chiusura (opzionale)",
    fecharBotao: "Chiudi cassa di questo giorno",
    tituloDefinitivo: "Chiusura giornaliera definitiva", tituloPrevia: "Anteprima chiusura giornaliera",
  },
};

export default async function FechamentoDiarioPage({ searchParams }: { searchParams: Promise<{ data?: string }> }) {
  const { supabase, restaurantOwnerId, isGerente, locale } = await requireRestaurantSubscription("fiscal");
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, country_code, timezone")
    .eq("owner_user_id", restaurantOwnerId)
    .maybeSingle();
  const timezone = restaurant?.timezone || (locale === "it" ? "Europe/Rome" : "America/Sao_Paulo");
  const country: "BR" | "IT" = restaurant?.country_code === "IT" ? "IT" : "BR";
  const t = CONTEUDO[locale];
  const intlLocale = locale === "it" ? "it-IT" : "pt-BR";

  const { data: param } = await searchParams;
  const data = /^\d{4}-\d{2}-\d{2}$/.test(param ?? "") ? param! : hojeNoFuso(timezone);
  const offset = offsetParaData(timezone, data);

  const { data: fechamento } = await supabase
    .from("del_caixa_fechamentos")
    .select("snapshot, fechado_em, fechado_por_email, observacao")
    .eq("owner_id", restaurantOwnerId)
    .eq("data", data)
    .maybeSingle();
  const dados = fechamento
    ? (fechamento.snapshot as unknown as FechamentoDados)
    : await carregarFechamento(
        supabase, restaurantOwnerId,
        `${data}T00:00:00${offset}`, `${data}T23:59:59.999${offset}`, data, data,
        restaurant?.id ? { restaurantId: restaurant.id, country } : null,
      );
  const periodo = new Date(`${data}T12:00:00${offset}`).toLocaleDateString(intlLocale, { timeZone: timezone });

  return (
    <div>
      <form className="mb-6 flex items-end gap-2 print:hidden">
        <div>
          <label className="block text-xs text-stone-500">{t.labelData}</label>
          <input name="data" type="date" defaultValue={data} className="rounded-md border px-3 py-2 text-sm" />
        </div>
        <button className="rounded-md bg-stone-900 px-4 py-2 text-sm text-white">{t.consultar}</button>
      </form>
      {fechamento ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {t.fechadoEm(new Date(fechamento.fechado_em).toLocaleString(intlLocale, { timeZone: timezone }), fechamento.fechado_por_email || t.usuarioIdentificado)} {fechamento.observacao || ""}
        </p>
      ) : (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <p>{t.previa}</p>
          {isGerente && (
            <form action={fecharCaixaDiario} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="data" value={data} />
              <input name="observacao" placeholder={t.observacaoPlaceholder} className="min-w-64 flex-1 rounded-md border border-amber-300 px-3 py-2 text-sm text-stone-900" />
              <button className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">{t.fecharBotao}</button>
            </form>
          )}
        </div>
      )}
      <FechamentoFiscalReport titulo={fechamento ? t.tituloDefinitivo : t.tituloPrevia} periodo={periodo} dados={dados} finalizado={!!fechamento} locale={locale} />
    </div>
  );
}

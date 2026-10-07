import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { addZonaEntrega, updateZonaEntrega, toggleZonaEntregaAtivo, deleteZonaEntrega } from "@/app/restaurante/actions";

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function CustosEntregaPage() {
  const { supabase } = await requireRestaurantSubscription("custos");

  const { data: zonasEntrega } = await supabase
    .from("del_zonas_entrega")
    .select("*")
    .order("distancia_km", { ascending: true, nullsFirst: false });

  return (
    <div>
      <Link href="/restaurante/custos" className="text-sm text-amber-700 underline underline-offset-2">
        ← Custos
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">Taxa de entrega por bairro</h1>
      <p className="mt-1 text-sm text-stone-600">
        Cadastre os bairros que você atende (inicialmente até uns 30km) com a distância aproximada e a taxa.
        Deixe a taxa em 0 pra oferecer entrega sempre grátis naquele bairro, ou defina um pedido mínimo pra
        grátis — abaixo do mínimo, cobra a taxa normal. Bairro fora dessa lista não aparece como opção pro
        cliente no site.
      </p>

      <form action={addZonaEntrega} className="mt-4 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-4">
        <input name="bairro" required placeholder="Nome do bairro" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="distancia_km" type="number" step="0.1" min="0" max="30" placeholder="Distância aprox. (km)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="taxa" type="number" step="0.01" min="0" required placeholder="Taxa (R$, 0 = sempre grátis)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="pedido_minimo_gratis" type="number" step="0.01" min="0" placeholder="Pedido mín. p/ grátis (opcional)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <button
          type="submit"
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-4"
        >
          Adicionar bairro
        </button>
      </form>

      <div className="mt-3 space-y-1.5">
        {(zonasEntrega ?? []).map((z) => (
          <div key={z.id} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className={z.ativo ? "text-stone-900" : "text-stone-400 line-through"}>
                {z.bairro}
                {z.distancia_km != null && ` — ~${Number(z.distancia_km)}km`}
                {" — "}
                {Number(z.taxa) === 0 ? "Sempre grátis" : formatReal(Number(z.taxa))}
                {z.pedido_minimo_gratis != null && Number(z.taxa) > 0 && (
                  <span className="text-stone-500"> · grátis a partir de {formatReal(Number(z.pedido_minimo_gratis))}</span>
                )}
              </span>
              <div className="flex shrink-0 items-center gap-3">
                <details className="relative">
                  <summary className="cursor-pointer list-none text-xs text-amber-700 hover:underline">Editar</summary>
                  <form
                    action={updateZonaEntrega.bind(null, z.id)}
                    className="absolute right-0 z-10 mt-2 grid w-64 gap-2 rounded-lg border border-stone-200 bg-white p-3 shadow-lg"
                  >
                    <input name="bairro" required defaultValue={z.bairro} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                    <input name="distancia_km" type="number" step="0.1" min="0" max="30" defaultValue={z.distancia_km ?? ""} placeholder="Distância (km)" className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                    <input name="taxa" type="number" step="0.01" min="0" required defaultValue={z.taxa} placeholder="Taxa (R$)" className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                    <input name="pedido_minimo_gratis" type="number" step="0.01" min="0" defaultValue={z.pedido_minimo_gratis ?? ""} placeholder="Pedido mín. p/ grátis" className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                    <button type="submit" className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-700">
                      Salvar
                    </button>
                  </form>
                </details>
                <form action={toggleZonaEntregaAtivo.bind(null, z.id, z.ativo)}>
                  <button type="submit" className="text-xs text-amber-700 hover:underline">
                    {z.ativo ? "Desativar" : "Ativar"}
                  </button>
                </form>
                <form action={deleteZonaEntrega.bind(null, z.id)}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">Excluir</button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {(zonasEntrega ?? []).length === 0 && <p className="text-sm text-stone-500">Nenhum bairro cadastrado ainda — a entrega no site fica indisponível até cadastrar pelo menos um.</p>}
      </div>
    </div>
  );
}

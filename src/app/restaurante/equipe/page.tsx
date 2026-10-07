import { redirect } from "next/navigation";
import { requireRestaurantSubscription, MODULOS_RESTAURANTE, type ModuloRestaurante } from "@/lib/subscription";
import { addStaff, removeStaff, toggleStaffGerente, updateStaffModulos } from "@/app/restaurante/actions";

const LABEL_MODULO: Record<ModuloRestaurante, string> = {
  estoque: "Estoque",
  vendas: "Vendas",
  cardapio: "Menu do site",
  cozinha: "Cozinha",
  custos: "Custos",
  caixa: "Caixa",
  financeiro: "Financeiro",
  gestao: "Gestão",
};

export default async function EquipePage() {
  const { supabase, restaurantOwnerId, isOwner, isGerente } = await requireRestaurantSubscription();

  if (!isOwner && !isGerente) {
    redirect("/restaurante");
  }

  const { data: staff } = await supabase
    .from("del_staff")
    .select("*")
    .eq("owner_id", restaurantOwnerId)
    .order("created_at");

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Equipe</h1>
      <p className="mt-1 text-sm text-stone-600">
        Pessoas que podem acessar e trabalhar no seu restaurante com o próprio login. Para dar acesso a alguém,
        cadastre o e-mail aqui — a pessoa só precisa criar uma conta em incassa.eu/criar-conta usando esse mesmo
        e-mail. Marque abaixo quais módulos cada pessoa pode ver (ex: responsável pelo caixa → Caixa e Vendas;
        chef → só Cozinha). Marcar alguém como <strong>gerente</strong> libera editar e excluir dentro dos
        módulos que ela acessa, e permite que essa pessoa também conceda módulos e gerência pra outros da
        equipe.
      </p>

      {isOwner && (
        <form action={addStaff} className="mt-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
          <input name="email" type="email" required placeholder="E-mail da pessoa" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="nome" placeholder="Nome (opcional)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <button
            type="submit"
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-2"
          >
            Dar acesso
          </button>
        </form>
      )}

      <div className="mt-6 space-y-2">
        {(staff ?? []).map((s) => (
          <div key={s.id} className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-stone-900">
                  {s.nome || s.email}
                  {s.gerente && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      Gerente
                    </span>
                  )}
                </p>
                {s.nome && <p className="text-sm text-stone-500">{s.email}</p>}
              </div>
              <div className="flex items-center gap-3">
                <form action={toggleStaffGerente.bind(null, s.id, s.gerente)}>
                  <button type="submit" className="text-xs text-amber-700 hover:underline">
                    {s.gerente ? "Tirar gerente" : "Tornar gerente"}
                  </button>
                </form>
                {isOwner && (
                  <form action={removeStaff.bind(null, s.id)}>
                    <button type="submit" className="text-xs text-red-600 hover:underline">
                      Remover acesso
                    </button>
                  </form>
                )}
              </div>
            </div>

            <form action={updateStaffModulos.bind(null, s.id)} className="mt-3 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-3">
              {MODULOS_RESTAURANTE.map((modulo) => (
                <label key={modulo} className="flex items-center gap-1.5 text-xs text-stone-600">
                  <input
                    type="checkbox"
                    name="modulos"
                    value={modulo}
                    defaultChecked={(s.modulos ?? []).includes(modulo)}
                  />
                  {LABEL_MODULO[modulo]}
                </label>
              ))}
              <button type="submit" className="rounded-md bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-200">
                Salvar módulos
              </button>
            </form>
          </div>
        ))}
        {(staff ?? []).length === 0 && <p className="text-sm text-stone-500">Ninguém com acesso ainda, além de você.</p>}
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { addStaff, removeStaff } from "@/app/restaurante/actions";

export default async function EquipePage() {
  const { supabase, restaurantOwnerId, isOwner } = await requireRestaurantSubscription();

  if (!isOwner) {
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
        Pessoas que podem acessar e trabalhar no seu restaurante (estoque, vendas, custos, caixa) com o
        próprio login. Para dar acesso a alguém, cadastre o e-mail aqui — a pessoa só precisa criar uma
        conta em incassa.eu/signup usando esse mesmo e-mail.
      </p>

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

      <div className="mt-6 space-y-2">
        {(staff ?? []).map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-4">
            <div>
              <p className="font-medium text-stone-900">{s.nome || s.email}</p>
              {s.nome && <p className="text-sm text-stone-500">{s.email}</p>}
            </div>
            <form action={removeStaff.bind(null, s.id)}>
              <button type="submit" className="text-xs text-red-600 hover:underline">
                Remover acesso
              </button>
            </form>
          </div>
        ))}
        {(staff ?? []).length === 0 && <p className="text-sm text-stone-500">Ninguém com acesso ainda, além de você.</p>}
      </div>
    </div>
  );
}

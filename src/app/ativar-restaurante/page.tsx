import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { RestauranteSubscribeButton } from "@/components/RestauranteSubscribeButton";

// Fora de /restaurante/* de propósito: o layout dessa área exige
// assinatura ativa, e é exatamente isso que essa página existe pra
// resolver — não pode depender do próprio gate que ainda não foi aberto.
export default async function AtivarRestaurantePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name, slug")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16 text-center">
      <h1 className="text-2xl font-bold text-stone-900">E-mail confirmado! 🎉</h1>
      {restaurant ? (
        <p className="mt-2 text-sm text-stone-600">
          {restaurant.name} está quase pronto. Ative a assinatura pra começar a usar o painel e a sua loja em
          incassa.eu/loja/{restaurant.slug}.
        </p>
      ) : (
        <p className="mt-2 text-sm text-stone-600">
          Não encontramos um restaurante vinculado a essa conta — se você veio pelo cadastro público, tente de
          novo ou fale com o suporte.
        </p>
      )}

      {restaurant && (
        <div className="mt-6">
          <RestauranteSubscribeButton className="w-full rounded-lg bg-gradient-to-b from-amber-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-transform hover:from-amber-400 hover:to-orange-500 active:scale-[0.98] disabled:opacity-60" />
        </div>
      )}
    </main>
  );
}

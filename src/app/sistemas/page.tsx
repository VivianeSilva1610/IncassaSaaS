import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { signOut } from "@/lib/auth-actions";

const ACTIVE_STATUSES = ["trialing", "active"];

export default async function SistemasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: restaurantSub }, { data: commerceOwnSub }, { data: restaurantStaff }, { data: commerceStaff }] = await Promise.all([
    supabase.from("restaurant_subscriptions").select("subscription_status").eq("user_id", user.id).maybeSingle(),
    supabase.from("commerce_subscriptions").select("subscription_status").eq("user_id", user.id).maybeSingle(),
    supabase.from("del_staff").select("id").ilike("email", user.email ?? "").maybeSingle(),
    supabase.from("commerce_staff").select("owner_id").ilike("email", user.email ?? "").maybeSingle(),
  ]);
  const { data: commerceOwnerSub } = commerceStaff
    ? await supabase.from("commerce_subscriptions").select("subscription_status").eq("user_id", commerceStaff.owner_id).maybeSingle()
    : { data: null };

  const restaurant = !!restaurantStaff || (!!restaurantSub && ACTIVE_STATUSES.includes(restaurantSub.subscription_status));
  const commerceSubscription = commerceOwnSub ?? commerceOwnerSub;
  const commerce = !!commerceSubscription && ACTIVE_STATUSES.includes(commerceSubscription.subscription_status);

  return <main className="min-h-screen bg-stone-50 px-6 py-16"><div className="mx-auto max-w-4xl">
    <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Sua conta</p><h1 className="mt-1 text-3xl font-bold">Escolha o sistema</h1><p className="mt-1 text-sm text-stone-500">{user.email}</p></div><form action={signOut}><button className="text-sm font-semibold text-stone-600">Sair</button></form></div>
    <div className="mt-8 grid gap-5 md:grid-cols-2"><SystemCard title="INCASSA Restaurante" description="Operação completa para restaurantes." active={restaurant} access="/restaurante" subscribe="/ativar-restaurante"/><SystemCard title="INCASSA Comércio" description="ERP e PDV para comércio e revenda." active={commerce} access="/comercio" subscribe="/ativar-comercio"/></div>
  </div></main>;
}

function SystemCard({ title, description, active, access, subscribe }: { title: string; description: string; active: boolean; access: string; subscribe: string }) {
  return <article className="rounded-3xl border bg-white p-7 shadow-sm"><div className="flex justify-between gap-3"><h2 className="text-xl font-bold">{title}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${active ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>{active ? "Ativo" : "Não contratado"}</span></div><p className="mt-3 text-sm text-stone-600">{description}</p><Link href={active ? access : subscribe} className="mt-6 block rounded-xl bg-stone-900 px-4 py-3 text-center text-sm font-semibold text-white">{active ? "Acessar sistema" : "Conhecer e ativar"}</Link></article>;
}

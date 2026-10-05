import { getSupabaseAdmin } from "@/lib/supabase";
import { MesaMenuForm } from "@/components/delivery/MesaMenuForm";

export default async function MesaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = getSupabaseAdmin();

  const { data: mesa } = await admin.from("del_mesas").select("id, numero, owner_id").eq("qr_token", token).maybeSingle();

  if (!mesa) {
    return (
      <main className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-stone-600">Mesa não encontrada.</p>
      </main>
    );
  }

  const [{ data: products }, { data: pricingConfig }] = await Promise.all([
    admin
      .from("del_products")
      .select("id, nome, descrizione, preco, categoria, imagem_url")
      .eq("owner_id", mesa.owner_id)
      .eq("ativo", true)
      .in("categoria", ["prato", "bebida", "sobremesa"])
      .order("nome"),
    admin.from("del_pricing_config").select("nome_negocio").eq("owner_id", mesa.owner_id).maybeSingle(),
  ]);

  const nomeNegocio = pricingConfig?.nome_negocio || "Cardápio";

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-xl font-bold text-stone-900">{nomeNegocio}</h1>
      <p className="mt-1 text-sm text-stone-500">Mesa {mesa.numero}</p>

      <MesaMenuForm
        qrToken={token}
        products={(products ?? []).map((p) => ({
          id: p.id,
          nome: p.nome,
          descricao: p.descrizione,
          preco: Number(p.preco),
          categoria: p.categoria,
          imagemUrl: p.imagem_url,
        }))}
      />
    </main>
  );
}

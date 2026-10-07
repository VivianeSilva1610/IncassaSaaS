import { requireRestaurantSubscription } from "@/lib/subscription";
import { NewOrderForm } from "@/components/delivery/NewOrderForm";

export default async function NovoPedidoPage() {
  const { supabase, isOwner } = await requireRestaurantSubscription();
  const [{ data: products }, { data: cardapioSemana }] = await Promise.all([
    supabase.from("del_products").select("*").eq("ativo", true).order("nome"),
    supabase.from("del_cardapio_semana").select("dia_semana, product_id"),
  ]);
  const ativos = products ?? [];
  const itensAvulsos = ativos.filter((p) => ["prato", "bebida", "sobremesa"].includes(p.categoria)).map((p) => ({ id: p.id, nome: p.nome, preco: Number(p.preco) }));
  const tamanhos = ativos.filter((p) => p.categoria === "tamanho").map((p) => ({ id: p.id, nome: p.nome, preco: Number(p.preco), maxAcompanhamentos: Number(p.max_acompanhamentos ?? 0) }));
  const principais = ativos.filter((p) => p.categoria === "principal" || p.categoria === "prato").map((p) => ({ id: p.id, nome: p.nome, preco: 0 }));
  const acompanhamentos = ativos.filter((p) => p.categoria === "acompanhamento").map((p) => ({ id: p.id, nome: p.nome, preco: 0 }));
  const extras = ativos.filter((p) => p.categoria === "extra").map((p) => ({ id: p.id, nome: p.nome, preco: Number(p.preco) }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Novo pedido</h1>
      <p className="mt-1 text-sm text-stone-600">Registre uma venda recebida no balcão, telefone ou atendimento interno.</p>
      <div className="mt-6">
        <NewOrderForm
          products={itensAvulsos}
          tamanhos={tamanhos}
          principais={principais}
          acompanhamentos={acompanhamentos}
          extras={extras}
          cardapioSemana={(cardapioSemana ?? []).map((c) => ({ diaSemana: c.dia_semana, productId: c.product_id }))}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
}

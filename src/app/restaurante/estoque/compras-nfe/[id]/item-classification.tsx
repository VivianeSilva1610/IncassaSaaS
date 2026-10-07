"use client";

import { useState } from "react";

type Ingredient = { id: string; nome: string; unidade: string };

const stockDestinations = new Set(["insumo_producao", "embalagem", "mercadoria_revenda"]);

export function ItemClassification({
  itemId,
  defaultQuantity,
  ingredients,
  disabled,
}: {
  itemId: string;
  defaultQuantity: number;
  ingredients: Ingredient[];
  disabled: boolean;
}) {
  const [destination, setDestination] = useState("insumo_producao");
  const controlsStock = stockDestinations.has(destination);

  return (
    <div className="grid min-w-64 gap-2">
      <select
        name={`destinacao_${itemId}`}
        value={destination}
        onChange={(event) => setDestination(event.target.value)}
        disabled={disabled}
        className="rounded-md border border-stone-300 px-2 py-2"
      >
        <option value="insumo_producao">Insumo de produção</option>
        <option value="embalagem">Embalagem</option>
        <option value="mercadoria_revenda">Mercadoria para revenda</option>
        <option value="uso_consumo">Uso e consumo</option>
        <option value="ativo_imobilizado">Ativo imobilizado</option>
        <option value="despesa">Despesa sem estoque</option>
      </select>

      {controlsStock ? (
        <div className="grid grid-cols-[1fr_8rem] gap-2">
          <select
            name={`ingrediente_${itemId}`}
            required
            disabled={disabled}
            className="rounded-md border border-stone-300 px-2 py-2"
          >
            <option value="">Item de estoque...</option>
            {ingredients.map((ingredient) => (
              <option key={ingredient.id} value={ingredient.id}>
                {ingredient.nome} ({ingredient.unidade})
              </option>
            ))}
          </select>
          <input
            name={`quantidade_${itemId}`}
            type="number"
            required
            min="0.0001"
            step="0.0001"
            defaultValue={defaultQuantity}
            disabled={disabled}
            aria-label="Quantidade que entra no estoque"
            className="rounded-md border border-stone-300 px-2 py-2"
          />
        </div>
      ) : (
        <p className="rounded-md bg-stone-50 px-2 py-2 text-xs text-stone-600">
          Não movimenta o estoque de ingredientes.
        </p>
      )}
    </div>
  );
}

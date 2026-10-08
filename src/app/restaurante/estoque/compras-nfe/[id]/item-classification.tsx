"use client";

import { useState } from "react";

type Ingredient = { id: string; nome: string; unidade: string; unidadeCompra?: string; fatorConversaoCompra?: number };

const stockDestinations = new Set(["insumo_producao", "embalagem", "mercadoria_revenda"]);

export function ItemClassification({
  itemId,
  invoiceQuantity,
  invoiceUnit,
  ingredients,
  suggestedDestination,
  suggestedIngredientId,
  suggestedStockQuantity,
  disabled,
}: {
  itemId: string;
  invoiceQuantity: number;
  invoiceUnit: string | null;
  ingredients: Ingredient[];
  suggestedDestination?: string;
  suggestedIngredientId?: string;
  suggestedStockQuantity?: number;
  disabled: boolean;
}) {
  const [destination, setDestination] = useState(suggestedDestination || "insumo_producao");
  const [ingredientId, setIngredientId] = useState(suggestedIngredientId || "");
  const [stockQuantity, setStockQuantity] = useState(
    suggestedStockQuantity ? String(Number(suggestedStockQuantity.toFixed(4))) : "",
  );
  const controlsStock = stockDestinations.has(destination);
  const selectedIngredient = ingredients.find((ingredient) => ingredient.id === ingredientId);

  function selectIngredient(id: string) {
    setIngredientId(id);
    const ingredient = ingredients.find((item) => item.id === id);
    const sameUnit = ingredient && invoiceUnit && ingredient.unidade.toLowerCase() === invoiceUnit.toLowerCase();
    if (sameUnit) {
      setStockQuantity(String(invoiceQuantity));
    } else if (ingredient?.fatorConversaoCompra) {
      setStockQuantity(String(Number((invoiceQuantity * ingredient.fatorConversaoCompra).toFixed(4))));
    } else {
      setStockQuantity("");
    }
  }

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
        <div className="grid gap-2">
          <label className="text-xs font-medium text-stone-600">
            Produto correspondente no estoque
            <select
              name={`ingrediente_${itemId}`}
              required
              value={ingredientId}
              onChange={(event) => selectIngredient(event.target.value)}
              disabled={disabled}
              className="mt-1 w-full rounded-md border border-stone-300 px-2 py-2 text-sm text-stone-900"
            >
              <option value="">Selecione o produto...</option>
              {ingredients.map((ingredient) => (
                <option key={ingredient.id} value={ingredient.id}>
                  {ingredient.nome} ({ingredient.unidade})
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-stone-600">
            Quantidade convertida que entra no estoque{selectedIngredient ? ` (${selectedIngredient.unidade})` : ""}
            <input
              name={`quantidade_${itemId}`}
              type="number"
              required
              min="0.0001"
              step="0.0001"
              value={stockQuantity}
              onChange={(event) => setStockQuantity(event.target.value)}
              disabled={disabled}
              placeholder={selectedIngredient ? `Total em ${selectedIngredient.unidade}` : "Selecione o produto primeiro"}
              aria-label="Quantidade convertida que entra no estoque"
              className="mt-1 w-full rounded-md border border-stone-300 px-2 py-2 text-sm text-stone-900"
            />
          </label>
          <p className="rounded-md bg-amber-50 px-2 py-2 text-xs text-amber-900">
            A quantidade fiscal permanece {invoiceQuantity} {invoiceUnit || "un."}. Este campo registra apenas a conversão para a unidade usada no estoque.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-medium text-stone-600">
              Lote (opcional)
              <input
                name={`lote_${itemId}`}
                disabled={disabled}
                placeholder="Nº do lote"
                className="mt-1 w-full rounded-md border border-stone-300 px-2 py-1.5 text-sm text-stone-900"
              />
            </label>
            <label className="text-xs font-medium text-stone-600">
              Validade (opcional)
              <input
                name={`validade_${itemId}`}
                type="date"
                disabled={disabled}
                className="mt-1 w-full rounded-md border border-stone-300 px-2 py-1.5 text-sm text-stone-900"
              />
            </label>
          </div>
          {suggestedIngredientId && <p className="text-xs text-emerald-700">Sugestão recuperada da última compra deste produto. Confira antes de confirmar.</p>}
          {!suggestedIngredientId && selectedIngredient?.fatorConversaoCompra != null && invoiceUnit && selectedIngredient.unidade.toLowerCase() !== invoiceUnit.toLowerCase() && (
            <p className="text-xs text-emerald-700">
              Calculado a partir da conversão cadastrada no ingrediente (1 {selectedIngredient.unidadeCompra ?? "unidade de compra"} = {selectedIngredient.fatorConversaoCompra} {selectedIngredient.unidade}). Confira antes de confirmar.
            </p>
          )}
        </div>
      ) : (
        <p className="rounded-md bg-stone-50 px-2 py-2 text-xs text-stone-600">
          Não movimenta o estoque de ingredientes.
        </p>
      )}
    </div>
  );
}

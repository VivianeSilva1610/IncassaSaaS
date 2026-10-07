"use client";

import { useMemo, useState } from "react";

type Ingredient = { id: string; nome: string };

export function IngredientePicker({ ingredients, name }: { ingredients: Ingredient[]; name: string }) {
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return ingredients;
    return ingredients.filter((i) => i.nome.toLowerCase().includes(termo));
  }, [busca, ingredients]);

  return (
    <div className="grid gap-1">
      <input
        type="text"
        value={busca}
        onChange={(event) => setBusca(event.target.value)}
        placeholder="Buscar ingrediente…"
        className="rounded-md border border-stone-300 px-2 py-1.5 text-xs"
      />
      <select name={name} required defaultValue="" className="rounded-md border border-stone-300 px-2 py-1.5 text-xs">
        <option value="">Ingrediente… ({filtrados.length})</option>
        {filtrados.map((i) => (
          <option key={i.id} value={i.id}>{i.nome}</option>
        ))}
      </select>
    </div>
  );
}

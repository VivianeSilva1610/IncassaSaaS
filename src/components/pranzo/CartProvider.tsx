"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type CartItem = { productId: string; nome: string; preco: number; quantidade: number };

type CartContextValue = {
  itens: CartItem[];
  adicionar: (item: { productId: string; nome: string; preco: number }) => void;
  remover: (productId: string) => void;
  limpar: () => void;
  total: number;
  quantidadeTotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<CartItem[]>([]);

  function adicionar(item: { productId: string; nome: string; preco: number }) {
    setItens((prev) => {
      const existente = prev.find((i) => i.productId === item.productId);
      if (existente) {
        return prev.map((i) => (i.productId === item.productId ? { ...i, quantidade: i.quantidade + 1 } : i));
      }
      return [...prev, { ...item, quantidade: 1 }];
    });
  }

  function remover(productId: string) {
    setItens((prev) => {
      const existente = prev.find((i) => i.productId === productId);
      if (!existente) return prev;
      if (existente.quantidade <= 1) return prev.filter((i) => i.productId !== productId);
      return prev.map((i) => (i.productId === productId ? { ...i, quantidade: i.quantidade - 1 } : i));
    });
  }

  function limpar() {
    setItens([]);
  }

  const total = useMemo(() => itens.reduce((sum, i) => sum + i.preco * i.quantidade, 0), [itens]);
  const quantidadeTotal = useMemo(() => itens.reduce((sum, i) => sum + i.quantidade, 0), [itens]);

  return (
    <CartContext.Provider value={{ itens, adicionar, remover, limpar, total, quantidadeTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de um CartProvider");
  return ctx;
}

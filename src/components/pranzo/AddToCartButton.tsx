"use client";

import { useCart } from "./CartProvider";

export function AddToCartButton({
  productId,
  nome,
  preco,
  className,
  children,
}: {
  productId: string;
  nome: string;
  preco: number;
  className?: string;
  children: React.ReactNode;
}) {
  const { adicionar } = useCart();

  return (
    <button type="button" className={className} onClick={() => adicionar({ productId, nome, preco })}>
      {children}
    </button>
  );
}

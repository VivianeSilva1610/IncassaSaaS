"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import styles from "./AddToCartButton.module.css";

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
  const [quantidade, setQuantidade] = useState(1);

  function handleAdicionar() {
    adicionar({ productId, nome, preco }, quantidade);
    setQuantidade(1);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.stepper}>
        <button
          type="button"
          aria-label="Diminuir quantidade"
          className={styles.stepperBtn}
          onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
        >
          −
        </button>
        <span className={styles.stepperValue}>{quantidade}</span>
        <button
          type="button"
          aria-label="Aumentar quantidade"
          className={styles.stepperBtn}
          onClick={() => setQuantidade((q) => q + 1)}
        >
          +
        </button>
      </div>
      <button type="button" className={className} onClick={handleAdicionar}>
        {children}
      </button>
    </div>
  );
}

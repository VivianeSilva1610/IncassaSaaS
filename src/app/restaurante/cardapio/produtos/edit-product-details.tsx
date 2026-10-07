"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function EditProductDetails({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (!open) return;
    function closeOnOutside(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <details ref={containerRef} open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="relative">
      <summary className="cursor-pointer list-none text-xs text-amber-700">Editar</summary>
      <div onSubmit={() => setOpen(false)}>{children}</div>
    </details>
  );
}


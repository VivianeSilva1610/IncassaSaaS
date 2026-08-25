"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function Reveal({
  children,
  className,
  stagger = 0,
  y = 24,
  mode = "scroll",
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  y?: number;
  mode?: "scroll" | "load";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const targets = stagger > 0 ? gsap.utils.toArray(ref.current!.children) : ref.current;
      const from = { opacity: 0, y };
      const to: gsap.TweenVars = {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        stagger,
      };

      if (mode === "load") {
        gsap.fromTo(targets, from, to);
      } else {
        gsap.fromTo(targets, from, {
          ...to,
          scrollTrigger: {
            trigger: ref.current,
            start: "top 85%",
            once: true,
          },
        });
      }
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

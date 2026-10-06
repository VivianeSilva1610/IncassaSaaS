import type { Metadata } from "next";
import { SetHtmlLang } from "@/components/SetHtmlLang";

export const metadata: Metadata = {
  title: "INCASSA Restaurante",
  description: "Gestão completa do seu restaurante, do fornecedor ao cliente, num só lugar.",
};

export default function PtLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SetHtmlLang lang="pt-BR" />
      {children}
    </>
  );
}

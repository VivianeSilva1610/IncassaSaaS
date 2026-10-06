import type { Metadata } from "next";
import { SetHtmlLang } from "@/components/SetHtmlLang";

export const metadata: Metadata = {
  title: "INCASSA Restaurant — Run your whole restaurant from one place",
  description:
    "From stock and suppliers to the customer's order and the receipt: INCASSA Restaurant organizes everything your business needs.",
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SetHtmlLang lang="en" />
      {children}
    </>
  );
}

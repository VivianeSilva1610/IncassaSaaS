import type { Metadata } from "next";
import { SetHtmlLang } from "@/components/SetHtmlLang";

export const metadata: Metadata = {
  title: "INCASSA",
  description: "Get paid on time. For plumbers, electricians, contractors and small businesses.",
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SetHtmlLang lang="en" />
      {children}
    </>
  );
}

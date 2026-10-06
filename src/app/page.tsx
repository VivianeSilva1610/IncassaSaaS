import type { Metadata } from "next";
import { homepage } from "@/content/homepage.it";
import { RestaurantHomepage } from "@/components/RestaurantHomepage";

export const metadata: Metadata = {
  title: "INCASSA Ristorante — Gestisci il tuo ristorante in un unico posto",
  description:
    "Dal magazzino e dai fornitori fino all'ordine del cliente e allo scontrino: INCASSA Ristorante organizza il quotidiano del tuo locale.",
};

export default function Home() {
  return (
    <RestaurantHomepage
      content={homepage}
      langLinks={[
        { href: "/en", label: homepage.englishLink },
        { href: "/pt", label: homepage.portugueseLink },
      ]}
    />
  );
}

import { homepage } from "@/content/homepage.pt-br";
import { RestaurantHomepage } from "@/components/RestaurantHomepage";

export default function HomePt() {
  return (
    <RestaurantHomepage
      content={homepage}
      langLinks={[
        { href: "/", label: homepage.italianLink },
        { href: "/en", label: homepage.englishLink },
      ]}
      loginHref="/login"
      legalLinks={{
        privacyHref: "/pt/privacidade",
        termsHref: "/pt/termos",
        privacyLabel: "Privacidade",
        termsLabel: "Termos",
      }}
    />
  );
}

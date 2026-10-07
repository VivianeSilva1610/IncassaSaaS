import { homepage } from "@/content/homepage.en";
import { RestaurantHomepage } from "@/components/RestaurantHomepage";

export default function HomeEn() {
  return (
    <RestaurantHomepage
      content={homepage}
      langLinks={[
        { href: "/", label: homepage.italianLink },
        { href: "/pt", label: homepage.portugueseLink },
      ]}
      loginHref="/login"
      legalLinks={{
        privacyHref: "/en/privacy-restaurante",
        termsHref: "/en/termini-restaurante",
        privacyLabel: "Privacy",
        termsLabel: "Terms",
      }}
    />
  );
}

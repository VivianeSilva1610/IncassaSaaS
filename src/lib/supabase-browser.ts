import { createBrowserClient } from "@supabase/ssr";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * rememberMe true (default): sessione persiste per un anno tra riavvii del browser.
 * rememberMe false: cookie di sessione, sparisce quando si chiude il browser.
 */
export function createClient(rememberMe: boolean = true) {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: {
      maxAge: rememberMe ? ONE_YEAR : undefined,
    },
  });
}

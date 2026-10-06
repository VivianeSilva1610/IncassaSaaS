import type { SupabaseClient } from "@supabase/supabase-js";

export const PRANZO_OWNER_EMAIL = "viroedu@gmail.com";

export async function getPranzoOwnerId(admin: SupabaseClient): Promise<string | null> {
  const { data: usersPage, error } = await admin.auth.admin.listUsers();
  if (error) return null;
  return usersPage.users.find((u) => u.email === PRANZO_OWNER_EMAIL)?.id ?? null;
}

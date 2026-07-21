import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only (Route Handlers), bypasses RLS. Never import this from a
 * Client Component or the service role key will end up in the browser bundle.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

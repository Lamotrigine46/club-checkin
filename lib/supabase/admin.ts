import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * 仅供服务端使用（Route Handlers），绕过 RLS。绝不能在 Client Component 中引用，
 * 否则 service role key 会被打进浏览器 bundle。
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

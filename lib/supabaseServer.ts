import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client dengan SERVICE ROLE KEY
 * - BYPASS RLS (Row Level Security)
 * - Gunakan hanya di server-side untuk operasi admin
 * - JANGAN expose ke client
 */
export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, service, { auth: { persistSession: false } });
}

/**
 * Supabase client dengan ANON KEY
 * - RLS BERLAKU
 * - Gunakan untuk operasi yang perlu mengecek permission user
 * - Aman untuk digunakan dengan user context
 */
export function supabaseWithRLS() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, { auth: { persistSession: false } });
}

/**
 * Supabase client dengan access token user
 * - RLS berlaku sesuai user yang login
 * - Gunakan untuk operasi yang perlu identity user
 */
export function supabaseWithToken(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseAdminClient: SupabaseClient | null = null;
let supabaseAnonClient: SupabaseClient | null = null;

export function getSupabaseUrl(): string | null {
  return process.env.SUPABASE_URL || null;
}

export function getSupabaseServiceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

export function getSupabaseAnonKey(): string | null {
  return process.env.SUPABASE_ANON_KEY || null;
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();
  return Boolean(url && serviceKey && url.startsWith("http"));
}

/**
 * Server-side Supabase Admin Client.
 * Uses SUPABASE_SERVICE_ROLE_KEY to perform privileged operations
 * (e.g. admin auth management, bypassing RLS when executing verified server logic).
 * NEVER expose this client or the service role key to frontend bundles.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseAdminClient) return supabaseAdminClient;

  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();

  if (!url || !serviceKey) {
    return null;
  }

  supabaseAdminClient = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdminClient;
}

/**
 * Server-side Supabase Anon Client for operations scoped to user tokens.
 */
export function getSupabaseAnon(): SupabaseClient | null {
  if (supabaseAnonClient) return supabaseAnonClient;

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey() || getSupabaseServiceRoleKey();

  if (!url || !anonKey) {
    return null;
  }

  supabaseAnonClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAnonClient;
}

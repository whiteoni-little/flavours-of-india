import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseAdminClient: SupabaseClient | null = null;
let supabaseAnonClient: SupabaseClient | null = null;

const FALLBACK_SUPABASE_URL = "https://zqmaorskilxfmodsznhf.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxbWFvcnNraWx4Zm1vZHN6bmhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMzA5NDEsImV4cCI6MjEwMzkwNjk0MX0.LJkgzCKEf6gM3dAkWeIzBSXeNKNSYrltR6x797r7Mbk";
const FALLBACK_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxbWFvcnNraWx4Zm1vZHN6bmhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODMzMDk0MSwiZXhwIjoyMTAzOTA2OTQxfQ.OICuOUSwjAcPRJfuw76OkZBMsGTAxEDkUJ7-fk_zKfw";

export function getSupabaseUrl(): string | null {
  return process.env.SUPABASE_URL || FALLBACK_SUPABASE_URL;
}

export function getSupabaseServiceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_KEY;
}

export function getSupabaseAnonKey(): string | null {
  return process.env.SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;
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

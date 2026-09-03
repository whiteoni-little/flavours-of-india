import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zqmaorskilxfmodsznhf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxbWFvcnNraWx4Zm1vZHN6bmhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMzA5NDEsImV4cCI6MjEwMzkwNjk0MX0.LJkgzCKEf6gM3dAkWeIzBSXeNKNSYrltR6x797r7Mbk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

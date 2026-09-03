import "dotenv/config";
import { getSupabaseAnon } from "../server/db/supabaseClient";

async function testLogin() {
  const supabase = getSupabaseAnon();
  if (!supabase) {
    console.error("No Supabase anon client");
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: "admin@flavoursofindia.com",
    password: "AdminPassword@2026",
  });

  if (error) {
    console.error("Sign in error:", error.message, error.status);
  } else {
    console.log("✅ Supabase Auth Sign in success! User:", data.user?.email, "Role:", data.user?.user_metadata?.role);
  }

  const { data: dData, error: dError } = await supabase.auth.signInWithPassword({
    email: "patrodurga4@gmail.com",
    password: "AdminPassword@2026",
  });

  if (dError) {
    console.error("Sign in error for Durga:", dError.message);
  } else {
    console.log("✅ Supabase Auth Sign in success for Durga:", dData.user?.email);
  }
}

testLogin();

import "dotenv/config";
import { getSupabaseAdmin, isSupabaseConfigured } from "../server/db/supabaseClient";

async function probe() {
  console.log("Checking Supabase connection with provided credentials...");
  console.log("isSupabaseConfigured():", isSupabaseConfigured());

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error("Failed to initialize Supabase client.");
    process.exit(1);
  }

  // 1. Test Auth API
  try {
    const { data: users, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error("Auth Admin Error:", authError.message);
    } else {
      console.log(`✅ Supabase Auth Connected! Found ${users?.users?.length || 0} user(s).`);
    }
  } catch (err: any) {
    console.error("Auth exception:", err.message);
  }

  // 2. Test Tables
  try {
    const { data: products, error: prodError } = await supabase
      .from("products")
      .select("count", { count: "exact", head: true });

    if (prodError) {
      console.log("⚠️ Notice on 'products' table:", prodError.message);
    } else {
      console.log("✅ 'products' table exists in Supabase PostgreSQL!");
    }
  } catch (err: any) {
    console.error("Table exception:", err.message);
  }

  // 3. Test Storage Buckets
  try {
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.error("Storage Error:", bucketError.message);
    } else {
      console.log(`✅ Supabase Storage Connected! Buckets:`, buckets?.map(b => b.name));
    }
  } catch (err: any) {
    console.error("Storage exception:", err.message);
  }

  process.exit(0);
}

probe();

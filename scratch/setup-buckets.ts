import "dotenv/config";
import { getSupabaseAdmin } from "../server/db/supabaseClient";

async function setupBuckets() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error("Supabase client not initialized.");
    process.exit(1);
  }

  const buckets = ["product-images", "payment-receipts"];

  for (const bucket of buckets) {
    const { data: existing } = await supabase.storage.getBucket(bucket);
    if (!existing) {
      const { error } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
      });
      if (error) {
        console.log(`Bucket '${bucket}' status:`, error.message);
      } else {
        console.log(`✅ Created Supabase Storage bucket: '${bucket}'`);
      }
    } else {
      console.log(`✅ Storage bucket '${bucket}' already exists.`);
    }
  }

  process.exit(0);
}

setupBuckets();

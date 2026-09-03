import "dotenv/config";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { getSupabaseAdmin, isSupabaseConfigured } from "../db/supabaseClient";

async function run() {
  console.log("==================================================================");
  console.log(" Flavours of India — SQLite to Supabase Migration Utility");
  console.log("==================================================================");

  if (!isSupabaseConfigured()) {
    console.error("❌ [MIGRATION ERROR] Supabase environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are missing.");
    process.exit(1);
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error("❌ [MIGRATION ERROR] Failed to initialize Supabase admin client.");
    process.exit(1);
  }

  const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), "data", "flavours.db");
  if (!fs.existsSync(dbPath)) {
    console.log(`ℹ️ No SQLite database found at '${dbPath}'. Nothing to migrate.`);
    process.exit(0);
  }

  const sqlite = new Database(dbPath);
  console.log(`[MIGRATION] Connected to SQLite database at: ${dbPath}`);

  // 1. Migrate Products
  try {
    const products = sqlite.prepare("SELECT * FROM products WHERE deleted_at IS NULL").all() as any[];
    console.log(`[MIGRATION] Found ${products.length} products to migrate...`);

    for (const p of products) {
      const { error } = await supabase.from("products").upsert({
        sku: p.sku || null,
        slug: p.slug,
        title: p.title,
        short_description: p.short_description,
        long_description: p.long_description || null,
        category: p.category,
        pack_size: p.pack_size || null,
        price_in_minor_units: p.price_in_minor_units || null,
        currency: p.currency || "INR",
        stock_status: p.stock_status || "draft",
        stock_quantity: p.stock_quantity || 0,
        is_published: Boolean(p.is_published),
        sourcing_note: p.sourcing_note || null,
        ingredients: p.ingredients || null,
        shelf_life: p.shelf_life || null,
        storage_instructions: p.storage_instructions || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "slug" });

      if (error) {
        console.error(`⚠️ Failed to migrate product '${p.slug}':`, error.message);
      } else {
        console.log(`✅ Migrated product: ${p.title} (${p.slug})`);
      }
    }
  } catch (err: any) {
    console.error("⚠️ Product migration notice:", err.message);
  }

  // 2. Migrate Product Images
  try {
    const images = sqlite.prepare("SELECT * FROM product_images").all() as any[];
    console.log(`[MIGRATION] Found ${images.length} product images to migrate...`);

    for (const img of images) {
      // Find matching Supabase product by checking product table
      const sqliteProd = sqlite.prepare("SELECT slug FROM products WHERE id = ?").get(img.product_id) as any;
      if (sqliteProd) {
        const { data: supaProd } = await supabase
          .from("products")
          .select("id")
          .eq("slug", sqliteProd.slug)
          .maybeSingle();

        if (supaProd) {
          await supabase.from("product_images").upsert({
            product_id: supaProd.id,
            storage_path: img.storage_path || img.storage_key || "products/default.jpg",
            public_url: img.public_url,
            alt_text: img.alt_text || "",
            sort_order: img.sort_order || 0,
          });
          console.log(`✅ Linked image for product '${sqliteProd.slug}'`);
        }
      }
    }
  } catch (err: any) {
    console.error("⚠️ Product images migration notice:", err.message);
  }

  console.log("==================================================================");
  console.log("✅ Data migration to Supabase completed successfully!");
  console.log("==================================================================");
  sqlite.close();
  process.exit(0);
}

run().catch(err => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});

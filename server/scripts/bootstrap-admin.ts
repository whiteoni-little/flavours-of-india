import "dotenv/config";
import { hashPassword } from "../auth";
import { db } from "../db";
import { getSupabaseAdmin, isSupabaseConfigured } from "../db/supabaseClient";

async function run() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const name = process.env.ADMIN_BOOTSTRAP_NAME || "Operations Admin";

  if (!email || !password) {
    console.error(
      "❌ [BOOTSTRAP ERROR] ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD environment variables are required."
    );
    console.error(
      "Usage example: ADMIN_BOOTSTRAP_EMAIL=owner@yourdomain.com ADMIN_BOOTSTRAP_PASSWORD=YourStrongSecretKey pnpm seed:admin"
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("❌ [BOOTSTRAP ERROR] Admin password must be at least 8 characters long.");
    process.exit(1);
  }

  console.log(`[BOOTSTRAP] Provisioning administrative credentials for: ${email}`);

  // 1. Supabase Auth Provisioning (Production)
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.error("❌ [BOOTSTRAP ERROR] Supabase is configured but admin client failed to initialize.");
      process.exit(1);
    }

    console.log("[BOOTSTRAP] Connecting to Supabase Auth...");

    // Check if user already exists
    const { data: userList } = await supabase.auth.admin.listUsers();
    const existing = (userList?.users || []).find(
      u => u.email?.toLowerCase() === email.toLowerCase()
    );

    let userId: string;

    if (existing) {
      console.log(`[BOOTSTRAP] Admin user exists in Supabase. Updating password & metadata...`);
      const { data: updated, error: updateError } =
        await supabase.auth.admin.updateUserById(existing.id, {
          password,
          user_metadata: { full_name: name, role: "admin" },
        });

      if (updateError) {
        console.error("❌ Failed to update Supabase admin user:", updateError.message);
        process.exit(1);
      }
      userId = updated.user.id;
    } else {
      console.log(`[BOOTSTRAP] Creating new admin user in Supabase Auth...`);
      const { data: created, error: createError } =
        await supabase.auth.admin.createUser({
          email: email.toLowerCase(),
          password,
          email_confirm: true,
          user_metadata: { full_name: name, role: "admin" },
        });

      if (createError) {
        console.error("❌ Failed to create Supabase admin user:", createError.message);
        process.exit(1);
      }
      userId = created.user.id;
    }

    // Upsert into profiles table
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: name,
      role: "admin",
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error("⚠️ Failed to upsert profile record:", profileError.message);
    } else {
      console.log(`✅ [BOOTSTRAP] Supabase Admin profile created with role 'admin' for ${email}`);
    }

    process.exit(0);
  }

  // 2. Local SQLite Provisioning (Isolated Offline Fallback)
  console.log("[BOOTSTRAP] Provisioning in local database...");
  const existingLocal = await db.getAdminUserByEmail(email);
  const passwordHash = await hashPassword(password);

  if (existingLocal) {
    (db as any).db
      .prepare(
        "UPDATE admin_users SET password_hash = ?, name = ?, role = 'admin', updated_at = ? WHERE id = ?"
      )
      .run(passwordHash, name, new Date().toISOString(), existingLocal.id);
    console.log(`✅ [BOOTSTRAP] Updated local admin user credentials for ${email}`);
  } else {
    const user = await db.createAdminUser({
      email,
      passwordHash,
      name,
      role: "admin",
    });
    console.log(`✅ [BOOTSTRAP] Created local admin user: ${user.email} (ID: ${user.id})`);
  }

  process.exit(0);
}

run().catch(err => {
  console.error("❌ [BOOTSTRAP ERROR]:", err);
  process.exit(1);
});

import "dotenv/config";
import { getSupabaseAdmin } from "../server/db/supabaseClient";
import { db } from "../server/db";
import { hashPassword } from "../server/auth";

async function setupAdminAccounts() {
  const adminEmails = [
    { email: "admin@flavoursofindia.com", name: "Flavours Operations Admin", password: "AdminPassword@2026" },
    { email: "patrodurga4@gmail.com", name: "Durga Prasad Patro", password: "AdminPassword@2026" },
  ];

  const supabase = getSupabaseAdmin();

  for (const acc of adminEmails) {
    console.log(`Setting up admin user: ${acc.email}`);

    // 1. Supabase Auth
    if (supabase) {
      try {
        const { data: list } = await supabase.auth.admin.listUsers();
        const existing = (list?.users || []).find(u => u.email?.toLowerCase() === acc.email.toLowerCase());

        let userId = "";
        if (existing) {
          console.log(`- Updating password for existing Supabase Auth user (${acc.email})...`);
          const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
            password: acc.password,
            email_confirm: true,
            user_metadata: { full_name: acc.name, role: "admin" },
          });
          if (error) console.error("Update error:", error.message);
          else userId = data.user.id;
        } else {
          console.log(`- Creating new Supabase Auth user (${acc.email})...`);
          const { data, error } = await supabase.auth.admin.createUser({
            email: acc.email.toLowerCase(),
            password: acc.password,
            email_confirm: true,
            user_metadata: { full_name: acc.name, role: "admin" },
          });
          if (error) console.error("Create error:", error.message);
          else userId = data.user.id;
        }

        if (userId) {
          // Upsert profiles table if exists
          try {
            await supabase.from("profiles").upsert({
              id: userId,
              full_name: acc.name,
              role: "admin",
              updated_at: new Date().toISOString(),
            });
          } catch (e: any) {
            // profiles table might be created later
          }
          console.log(`✅ Supabase Auth user configured: ${acc.email}`);
        }
      } catch (err: any) {
        console.error("Supabase Auth error:", err.message);
      }
    }

    // 2. Local Database
    try {
      const passwordHash = await hashPassword(acc.password);
      const existingLocal = await db.getAdminUserByEmail(acc.email);
      if (existingLocal) {
        (db as any).db
          .prepare("UPDATE admin_users SET password_hash = ?, name = ?, role = 'admin', updated_at = ? WHERE id = ?")
          .run(passwordHash, acc.name, new Date().toISOString(), existingLocal.id);
      } else {
        await db.createAdminUser({
          email: acc.email,
          passwordHash,
          name: acc.name,
          role: "admin",
        });
      }
      console.log(`✅ Local database admin configured: ${acc.email}`);
    } catch (err: any) {
      console.error("Local db error:", err.message);
    }
  }

  process.exit(0);
}

setupAdminAccounts();

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import {
  getSupabaseAdmin,
  isSupabaseConfigured,
} from "./supabaseClient";
import type {
  AdminSession,
  AdminUser,
  AuditLog,
  Cart,
  CartItem,
  CartItemWithProduct,
  CartNote,
  CartStatus,
  ImportLog,
  NotificationChannel,
  NotificationRecord,
  NotificationType,
  Order,
  OrderItem,
  OrderStatus,
  OrderWithItems,
  PackingTask,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Product,
  ProductImage,
  ProductWithImages,
  ReturnRequest,
  Shipment,
  StockStatus,
  UserProfile,
  UserRole,
} from "./schema";

export class DatabaseService {
  private db: Database.Database;
  private memorySessions = new Map<
    string,
    { session: AdminSession; user: AdminUser }
  >();

  constructor(dbPath?: string) {
    try {
      const defaultPath = process.env.VERCEL
        ? path.join("/tmp", "flavours.db")
        : path.join(process.cwd(), "data", "flavours.db");
      const targetPath = dbPath || process.env.SQLITE_DB_PATH || defaultPath;
      if (targetPath !== ":memory:") {
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) {
          try {
            fs.mkdirSync(dir, { recursive: true });
          } catch {
            // Ignore mkdir errors if directory exists or in read-only environment
          }
        }
      }
      this.db = new Database(targetPath);
      this.db.pragma("busy_timeout = 5000");
      this.db.pragma("journal_mode = WAL");
      this.db.pragma("foreign_keys = ON");
      this.migrateSqlite();
    } catch (err: any) {
      console.warn(
        "[DB] Local SQLite unavailable, using Supabase and in-memory session store:",
        err?.message
      );
      this.db = null as any;
    }
  }

  /**
   * Initializes local SQLite tables for offline testing and isolated local dev.
   */
  public migrateSqlite() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_login_at TEXT
      );

      CREATE TABLE IF NOT EXISTS admin_sessions (
        id TEXT PRIMARY KEY,
        admin_user_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        full_name TEXT,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'customer',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        sku TEXT UNIQUE,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        short_description TEXT NOT NULL,
        long_description TEXT,
        category TEXT NOT NULL,
        pack_size TEXT,
        price_in_minor_units INTEGER,
        currency TEXT NOT NULL DEFAULT 'INR',
        stock_status TEXT NOT NULL DEFAULT 'draft',
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        is_published INTEGER NOT NULL DEFAULT 0,
        sourcing_note TEXT,
        ingredients TEXT,
        allergen_information TEXT,
        shelf_life TEXT,
        storage_instructions TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        created_by TEXT,
        updated_by TEXT
      );

      CREATE TABLE IF NOT EXISTS product_images (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        public_url TEXT NOT NULL,
        alt_text TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        phone TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS carts (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        user_id TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        currency TEXT NOT NULL DEFAULT 'INR',
        last_activity_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS cart_items (
        id TEXT PRIMARY KEY,
        cart_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price_in_minor_units INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS cart_notes (
        id TEXT PRIMARY KEY,
        cart_id TEXT NOT NULL,
        author_admin_id TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
        FOREIGN KEY (author_admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_number TEXT UNIQUE NOT NULL,
        customer_id TEXT,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_email TEXT,
        shipping_address_line1 TEXT NOT NULL,
        shipping_address_line2 TEXT,
        shipping_city TEXT NOT NULL,
        shipping_state TEXT NOT NULL,
        shipping_pincode TEXT NOT NULL,
        shipping_landmark TEXT,
        subtotal_in_minor_units INTEGER NOT NULL,
        shipping_fee_in_minor_units INTEGER NOT NULL DEFAULT 0,
        discount_in_minor_units INTEGER NOT NULL DEFAULT 0,
        total_in_minor_units INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'INR',
        payment_method TEXT NOT NULL,
        payment_status TEXT NOT NULL,
        order_status TEXT NOT NULL,
        customer_notes TEXT,
        admin_notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id TEXT,
        product_title_snapshot TEXT NOT NULL,
        pack_size_snapshot TEXT,
        unit_price_in_minor_units INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        subtotal_in_minor_units INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        method TEXT NOT NULL,
        status TEXT NOT NULL,
        amount_in_minor_units INTEGER NOT NULL,
        upi_reference TEXT,
        screenshot_url TEXT,
        verified_by TEXT,
        verified_at TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS packing_tasks (
        id TEXT PRIMARY KEY,
        order_id TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        assignee TEXT,
        packing_notes TEXT,
        started_at TEXT,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS shipments (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        courier_name TEXT NOT NULL,
        tracking_number TEXT NOT NULL,
        shipping_status TEXT NOT NULL DEFAULT 'manifested',
        shipping_date TEXT NOT NULL,
        expected_delivery_date TEXT,
        delivered_at TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS return_requests (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        customer_reason TEXT NOT NULL,
        internal_decision TEXT,
        status TEXT NOT NULL DEFAULT 'requested',
        refund_amount_in_minor_units INTEGER,
        refund_method TEXT,
        refund_reference TEXT,
        reviewed_by TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        order_id TEXT,
        channel TEXT NOT NULL,
        notification_type TEXT NOT NULL,
        recipient TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued',
        provider_message_id TEXT,
        retry_count INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        idempotency_key TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        admin_user_id TEXT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS import_logs (
        id TEXT PRIMARY KEY,
        admin_user_id TEXT,
        file_name TEXT NOT NULL,
        import_type TEXT NOT NULL,
        total_rows INTEGER NOT NULL DEFAULT 0,
        imported_rows INTEGER NOT NULL DEFAULT 0,
        failed_rows INTEGER NOT NULL DEFAULT 0,
        errors TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_products_published ON products(is_published);
      CREATE INDEX IF NOT EXISTS idx_products_deleted ON products(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
    `);

    // Ensure all columns exist on older SQLite development databases
    const ensureCol = (tbl: string, col: string, typeDef: string) => {
      try {
        this.db.exec(`ALTER TABLE ${tbl} ADD COLUMN ${col} ${typeDef};`);
      } catch {}
    };

    ensureCol("products", "sku", "TEXT");
    ensureCol("products", "pack_size", "TEXT");
    ensureCol("products", "allergen_information", "TEXT");
    ensureCol("products", "storage_instructions", "TEXT");
    ensureCol("products", "created_by", "TEXT");
    ensureCol("products", "updated_by", "TEXT");
    ensureCol("products", "stock_quantity", "INTEGER NOT NULL DEFAULT 0");
    ensureCol("products", "currency", "TEXT NOT NULL DEFAULT 'INR'");
    ensureCol("products", "price_in_minor_units", "INTEGER");
    ensureCol("products", "is_published", "INTEGER NOT NULL DEFAULT 0");
    ensureCol("products", "deleted_at", "TEXT");

    ensureCol("product_images", "storage_path", "TEXT");
    ensureCol("product_images", "public_url", "TEXT");
    ensureCol("product_images", "alt_text", "TEXT DEFAULT ''");
    ensureCol("product_images", "sort_order", "INTEGER DEFAULT 0");

    ensureCol("payments", "screenshot_url", "TEXT");
  }

  // ==========================================================================
  // Admin User & Profile Management
  // ==========================================================================

  public async getAdminUsers(params?: {
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ users: AdminUser[]; total: number }> {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 25;
    const offset = (page - 1) * pageSize;
    const search = params?.search?.toLowerCase();

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: usersResp, error } = await supabase.auth.admin.listUsers();
        if (!error && usersResp?.users) {
          let list = usersResp.users;
          if (search) {
            list = list.filter(
              u =>
                u.email?.toLowerCase().includes(search) ||
                (u.user_metadata?.full_name as string)?.toLowerCase().includes(search)
            );
          }
          const total = list.length;
          const paged = list.slice(offset, offset + pageSize);
          const mapped: AdminUser[] = paged.map(u => ({
            id: u.id,
            email: u.email || "",
            name: (u.user_metadata?.full_name as string) || "Admin",
            role: (u.user_metadata?.role as UserRole) || "admin",
            createdAt: u.created_at,
            updatedAt: u.created_at,
            lastLoginAt: u.last_sign_in_at || null,
          }));
          return { users: mapped, total };
        }
      }
    }

    let countSql = "SELECT COUNT(*) as total FROM admin_users";
    let dataSql = "SELECT * FROM admin_users";
    const args: any[] = [];

    if (search) {
      countSql += " WHERE lower(name) LIKE ? OR lower(email) LIKE ?";
      dataSql += " WHERE lower(name) LIKE ? OR lower(email) LIKE ?";
      args.push(`%${search}%`, `%${search}%`);
    }

    dataSql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    const totalRow = this.db.prepare(countSql).get(...args) as any;
    const rows = this.db.prepare(dataSql).all(...args, pageSize, offset) as any[];

    return {
      total: totalRow?.total || 0,
      users: rows.map(r => ({
        id: r.id,
        email: r.email,
        passwordHash: r.password_hash,
        name: r.name,
        role: r.role as UserRole,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        lastLoginAt: r.last_login_at,
      })),
    };
  }

  public async getAdminUserByEmail(email: string): Promise<AdminUser | null> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: users, error } = await supabase.auth.admin.listUsers();
        if (!error && users && users.users) {
          const authUser = users.users.find(
            u => u.email?.toLowerCase() === email.toLowerCase()
          );
          if (authUser) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", authUser.id)
              .maybeSingle();

            return {
              id: authUser.id,
              email: authUser.email || email,
              name: profile?.full_name || authUser.user_metadata?.full_name || "Admin",
              role: (profile?.role as UserRole) || "admin",
              createdAt: authUser.created_at,
              updatedAt: profile?.updated_at || authUser.created_at,
              lastLoginAt: authUser.last_sign_in_at || null,
            };
          }
        }
      }
    }

    // Local SQLite fallback
    const row = this.db
      .prepare("SELECT * FROM admin_users WHERE lower(email) = lower(?)")
      .get(email) as any;
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      name: row.name,
      role: row.role as UserRole,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLoginAt: row.last_login_at,
    };
  }

  public async getAdminUserById(id: string): Promise<AdminUser | null> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: userResp, error } = await supabase.auth.admin.getUserById(id);
        if (!error && userResp?.user) {
          const u = userResp.user;
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", id)
            .maybeSingle();

          return {
            id: u.id,
            email: u.email || "",
            name: profile?.full_name || u.user_metadata?.full_name || "Admin",
            role: (profile?.role as UserRole) || "admin",
            createdAt: u.created_at,
            updatedAt: profile?.updated_at || u.created_at,
            lastLoginAt: u.last_sign_in_at || null,
          };
        }
      }
    }

    const row = this.db
      .prepare("SELECT * FROM admin_users WHERE id = ?")
      .get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      name: row.name,
      role: row.role as UserRole,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLoginAt: row.last_login_at,
    };
  }

  public async createAdminUser(data: {
    email: string;
    passwordHash?: string;
    password?: string;
    name: string;
    role?: UserRole;
  }): Promise<AdminUser> {
    const role = data.role || "admin";

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        // Create user in Supabase Auth
        const { data: authData, error: authError } =
          await supabase.auth.admin.createUser({
            email: data.email.toLowerCase(),
            password: data.password || "TempSecurePassword@2026",
            email_confirm: true,
            user_metadata: {
              full_name: data.name,
              role,
            },
          });

        if (authError) {
          throw new Error(`Supabase Auth creation failed: ${authError.message}`);
        }

        const userId = authData.user.id;

        // Upsert profile
        await supabase.from("profiles").upsert({
          id: userId,
          full_name: data.name,
          role,
          updated_at: new Date().toISOString(),
        });

        return {
          id: userId,
          email: data.email.toLowerCase(),
          name: data.name,
          role,
          createdAt: authData.user.created_at,
          updatedAt: authData.user.created_at,
          lastLoginAt: null,
        };
      }
    }

    // Local fallback
    const now = new Date().toISOString();
    const id = nanoid();
    this.db
      .prepare(
        `
      INSERT INTO admin_users (id, email, password_hash, name, role, created_at, updated_at, last_login_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
    `
      )
      .run(
        id,
        data.email.toLowerCase(),
        data.passwordHash || "",
        data.name,
        role,
        now,
        now
      );

    return {
      id,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      name: data.name,
      role,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
    };
  }

  public async updateAdminUserLastLogin(id: string): Promise<void> {
    const now = new Date().toISOString();
    this.db
      .prepare(
        "UPDATE admin_users SET last_login_at = ?, updated_at = ? WHERE id = ?"
      )
      .run(now, now, id);
  }

  public async countAdminUsers(): Promise<number> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { count, error } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .in("role", ["admin", "staff"]);
        if (!error && typeof count === "number") return count;
      }
    }

    const res = this.db
      .prepare("SELECT count(*) as count FROM admin_users")
      .get() as any;
    return res?.count || 0;
  }

  // --- Session Management (Local / Fallback) ---
  public async createAdminSession(
    adminUserId: string,
    expiresAt: Date,
    userInfo?: { email?: string; name?: string; role?: UserRole }
  ): Promise<AdminSession> {
    const id = nanoid(32);
    const now = new Date().toISOString();

    const sessionObj: AdminSession = {
      id,
      adminUserId,
      expiresAt: expiresAt.toISOString(),
      createdAt: now,
    };

    const userObj: AdminUser = {
      id: adminUserId,
      email: userInfo?.email || `${adminUserId}@flavoursofindia.com`,
      name: userInfo?.name || "Admin",
      role: userInfo?.role || "admin",
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
    };

    this.memorySessions.set(id, { session: sessionObj, user: userObj });

    if (this.db) {
      try {
        const existing = this.db
          .prepare("SELECT id FROM admin_users WHERE id = ?")
          .get(adminUserId);

        if (!existing) {
          this.db
            .prepare(
              `INSERT OR IGNORE INTO admin_users (id, email, password_hash, name, role, created_at, updated_at)
               VALUES (?, ?, '', ?, ?, ?, ?)`
            )
            .run(
              adminUserId,
              userInfo?.email || `${adminUserId}@supabase.user`,
              userInfo?.name || "Admin",
              userInfo?.role || "admin",
              now,
              now
            );
        }

        this.db
          .prepare(
            `
          INSERT INTO admin_sessions (id, admin_user_id, expires_at, created_at)
          VALUES (?, ?, ?, ?)
        `
          )
          .run(id, adminUserId, expiresAt.toISOString(), now);
      } catch (err) {
        console.warn("[DB] SQLite session write skipped:", err);
      }
    }

    return sessionObj;
  }

  public async getAdminSession(
    sessionId: string
  ): Promise<{ session: AdminSession; user: AdminUser } | null> {
    const memory = this.memorySessions.get(sessionId);
    if (memory) {
      const expiresAt = new Date(memory.session.expiresAt);
      if (expiresAt.getTime() > Date.now()) {
        return memory;
      }
      this.memorySessions.delete(sessionId);
      return null;
    }

    if (!this.db) return null;

    try {
      const row = this.db
        .prepare(
          `
        SELECT s.id as session_id, s.admin_user_id, s.expires_at, s.created_at as session_created_at,
               u.id as user_id, u.email, u.name, u.role, u.password_hash, u.created_at as user_created_at,
               u.updated_at as user_updated_at, u.last_login_at
        FROM admin_sessions s
        JOIN admin_users u ON u.id = s.admin_user_id
        WHERE s.id = ?
      `
        )
        .get(sessionId) as any;

      if (!row) return null;

      const expiresAt = new Date(row.expires_at);
      if (expiresAt.getTime() <= Date.now()) {
        this.deleteAdminSession(sessionId);
        return null;
      }

      return {
        session: {
          id: row.session_id,
          adminUserId: row.admin_user_id,
          expiresAt: row.expires_at,
          createdAt: row.session_created_at,
        },
        user: {
          id: row.user_id,
          email: row.email,
          passwordHash: row.password_hash,
          name: row.name,
          role: row.role as UserRole,
          createdAt: row.user_created_at,
          updatedAt: row.user_updated_at,
          lastLoginAt: row.last_login_at,
        },
      };
    } catch {
      return null;
    }
  }

  public async deleteAdminSession(sessionId: string): Promise<void> {
    this.memorySessions.delete(sessionId);
    if (this.db) {
      try {
        this.db.prepare("DELETE FROM admin_sessions WHERE id = ?").run(sessionId);
      } catch {}
    }
  }

  // ==========================================================================
  // Products Management
  // ==========================================================================

  private formatProduct(row: any): Product {
    return {
      id: row.id,
      sku: row.sku || null,
      slug: row.slug,
      title: row.title,
      shortDescription: row.short_description,
      longDescription: row.long_description || null,
      category: row.category,
      packSize: row.pack_size || null,
      priceInMinorUnits: row.price_in_minor_units,
      currency: row.currency || "INR",
      stockStatus: (row.stock_status as StockStatus) || "draft",
      stockQuantity: typeof row.stock_quantity === "number" ? row.stock_quantity : 0,
      isPublished: Boolean(row.is_published),
      sourcingNote: row.sourcing_note || null,
      ingredients: row.ingredients || null,
      allergenInformation: row.allergen_information || null,
      shelfLife: row.shelf_life || null,
      storageInstructions: row.storage_instructions || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at || null,
      createdBy: row.created_by || null,
      updatedBy: row.updated_by || null,
    };
  }

  public async getProductImages(productId: string): Promise<ProductImage[]> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data, error } = await supabase
          .from("product_images")
          .select("*")
          .eq("product_id", productId)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true });

        if (!error && data) {
          return data.map(r => ({
            id: r.id,
            productId: r.product_id,
            storagePath: r.storage_path,
            publicUrl: r.public_url,
            altText: r.alt_text || "",
            sortOrder: r.sort_order || 0,
            createdAt: r.created_at,
          }));
        }
      }
    }

    const rows = this.db
      .prepare(
        `SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, created_at ASC`
      )
      .all(productId) as any[];

    return rows.map(r => ({
      id: r.id,
      productId: r.product_id,
      storagePath: r.storage_path || r.storage_key,
      publicUrl: r.public_url,
      altText: r.alt_text || "",
      sortOrder: r.sort_order || 0,
      createdAt: r.created_at,
    }));
  }

  public async getPublicProducts(opts: {
    category?: string;
    search?: string;
    page?: number;
    pageSize?: number;
    sort?: string;
  }): Promise<{
    products: ProductWithImages[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    categories: string[];
  }> {
    const page = Math.max(1, opts.page || 1);
    const pageSize = Math.min(50, Math.max(1, opts.pageSize || 12));
    const offset = (page - 1) * pageSize;

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        let query = supabase
          .from("products")
          .select("*, product_images(*)", { count: "exact" })
          .is("deleted_at", null)
          .eq("is_published", true);

        if (opts.category && opts.category.trim() && opts.category.toLowerCase() !== "all") {
          query = query.ilike("category", opts.category.trim());
        }

        if (opts.search && opts.search.trim()) {
          const term = `%${opts.search.trim()}%`;
          query = query.or(`title.ilike.${term},short_description.ilike.${term},category.ilike.${term}`);
        }

        if (opts.sort === "price_asc") {
          query = query.order("price_in_minor_units", { ascending: true, nullsFirst: false });
        } else if (opts.sort === "price_desc") {
          query = query.order("price_in_minor_units", { ascending: false, nullsFirst: false });
        } else if (opts.sort === "title_asc") {
          query = query.order("title", { ascending: true });
        } else {
          query = query.order("created_at", { ascending: false });
        }

        const { data, count, error } = await query.range(offset, offset + pageSize - 1);

        if (!error && data) {
          const total = count || 0;
          const products: ProductWithImages[] = data.map(r => ({
            ...this.formatProduct(r),
            images: (r.product_images || []).map((img: any) => ({
              id: img.id,
              productId: img.product_id,
              storagePath: img.storage_path,
              publicUrl: img.public_url,
              altText: img.alt_text || "",
              sortOrder: img.sort_order || 0,
              createdAt: img.created_at,
            })),
          }));

          // Fetch distinct categories
          const { data: catData } = await supabase
            .from("products")
            .select("category")
            .is("deleted_at", null)
            .eq("is_published", true);

          const categories = Array.from(new Set((catData || []).map(c => c.category))).sort();

          return {
            products,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize) || 1,
            categories,
          };
        }
      }
    }

    // Local SQLite fallback
    let whereClause = "deleted_at IS NULL AND is_published = 1";
    const params: any[] = [];

    if (opts.category && opts.category.trim() && opts.category.toLowerCase() !== "all") {
      whereClause += " AND lower(category) = lower(?)";
      params.push(opts.category.trim());
    }

    if (opts.search && opts.search.trim()) {
      whereClause += " AND (title LIKE ? OR short_description LIKE ? OR category LIKE ?)";
      const term = `%${opts.search.trim()}%`;
      params.push(term, term, term);
    }

    let orderBy = "created_at DESC";
    if (opts.sort === "price_asc") {
      orderBy = "price_in_minor_units ASC, created_at DESC";
    } else if (opts.sort === "price_desc") {
      orderBy = "price_in_minor_units DESC, created_at DESC";
    } else if (opts.sort === "title_asc") {
      orderBy = "title ASC";
    }

    const countRow = this.db
      .prepare(`SELECT count(*) as total FROM products WHERE ${whereClause}`)
      .get(...params) as any;
    const total = countRow?.total || 0;

    const rows = this.db
      .prepare(`SELECT * FROM products WHERE ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`)
      .all(...params, pageSize, offset) as any[];

    const products: ProductWithImages[] = [];
    for (const r of rows) {
      const prod = this.formatProduct(r);
      const images = await this.getProductImages(prod.id);
      products.push({ ...prod, images });
    }

    const catRows = this.db
      .prepare(
        `SELECT DISTINCT category FROM products WHERE deleted_at IS NULL AND is_published = 1 ORDER BY category ASC`
      )
      .all() as any[];
    const categories = catRows.map(c => c.category);

    return {
      products,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
      categories,
    };
  }

  public async getPublicProductBySlug(slug: string): Promise<ProductWithImages | null> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data, error } = await supabase
          .from("products")
          .select("*, product_images(*)")
          .eq("slug", slug)
          .is("deleted_at", null)
          .eq("is_published", true)
          .maybeSingle();

        if (!error && data) {
          const prod = this.formatProduct(data);
          return {
            ...prod,
            images: (data.product_images || []).map((img: any) => ({
              id: img.id,
              productId: img.product_id,
              storagePath: img.storage_path,
              publicUrl: img.public_url,
              altText: img.alt_text || "",
              sortOrder: img.sort_order || 0,
              createdAt: img.created_at,
            })),
          };
        }
        return null;
      }
    }

    const row = this.db
      .prepare(
        `SELECT * FROM products WHERE slug = ? AND deleted_at IS NULL AND is_published = 1`
      )
      .get(slug) as any;

    if (!row) return null;
    const prod = this.formatProduct(row);
    const images = await this.getProductImages(prod.id);
    return { ...prod, images };
  }

  public async getAdminProducts(opts: {
    category?: string;
    stockStatus?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    products: ProductWithImages[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    categories: string[];
  }> {
    const page = Math.max(1, opts.page || 1);
    const pageSize = Math.min(100, Math.max(1, opts.pageSize || 20));
    const offset = (page - 1) * pageSize;

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        let query = supabase
          .from("products")
          .select("*, product_images(*)", { count: "exact" })
          .is("deleted_at", null);

        if (opts.category && opts.category.trim() && opts.category.toLowerCase() !== "all") {
          query = query.ilike("category", opts.category.trim());
        }

        if (opts.stockStatus && opts.stockStatus.trim() && opts.stockStatus.toLowerCase() !== "all") {
          query = query.eq("stock_status", opts.stockStatus.trim());
        }

        if (opts.search && opts.search.trim()) {
          const term = `%${opts.search.trim()}%`;
          query = query.or(`title.ilike.${term},short_description.ilike.${term},category.ilike.${term},slug.ilike.${term}`);
        }

        query = query.order("created_at", { ascending: false });

        const { data, count, error } = await query.range(offset, offset + pageSize - 1);

        if (!error && data) {
          const total = count || 0;
          const products: ProductWithImages[] = data.map(r => ({
            ...this.formatProduct(r),
            images: (r.product_images || []).map((img: any) => ({
              id: img.id,
              productId: img.product_id,
              storagePath: img.storage_path,
              publicUrl: img.public_url,
              altText: img.alt_text || "",
              sortOrder: img.sort_order || 0,
              createdAt: img.created_at,
            })),
          }));

          const { data: catData } = await supabase
            .from("products")
            .select("category")
            .is("deleted_at", null);

          const categories = Array.from(new Set((catData || []).map(c => c.category))).sort();

          return {
            products,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize) || 1,
            categories,
          };
        }
      }
    }

    // Local SQLite fallback
    let whereClause = "deleted_at IS NULL";
    const params: any[] = [];

    if (opts.category && opts.category.trim() && opts.category.toLowerCase() !== "all") {
      whereClause += " AND lower(category) = lower(?)";
      params.push(opts.category.trim());
    }

    if (opts.stockStatus && opts.stockStatus.trim() && opts.stockStatus.toLowerCase() !== "all") {
      whereClause += " AND stock_status = ?";
      params.push(opts.stockStatus.trim());
    }

    if (opts.search && opts.search.trim()) {
      whereClause += " AND (title LIKE ? OR short_description LIKE ? OR category LIKE ? OR slug LIKE ?)";
      const term = `%${opts.search.trim()}%`;
      params.push(term, term, term, term);
    }

    const countRow = this.db
      .prepare(`SELECT count(*) as total FROM products WHERE ${whereClause}`)
      .get(...params) as any;
    const total = countRow?.total || 0;

    const rows = this.db
      .prepare(`SELECT * FROM products WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(...params, pageSize, offset) as any[];

    const products: ProductWithImages[] = [];
    for (const r of rows) {
      const prod = this.formatProduct(r);
      const images = await this.getProductImages(prod.id);
      products.push({ ...prod, images });
    }

    const catRows = this.db
      .prepare(`SELECT DISTINCT category FROM products WHERE deleted_at IS NULL ORDER BY category ASC`)
      .all() as any[];
    const categories = catRows.map(c => c.category);

    return {
      products,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
      categories,
    };
  }

  public async getAdminProductById(id: string): Promise<ProductWithImages | null> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data, error } = await supabase
          .from("products")
          .select("*, product_images(*)")
          .eq("id", id)
          .is("deleted_at", null)
          .maybeSingle();

        if (!error && data) {
          const prod = this.formatProduct(data);
          return {
            ...prod,
            images: (data.product_images || []).map((img: any) => ({
              id: img.id,
              productId: img.product_id,
              storagePath: img.storage_path,
              publicUrl: img.public_url,
              altText: img.alt_text || "",
              sortOrder: img.sort_order || 0,
              createdAt: img.created_at,
            })),
          };
        }
      }
    }

    const row = this.db
      .prepare("SELECT * FROM products WHERE id = ? AND deleted_at IS NULL")
      .get(id) as any;
    if (!row) return null;
    const prod = this.formatProduct(row);
    const images = await this.getProductImages(prod.id);
    return { ...prod, images };
  }

  public async getProductBySlugAny(slug: string): Promise<Product | null> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data } = await supabase
          .from("products")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();
        if (data) return this.formatProduct(data);
        return null;
      }
    }

    const row = this.db
      .prepare("SELECT * FROM products WHERE slug = ?")
      .get(slug) as any;
    if (!row) return null;
    return this.formatProduct(row);
  }

  public async createProduct(data: {
    sku?: string | null;
    slug: string;
    title: string;
    shortDescription: string;
    longDescription?: string | null;
    category: string;
    packSize?: string | null;
    priceInMinorUnits?: number | null;
    currency?: string;
    stockStatus?: StockStatus;
    stockQuantity?: number;
    isPublished?: boolean;
    sourcingNote?: string | null;
    ingredients?: string | null;
    allergenInformation?: string | null;
    shelfLife?: string | null;
    storageInstructions?: string | null;
    createdBy?: string | null;
  }): Promise<ProductWithImages> {
    const id = nanoid();
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: inserted, error } = await supabase
          .from("products")
          .insert({
            sku: data.sku || null,
            slug: data.slug,
            title: data.title,
            short_description: data.shortDescription,
            long_description: data.longDescription || null,
            category: data.category,
            pack_size: data.packSize || null,
            price_in_minor_units: data.priceInMinorUnits ?? null,
            currency: data.currency || "INR",
            stock_status: data.stockStatus || "draft",
            stock_quantity: data.stockQuantity ?? 0,
            is_published: Boolean(data.isPublished),
            sourcing_note: data.sourcingNote || null,
            ingredients: data.ingredients || null,
            allergen_information: data.allergenInformation || null,
            shelf_life: data.shelfLife || null,
            storage_instructions: data.storageInstructions || null,
            created_by: data.createdBy || null,
            updated_by: data.createdBy || null,
          })
          .select("*, product_images(*)")
          .single();

        if (error) {
          throw new Error(`Supabase product create error: ${error.message}`);
        }

        return {
          ...this.formatProduct(inserted),
          images: [],
        };
      }
    }

    this.db
      .prepare(
        `
      INSERT INTO products (
        id, sku, slug, title, short_description, long_description, category, pack_size,
        price_in_minor_units, currency, stock_status, stock_quantity, is_published,
        sourcing_note, ingredients, allergen_information, shelf_life, storage_instructions,
        created_at, updated_at, deleted_at, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
    `
      )
      .run(
        id,
        data.sku || null,
        data.slug,
        data.title,
        data.shortDescription,
        data.longDescription || null,
        data.category,
        data.packSize || null,
        data.priceInMinorUnits ?? null,
        data.currency || "INR",
        data.stockStatus || "draft",
        data.stockQuantity ?? 0,
        data.isPublished ? 1 : 0,
        data.sourcingNote || null,
        data.ingredients || null,
        data.allergenInformation || null,
        data.shelfLife || null,
        data.storageInstructions || null,
        now,
        now,
        data.createdBy || null,
        data.createdBy || null
      );

    return {
      id,
      sku: data.sku || null,
      slug: data.slug,
      title: data.title,
      shortDescription: data.shortDescription,
      longDescription: data.longDescription || null,
      category: data.category,
      packSize: data.packSize || null,
      priceInMinorUnits: data.priceInMinorUnits ?? null,
      currency: data.currency || "INR",
      stockStatus: data.stockStatus || "draft",
      stockQuantity: data.stockQuantity ?? 0,
      isPublished: Boolean(data.isPublished),
      sourcingNote: data.sourcingNote || null,
      ingredients: data.ingredients || null,
      allergenInformation: data.allergenInformation || null,
      shelfLife: data.shelfLife || null,
      storageInstructions: data.storageInstructions || null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: data.createdBy || null,
      updatedBy: data.createdBy || null,
      images: [],
    };
  }

  public async updateProduct(
    id: string,
    data: Partial<{
      sku: string | null;
      slug: string;
      title: string;
      shortDescription: string;
      longDescription: string | null;
      category: string;
      packSize: string | null;
      priceInMinorUnits: number | null;
      currency: string;
      stockStatus: StockStatus;
      stockQuantity: number;
      isPublished: boolean;
      sourcingNote: string | null;
      ingredients: string | null;
      allergenInformation: string | null;
      shelfLife: string | null;
      storageInstructions: string | null;
      updatedBy: string | null;
    }>
  ): Promise<ProductWithImages | null> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const payload: any = { updated_at: new Date().toISOString() };
        if (data.sku !== undefined) payload.sku = data.sku;
        if (data.slug !== undefined) payload.slug = data.slug;
        if (data.title !== undefined) payload.title = data.title;
        if (data.shortDescription !== undefined) payload.short_description = data.shortDescription;
        if (data.longDescription !== undefined) payload.long_description = data.longDescription;
        if (data.category !== undefined) payload.category = data.category;
        if (data.packSize !== undefined) payload.pack_size = data.packSize;
        if (data.priceInMinorUnits !== undefined) payload.price_in_minor_units = data.priceInMinorUnits;
        if (data.currency !== undefined) payload.currency = data.currency;
        if (data.stockStatus !== undefined) payload.stock_status = data.stockStatus;
        if (data.stockQuantity !== undefined) payload.stock_quantity = data.stockQuantity;
        if (data.isPublished !== undefined) payload.is_published = data.isPublished;
        if (data.sourcingNote !== undefined) payload.sourcing_note = data.sourcingNote;
        if (data.ingredients !== undefined) payload.ingredients = data.ingredients;
        if (data.allergenInformation !== undefined) payload.allergen_information = data.allergenInformation;
        if (data.shelfLife !== undefined) payload.shelf_life = data.shelfLife;
        if (data.storageInstructions !== undefined) payload.storage_instructions = data.storageInstructions;
        if (data.updatedBy !== undefined) payload.updated_by = data.updatedBy;

        const { error } = await supabase.from("products").update(payload).eq("id", id);
        if (error) throw new Error(`Supabase update error: ${error.message}`);
        return this.getAdminProductById(id);
      }
    }

    const existing = await this.getAdminProductById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];
    const now = new Date().toISOString();

    if (data.sku !== undefined) {
      updates.push("sku = ?");
      params.push(data.sku);
    }
    if (data.slug !== undefined) {
      updates.push("slug = ?");
      params.push(data.slug);
    }
    if (data.title !== undefined) {
      updates.push("title = ?");
      params.push(data.title);
    }
    if (data.shortDescription !== undefined) {
      updates.push("short_description = ?");
      params.push(data.shortDescription);
    }
    if (data.longDescription !== undefined) {
      updates.push("long_description = ?");
      params.push(data.longDescription);
    }
    if (data.category !== undefined) {
      updates.push("category = ?");
      params.push(data.category);
    }
    if (data.packSize !== undefined) {
      updates.push("pack_size = ?");
      params.push(data.packSize);
    }
    if (data.priceInMinorUnits !== undefined) {
      updates.push("price_in_minor_units = ?");
      params.push(data.priceInMinorUnits);
    }
    if (data.currency !== undefined) {
      updates.push("currency = ?");
      params.push(data.currency);
    }
    if (data.stockStatus !== undefined) {
      updates.push("stock_status = ?");
      params.push(data.stockStatus);
    }
    if (data.stockQuantity !== undefined) {
      updates.push("stock_quantity = ?");
      params.push(data.stockQuantity);
    }
    if (data.isPublished !== undefined) {
      updates.push("is_published = ?");
      params.push(data.isPublished ? 1 : 0);
    }
    if (data.sourcingNote !== undefined) {
      updates.push("sourcing_note = ?");
      params.push(data.sourcingNote);
    }
    if (data.ingredients !== undefined) {
      updates.push("ingredients = ?");
      params.push(data.ingredients);
    }
    if (data.allergenInformation !== undefined) {
      updates.push("allergen_information = ?");
      params.push(data.allergenInformation);
    }
    if (data.shelfLife !== undefined) {
      updates.push("shelf_life = ?");
      params.push(data.shelfLife);
    }
    if (data.storageInstructions !== undefined) {
      updates.push("storage_instructions = ?");
      params.push(data.storageInstructions);
    }
    if (data.updatedBy !== undefined) {
      updates.push("updated_by = ?");
      params.push(data.updatedBy);
    }

    updates.push("updated_at = ?");
    params.push(now);
    params.push(id);

    this.db
      .prepare(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`)
      .run(...params);

    return this.getAdminProductById(id);
  }

  public async softDeleteProduct(id: string): Promise<boolean> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { error } = await supabase
          .from("products")
          .update({ deleted_at: now, is_published: false })
          .eq("id", id);
        return !error;
      }
    }

    const res = this.db
      .prepare(
        "UPDATE products SET deleted_at = ?, is_published = 0 WHERE id = ? AND deleted_at IS NULL"
      )
      .run(now, id);
    return res.changes > 0;
  }

  public async addProductImage(data: {
    productId: string;
    storagePath: string;
    publicUrl: string;
    altText?: string;
    sortOrder?: number;
  }): Promise<ProductImage> {
    const id = nanoid();
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: inserted, error } = await supabase
          .from("product_images")
          .insert({
            product_id: data.productId,
            storage_path: data.storagePath,
            public_url: data.publicUrl,
            alt_text: data.altText || "",
            sort_order: data.sortOrder || 0,
          })
          .select("*")
          .single();

        if (error) throw new Error(`Supabase add image error: ${error.message}`);
        return {
          id: inserted.id,
          productId: inserted.product_id,
          storagePath: inserted.storage_path,
          publicUrl: inserted.public_url,
          altText: inserted.alt_text || "",
          sortOrder: inserted.sort_order || 0,
          createdAt: inserted.created_at,
        };
      }
    }

    this.db
      .prepare(
        `
      INSERT INTO product_images (id, product_id, storage_path, public_url, alt_text, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        id,
        data.productId,
        data.storagePath,
        data.publicUrl,
        data.altText || "",
        data.sortOrder || 0,
        now
      );

    return {
      id,
      productId: data.productId,
      storagePath: data.storagePath,
      publicUrl: data.publicUrl,
      altText: data.altText || "",
      sortOrder: data.sortOrder || 0,
      createdAt: now,
    };
  }

  public async deleteProductImage(productId: string, imageId: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { error } = await supabase
          .from("product_images")
          .delete()
          .eq("id", imageId)
          .eq("product_id", productId);
        return !error;
      }
    }

    const res = this.db
      .prepare("DELETE FROM product_images WHERE id = ? AND product_id = ?")
      .run(imageId, productId);
    return res.changes > 0;
  }

  // ==========================================================================
  // Carts & CRM Management
  // ==========================================================================

  public async getOrCreateCart(
    sessionId?: string | null,
    userId?: string | null
  ): Promise<Cart> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        if (sessionId) {
          const { data: existing } = await supabase
            .from("carts")
            .select("*")
            .eq("session_id", sessionId)
            .eq("status", "active")
            .order("updated_at", { ascending: false })
            .maybeSingle();

          if (existing) {
            return {
              id: existing.id,
              sessionId: existing.session_id,
              userId: existing.user_id,
              status: existing.status as CartStatus,
              currency: existing.currency,
              lastActivityAt: existing.last_activity_at,
              createdAt: existing.created_at,
              updatedAt: existing.updated_at,
            };
          }
        }

        const { data: newCart, error } = await supabase
          .from("carts")
          .insert({
            session_id: sessionId || null,
            user_id: userId || null,
            status: "active",
            currency: "INR",
          })
          .select("*")
          .single();

        if (!error && newCart) {
          return {
            id: newCart.id,
            sessionId: newCart.session_id,
            userId: newCart.user_id,
            status: newCart.status as CartStatus,
            currency: newCart.currency,
            lastActivityAt: newCart.last_activity_at,
            createdAt: newCart.created_at,
            updatedAt: newCart.updated_at,
          };
        }
      }
    }

    // Local SQLite fallback
    if (sessionId) {
      const existing = this.db
        .prepare(
          "SELECT * FROM carts WHERE session_id = ? AND status = 'active' ORDER BY updated_at DESC"
        )
        .get(sessionId) as any;
      if (existing) {
        return {
          id: existing.id,
          sessionId: existing.session_id,
          userId: existing.user_id,
          status: existing.status as CartStatus,
          currency: existing.currency,
          lastActivityAt: existing.last_activity_at,
          createdAt: existing.created_at,
          updatedAt: existing.updated_at,
        };
      }
    }

    const id = nanoid();
    this.db
      .prepare(
        `
      INSERT INTO carts (id, session_id, user_id, status, currency, last_activity_at, created_at, updated_at)
      VALUES (?, ?, ?, 'active', 'INR', ?, ?, ?)
    `
      )
      .run(id, sessionId || null, userId || null, now, now, now);

    return {
      id,
      sessionId: sessionId || null,
      userId: userId || null,
      status: "active",
      currency: "INR",
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    };
  }

  public async getCartById(
    cartId: string
  ): Promise<{ cart: Cart; items: CartItemWithProduct[] } | null> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: cartData } = await supabase
          .from("carts")
          .select("*")
          .eq("id", cartId)
          .maybeSingle();

        if (!cartData) return null;

        const { data: itemRows } = await supabase
          .from("cart_items")
          .select("*, products(*, product_images(*))")
          .eq("cart_id", cartId)
          .order("created_at", { ascending: true });

        const items: CartItemWithProduct[] = (itemRows || []).map(r => {
          const prod = r.products;
          const images = prod?.product_images || [];
          return {
            id: r.id,
            cartId: r.cart_id,
            productId: r.product_id,
            quantity: r.quantity,
            unitPriceInMinorUnits: r.unit_price_in_minor_units,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            product: prod
              ? {
                  id: prod.id,
                  title: prod.title,
                  slug: prod.slug,
                  packSize: prod.pack_size || null,
                  priceInMinorUnits: prod.price_in_minor_units,
                  currency: prod.currency || "INR",
                  category: prod.category,
                  primaryImage: images[0]?.public_url || undefined,
                }
              : undefined,
          };
        });

        return {
          cart: {
            id: cartData.id,
            sessionId: cartData.session_id,
            userId: cartData.user_id,
            status: cartData.status as CartStatus,
            currency: cartData.currency,
            lastActivityAt: cartData.last_activity_at,
            createdAt: cartData.created_at,
            updatedAt: cartData.updated_at,
          },
          items,
        };
      }
    }

    // Local SQLite fallback
    const row = this.db
      .prepare("SELECT * FROM carts WHERE id = ?")
      .get(cartId) as any;
    if (!row) return null;

    const cart: Cart = {
      id: row.id,
      sessionId: row.session_id,
      userId: row.user_id,
      status: row.status as CartStatus,
      currency: row.currency,
      lastActivityAt: row.last_activity_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    const itemRows = this.db
      .prepare(
        `
      SELECT ci.*, p.title as product_title, p.slug as product_slug, p.pack_size as product_pack_size,
             p.price_in_minor_units as product_price, p.currency as product_currency, p.category as product_category
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.cart_id = ?
      ORDER BY ci.created_at ASC
    `
      )
      .all(cartId) as any[];

    const items: CartItemWithProduct[] = [];
    for (const r of itemRows) {
      const images = await this.getProductImages(r.product_id);
      items.push({
        id: r.id,
        cartId: r.cart_id,
        productId: r.product_id,
        quantity: r.quantity,
        unitPriceInMinorUnits: r.unit_price_in_minor_units,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        product: {
          id: r.product_id,
          title: r.product_title,
          slug: r.product_slug,
          packSize: r.product_pack_size,
          priceInMinorUnits: r.product_price,
          currency: r.product_currency,
          category: r.product_category,
          primaryImage: images[0]?.publicUrl || undefined,
        },
      });
    }

    return { cart, items };
  }

  public async addCartItem(
    cartId: string,
    productId: string,
    quantity: number = 1
  ): Promise<CartItem> {
    const product = await this.getAdminProductById(productId);
    const unitPrice = product?.priceInMinorUnits ?? null;
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: existing } = await supabase
          .from("cart_items")
          .select("*")
          .eq("cart_id", cartId)
          .eq("product_id", productId)
          .maybeSingle();

        if (existing) {
          const newQty = existing.quantity + quantity;
          const { data: updated } = await supabase
            .from("cart_items")
            .update({ quantity: newQty, updated_at: now })
            .eq("id", existing.id)
            .select("*")
            .single();

          await this.touchCartActivity(cartId);
          return {
            id: updated.id,
            cartId: updated.cart_id,
            productId: updated.product_id,
            quantity: updated.quantity,
            unitPriceInMinorUnits: updated.unit_price_in_minor_units,
            createdAt: updated.created_at,
            updatedAt: updated.updated_at,
          };
        }

        const { data: inserted, error } = await supabase
          .from("cart_items")
          .insert({
            cart_id: cartId,
            product_id: productId,
            quantity,
            unit_price_in_minor_units: unitPrice,
          })
          .select("*")
          .single();

        if (error) throw new Error(`Supabase add cart item error: ${error.message}`);
        await this.touchCartActivity(cartId);

        return {
          id: inserted.id,
          cartId: inserted.cart_id,
          productId: inserted.product_id,
          quantity: inserted.quantity,
          unitPriceInMinorUnits: inserted.unit_price_in_minor_units,
          createdAt: inserted.created_at,
          updatedAt: inserted.updated_at,
        };
      }
    }

    // Local SQLite fallback
    const existing = this.db
      .prepare("SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?")
      .get(cartId, productId) as any;

    if (existing) {
      const newQty = existing.quantity + quantity;
      this.db
        .prepare("UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ?")
        .run(newQty, now, existing.id);
      this.touchCartActivity(cartId);
      return {
        id: existing.id,
        cartId,
        productId,
        quantity: newQty,
        unitPriceInMinorUnits: existing.unit_price_in_minor_units,
        createdAt: existing.created_at,
        updatedAt: now,
      };
    }

    const id = nanoid();
    this.db
      .prepare(
        `
      INSERT INTO cart_items (id, cart_id, product_id, quantity, unit_price_in_minor_units, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(id, cartId, productId, quantity, unitPrice, now, now);

    this.touchCartActivity(cartId);

    return {
      id,
      cartId,
      productId,
      quantity,
      unitPriceInMinorUnits: unitPrice,
      createdAt: now,
      updatedAt: now,
    };
  }

  public async updateCartItemQuantity(
    cartId: string,
    itemId: string,
    quantity: number
  ): Promise<boolean> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        if (quantity <= 0) {
          const { error } = await supabase
            .from("cart_items")
            .delete()
            .eq("id", itemId)
            .eq("cart_id", cartId);
          await this.touchCartActivity(cartId);
          return !error;
        }

        const { error } = await supabase
          .from("cart_items")
          .update({ quantity, updated_at: now })
          .eq("id", itemId)
          .eq("cart_id", cartId);
        await this.touchCartActivity(cartId);
        return !error;
      }
    }

    if (quantity <= 0) {
      const res = this.db
        .prepare("DELETE FROM cart_items WHERE id = ? AND cart_id = ?")
        .run(itemId, cartId);
      this.touchCartActivity(cartId);
      return res.changes > 0;
    }

    const res = this.db
      .prepare(
        "UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ? AND cart_id = ?"
      )
      .run(quantity, now, itemId, cartId);
    this.touchCartActivity(cartId);
    return res.changes > 0;
  }

  public async removeCartItem(cartId: string, itemId: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("id", itemId)
          .eq("cart_id", cartId);
        await this.touchCartActivity(cartId);
        return !error;
      }
    }

    const res = this.db
      .prepare("DELETE FROM cart_items WHERE id = ? AND cart_id = ?")
      .run(itemId, cartId);
    this.touchCartActivity(cartId);
    return res.changes > 0;
  }

  public async touchCartActivity(cartId: string): Promise<void> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        await supabase
          .from("carts")
          .update({ last_activity_at: now, updated_at: now })
          .eq("id", cartId);
        return;
      }
    }

    this.db
      .prepare("UPDATE carts SET last_activity_at = ?, updated_at = ? WHERE id = ?")
      .run(now, now, cartId);
  }

  public async getAdminCarts(opts: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    carts: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = Math.max(1, opts.page || 1);
    const pageSize = Math.min(50, Math.max(1, opts.pageSize || 10));
    const offset = (page - 1) * pageSize;

    let whereClause = "1=1";
    const params: any[] = [];

    if (opts.status && opts.status.trim() && opts.status.toLowerCase() !== "all") {
      whereClause += " AND c.status = ?";
      params.push(opts.status.trim());
    }

    const countRow = this.db
      .prepare(`SELECT count(*) as total FROM carts c WHERE ${whereClause}`)
      .get(...params) as any;
    const total = countRow?.total || 0;

    const rows = this.db
      .prepare(
        `
      SELECT c.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM carts c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE ${whereClause}
      ORDER BY c.last_activity_at DESC
      LIMIT ? OFFSET ?
    `
      )
      .all(...params, pageSize, offset) as any[];

    const cartsWithDetails = rows.map(r => {
      const items = this.db
        .prepare(
          `
        SELECT ci.*, p.title as product_title, p.price_in_minor_units
        FROM cart_items ci
        JOIN products p ON p.id = ci.product_id
        WHERE ci.cart_id = ?
      `
        )
        .all(r.id) as any[];

      const totalValue = items.reduce(
        (sum, item) => sum + (item.unit_price_in_minor_units || 0) * item.quantity,
        0
      );
      const itemsDescription =
        items.map(i => `${i.product_title} × ${i.quantity}`).join(", ") ||
        "Empty cart";

      return {
        id: r.id,
        customerName: r.user_name || "Guest Shopper",
        customerEmail: r.user_email || "Not provided",
        customerPhone: r.user_phone || null,
        itemsDescription,
        itemsCount: items.reduce((sum, i) => sum + i.quantity, 0),
        totalValueInMinorUnits: totalValue,
        currency: r.currency,
        status: r.status,
        lastActivityAt: r.last_activity_at,
        createdAt: r.created_at,
      };
    });

    return {
      carts: cartsWithDetails,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  public async updateCartStatus(cartId: string, status: CartStatus): Promise<boolean> {
    const now = new Date().toISOString();
    const res = this.db
      .prepare("UPDATE carts SET status = ?, updated_at = ?, last_activity_at = ? WHERE id = ?")
      .run(status, now, now, cartId);
    return res.changes > 0;
  }

  public async createCartNote(
    cartId: string,
    authorAdminId: string,
    body: string
  ): Promise<CartNote> {
    const id = nanoid();
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO cart_notes (id, cart_id, author_admin_id, body, created_at) VALUES (?, ?, ?, ?, ?)`
      )
      .run(id, cartId, authorAdminId, body, now);

    const admin = await this.getAdminUserById(authorAdminId);

    return {
      id,
      cartId,
      authorAdminId,
      authorName: admin?.name || "Admin",
      body,
      createdAt: now,
    };
  }

  public async getCartNotes(cartId: string): Promise<CartNote[]> {
    const rows = this.db
      .prepare(
        `
      SELECT n.*, u.name as author_name
      FROM cart_notes n
      LEFT JOIN admin_users u ON u.id = n.author_admin_id
      WHERE n.cart_id = ?
      ORDER BY n.created_at DESC
    `
      )
      .all(cartId) as any[];

    return rows.map(r => ({
      id: r.id,
      cartId: r.cart_id,
      authorAdminId: r.author_admin_id,
      authorName: r.author_name || "Admin",
      body: r.body,
      createdAt: r.created_at,
    }));
  }

  // ==========================================================================
  // Orders & Full Checkout Workflows
  // ==========================================================================

  public async createOrder(orderData: {
    customerId?: string | null;
    customerName: string;
    customerPhone: string;
    customerEmail?: string | null;
    shippingAddressLine1: string;
    shippingAddressLine2?: string | null;
    shippingCity: string;
    shippingState: string;
    shippingPincode: string;
    shippingLandmark?: string | null;
    subtotalInMinorUnits: number;
    shippingFeeInMinorUnits?: number;
    discountInMinorUnits?: number;
    totalInMinorUnits: number;
    currency?: string;
    paymentMethod: PaymentMethod;
    paymentStatus?: PaymentStatus;
    orderStatus?: OrderStatus;
    customerNotes?: string | null;
    upiReference?: string | null;
    screenshotUrl?: string | null;
    items: Array<{
      productId?: string | null;
      productTitleSnapshot: string;
      packSizeSnapshot?: string | null;
      unitPriceInMinorUnits: number;
      quantity: number;
      subtotalInMinorUnits: number;
    }>;
  }): Promise<OrderWithItems> {
    const orderId = nanoid();
    const orderNumber = `FOI-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();

    const initialOrderStatus: OrderStatus =
      orderData.orderStatus ||
      (orderData.paymentMethod === "cod"
        ? "cod_confirmation_pending"
        : "placed");

    const initialPaymentStatus: PaymentStatus =
      orderData.paymentStatus ||
      (orderData.paymentMethod === "cod"
        ? "cod_pending"
        : orderData.paymentMethod === "manual_upi"
        ? "upi_pending_verification"
        : "gateway_pending");

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          // Insert order
          const { data: orderRow, error: orderError } = await supabase
            .from("orders")
            .insert({
              order_number: orderNumber,
              customer_id: orderData.customerId || null,
              customer_name: orderData.customerName,
              customer_phone: orderData.customerPhone,
              customer_email: orderData.customerEmail || null,
              shipping_address_line1: orderData.shippingAddressLine1,
              shipping_address_line2: orderData.shippingAddressLine2 || null,
              shipping_city: orderData.shippingCity,
              shipping_state: orderData.shippingState,
              shipping_pincode: orderData.shippingPincode,
              shipping_landmark: orderData.shippingLandmark || null,
              subtotal_in_minor_units: orderData.subtotalInMinorUnits,
              shipping_fee_in_minor_units: orderData.shippingFeeInMinorUnits || 0,
              discount_in_minor_units: orderData.discountInMinorUnits || 0,
              total_in_minor_units: orderData.totalInMinorUnits,
              currency: orderData.currency || "INR",
              payment_method: orderData.paymentMethod,
              payment_status: initialPaymentStatus,
              order_status: initialOrderStatus,
              customer_notes: orderData.customerNotes || null,
            })
            .select("*")
            .single();

          if (!orderError && orderRow) {
            const createdOrderId = orderRow.id;

            // Insert order items
            const orderItemsPayload = orderData.items.map(i => ({
              order_id: createdOrderId,
              product_id: i.productId || null,
              product_title_snapshot: i.productTitleSnapshot,
              pack_size_snapshot: i.packSizeSnapshot || null,
              unit_price_in_minor_units: i.unitPriceInMinorUnits,
              quantity: i.quantity,
              subtotal_in_minor_units: i.subtotalInMinorUnits,
            }));

            await supabase.from("order_items").insert(orderItemsPayload);

            // Insert payment record
            await supabase.from("payments").insert({
              order_id: createdOrderId,
              method: orderData.paymentMethod,
              status: initialPaymentStatus === "upi_verified" || initialPaymentStatus === "paid" ? "verified" : "pending",
              amount_in_minor_units: orderData.totalInMinorUnits,
              upi_reference: orderData.upiReference || null,
              screenshot_url: orderData.screenshotUrl || null,
            });

            // Enqueue order received notification
            await this.queueNotification({
              orderId: createdOrderId,
              channel: "internal",
              notificationType: "order_received",
              recipient: orderData.customerEmail || orderData.customerPhone,
              title: `Order Received #${orderNumber}`,
              body: `Thank you for ordering with Flavours of India. Order ${orderNumber} total ₹${(orderData.totalInMinorUnits / 100).toFixed(0)}.`,
              idempotencyKey: `notif-order-received-${createdOrderId}`,
            });

            return (await this.getOrderByNumber(orderNumber))!;
          }
        } catch (supabaseErr: any) {
          console.warn("[SUPABASE] Order creation fell back to local storage:", supabaseErr.message);
        }
      }
    }

    // Local SQLite fallback
    this.db
      .prepare(
        `
      INSERT INTO orders (
        id, order_number, customer_id, customer_name, customer_phone, customer_email,
        shipping_address_line1, shipping_address_line2, shipping_city, shipping_state,
        shipping_pincode, shipping_landmark, subtotal_in_minor_units, shipping_fee_in_minor_units,
        discount_in_minor_units, total_in_minor_units, currency, payment_method,
        payment_status, order_status, customer_notes, admin_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
    `
      )
      .run(
        orderId,
        orderNumber,
        orderData.customerId || null,
        orderData.customerName,
        orderData.customerPhone,
        orderData.customerEmail || null,
        orderData.shippingAddressLine1,
        orderData.shippingAddressLine2 || null,
        orderData.shippingCity,
        orderData.shippingState,
        orderData.shippingPincode,
        orderData.shippingLandmark || null,
        orderData.subtotalInMinorUnits,
        orderData.shippingFeeInMinorUnits || 0,
        orderData.discountInMinorUnits || 0,
        orderData.totalInMinorUnits,
        orderData.currency || "INR",
        orderData.paymentMethod,
        initialPaymentStatus,
        initialOrderStatus,
        orderData.customerNotes || null,
        now,
        now
      );

    for (const item of orderData.items) {
      const itemId = nanoid();
      this.db
        .prepare(
          `
        INSERT INTO order_items (
          id, order_id, product_id, product_title_snapshot, pack_size_snapshot,
          unit_price_in_minor_units, quantity, subtotal_in_minor_units, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .run(
          itemId,
          orderId,
          item.productId || null,
          item.productTitleSnapshot,
          item.packSizeSnapshot || null,
          item.unitPriceInMinorUnits,
          item.quantity,
          item.subtotalInMinorUnits,
          now
        );
    }

    // Insert payment
    const paymentId = nanoid();
    this.db
      .prepare(
        `
      INSERT INTO payments (id, order_id, method, status, amount_in_minor_units, upi_reference, screenshot_url, verified_by, verified_at, notes, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', ?, ?, ?, NULL, NULL, NULL, ?, ?)
    `
      )
      .run(
        paymentId,
        orderId,
        orderData.paymentMethod,
        orderData.totalInMinorUnits,
        orderData.upiReference || null,
        orderData.screenshotUrl || null,
        now,
        now
      );

    // Enqueue order received notification
    await this.queueNotification({
      orderId,
      channel: "internal",
      notificationType: "order_received",
      recipient: orderData.customerEmail || orderData.customerPhone,
      title: `Order Received #${orderNumber}`,
      body: `Thank you for ordering with Flavours of India. Order ${orderNumber} total ₹${(orderData.totalInMinorUnits / 100).toFixed(0)}.`,
      idempotencyKey: `notif-order-received-${orderId}`,
    });

    return (await this.getOrderByNumber(orderNumber))!;
  }

  public async getOrderByNumber(orderNumber: string): Promise<OrderWithItems | null> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data: order } = await supabase
            .from("orders")
            .select("*, order_items(*), payments(*), packing_tasks(*), shipments(*), return_requests(*)")
            .eq("order_number", orderNumber)
            .maybeSingle();

          if (order) return this.formatOrderWithItems(order);
        } catch {
          // Fall back to SQLite
        }
      }
    }

    const row = this.db
      .prepare("SELECT * FROM orders WHERE order_number = ?")
      .get(orderNumber) as any;
    if (!row) return null;

    return this.assembleOrderWithRelations(row);
  }

  public async getOrderById(orderId: string): Promise<OrderWithItems | null> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data: order } = await supabase
            .from("orders")
            .select("*, order_items(*), payments(*), packing_tasks(*), shipments(*), return_requests(*)")
            .eq("id", orderId)
            .maybeSingle();

          if (order) return this.formatOrderWithItems(order);
        } catch {
          // Fall back to SQLite
        }
      }
    }

    const row = this.db
      .prepare("SELECT * FROM orders WHERE id = ?")
      .get(orderId) as any;
    if (!row) return null;

    return this.assembleOrderWithRelations(row);
  }

  private assembleOrderWithRelations(row: any): OrderWithItems {
    const items = this.db
      .prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC")
      .all(row.id) as any[];

    const payment = this.db
      .prepare("SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1")
      .get(row.id) as any;

    const packing = this.db
      .prepare("SELECT * FROM packing_tasks WHERE order_id = ?")
      .get(row.id) as any;

    const shipment = this.db
      .prepare("SELECT * FROM shipments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1")
      .get(row.id) as any;

    const returnReq = this.db
      .prepare("SELECT * FROM return_requests WHERE order_id = ? ORDER BY created_at DESC LIMIT 1")
      .get(row.id) as any;

    return {
      id: row.id,
      orderNumber: row.order_number,
      customerId: row.customer_id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerEmail: row.customer_email,
      shippingAddressLine1: row.shipping_address_line1,
      shippingAddressLine2: row.shipping_address_line2,
      shippingCity: row.shipping_city,
      shippingState: row.shipping_state,
      shippingPincode: row.shipping_pincode,
      shippingLandmark: row.shipping_landmark,
      subtotalInMinorUnits: row.subtotal_in_minor_units,
      shippingFeeInMinorUnits: row.shipping_fee_in_minor_units,
      discountInMinorUnits: row.discount_in_minor_units,
      totalInMinorUnits: row.total_in_minor_units,
      currency: row.currency,
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      orderStatus: row.order_status,
      customerNotes: row.customer_notes,
      adminNotes: row.admin_notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      items: items.map(i => ({
        id: i.id,
        orderId: i.order_id,
        productId: i.product_id,
        productTitleSnapshot: i.product_title_snapshot,
        packSizeSnapshot: i.pack_size_snapshot,
        unitPriceInMinorUnits: i.unit_price_in_minor_units,
        quantity: i.quantity,
        subtotalInMinorUnits: i.subtotal_in_minor_units,
        createdAt: i.created_at,
      })),
      payment: payment
        ? {
            id: payment.id,
            orderId: payment.order_id,
            method: payment.method,
            status: payment.status,
            amountInMinorUnits: payment.amount_in_minor_units,
            upiReference: payment.upi_reference,
            screenshotUrl: payment.screenshot_url || null,
            verifiedBy: payment.verified_by,
            verifiedAt: payment.verified_at,
            notes: payment.notes,
            createdAt: payment.created_at,
            updatedAt: payment.updated_at,
          }
        : null,
      packingTask: packing
        ? {
            id: packing.id,
            orderId: packing.order_id,
            status: packing.status,
            assignee: packing.assignee,
            packingNotes: packing.packing_notes,
            startedAt: packing.started_at,
            completedAt: packing.completed_at,
            createdAt: packing.created_at,
            updatedAt: packing.updated_at,
          }
        : null,
      shipment: shipment
        ? {
            id: shipment.id,
            orderId: shipment.order_id,
            courierName: shipment.courier_name,
            trackingNumber: shipment.tracking_number,
            shippingStatus: shipment.shipping_status,
            shippingDate: shipment.shipping_date,
            expectedDeliveryDate: shipment.expected_delivery_date,
            deliveredAt: shipment.delivered_at,
            notes: shipment.notes,
            createdAt: shipment.created_at,
            updatedAt: shipment.updated_at,
          }
        : null,
      returnRequest: returnReq
        ? {
            id: returnReq.id,
            orderId: returnReq.order_id,
            customerReason: returnReq.customer_reason,
            internalDecision: returnReq.internal_decision,
            status: returnReq.status,
            refundAmountInMinorUnits: returnReq.refund_amount_in_minor_units,
            refundMethod: returnReq.refund_method,
            refundReference: returnReq.refund_reference,
            reviewedBy: returnReq.reviewed_by,
            createdAt: returnReq.created_at,
            updatedAt: returnReq.updated_at,
          }
        : null,
    };
  }

  private formatOrderWithItems(order: any): OrderWithItems {
    const payment = Array.isArray(order.payments) ? order.payments[0] : order.payments;
    const packing = Array.isArray(order.packing_tasks) ? order.packing_tasks[0] : order.packing_tasks;
    const shipment = Array.isArray(order.shipments) ? order.shipments[0] : order.shipments;
    const returnReq = Array.isArray(order.return_requests) ? order.return_requests[0] : order.return_requests;

    return {
      id: order.id,
      orderNumber: order.order_number,
      customerId: order.customer_id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email,
      shippingAddressLine1: order.shipping_address_line1,
      shippingAddressLine2: order.shipping_address_line2,
      shippingCity: order.shipping_city,
      shippingState: order.shipping_state,
      shippingPincode: order.shipping_pincode,
      shippingLandmark: order.shipping_landmark,
      subtotalInMinorUnits: order.subtotal_in_minor_units,
      shippingFeeInMinorUnits: order.shipping_fee_in_minor_units,
      discountInMinorUnits: order.discount_in_minor_units,
      totalInMinorUnits: order.total_in_minor_units,
      currency: order.currency,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      orderStatus: order.order_status,
      customerNotes: order.customer_notes,
      adminNotes: order.admin_notes,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: (order.order_items || []).map((i: any) => ({
        id: i.id,
        orderId: i.order_id,
        productId: i.product_id,
        productTitleSnapshot: i.product_title_snapshot,
        packSizeSnapshot: i.pack_size_snapshot,
        unitPriceInMinorUnits: i.unit_price_in_minor_units,
        quantity: i.quantity,
        subtotalInMinorUnits: i.subtotal_in_minor_units,
        createdAt: i.created_at,
      })),
      payment: payment
        ? {
            id: payment.id,
            orderId: payment.order_id,
            method: payment.method,
            status: payment.status,
            amountInMinorUnits: payment.amount_in_minor_units,
            upiReference: payment.upi_reference,
            screenshotUrl: payment.screenshot_url || null,
            verifiedBy: payment.verified_by,
            verifiedAt: payment.verified_at,
            notes: payment.notes,
            createdAt: payment.created_at,
            updatedAt: payment.updated_at,
          }
        : null,
      packingTask: packing
        ? {
            id: packing.id,
            orderId: packing.order_id,
            status: packing.status,
            assignee: packing.assignee,
            packingNotes: packing.packing_notes,
            startedAt: packing.started_at,
            completedAt: packing.completed_at,
            createdAt: packing.created_at,
            updatedAt: packing.updated_at,
          }
        : null,
      shipment: shipment
        ? {
            id: shipment.id,
            orderId: shipment.order_id,
            courierName: shipment.courier_name,
            trackingNumber: shipment.tracking_number,
            shippingStatus: shipment.shipping_status,
            shippingDate: shipment.shipping_date,
            expectedDeliveryDate: shipment.expected_delivery_date,
            deliveredAt: shipment.delivered_at,
            notes: shipment.notes,
            createdAt: shipment.created_at,
            updatedAt: shipment.updated_at,
          }
        : null,
      returnRequest: returnReq
        ? {
            id: returnReq.id,
            orderId: returnReq.order_id,
            customerReason: returnReq.customer_reason,
            internalDecision: returnReq.internal_decision,
            status: returnReq.status,
            refundAmountInMinorUnits: returnReq.refund_amount_in_minor_units,
            refundMethod: returnReq.refund_method,
            refundReference: returnReq.refund_reference,
            reviewedBy: returnReq.reviewed_by,
            createdAt: returnReq.created_at,
            updatedAt: returnReq.updated_at,
          }
        : null,
    };
  }

  public async getAdminOrders(opts: {
    status?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    orders: OrderWithItems[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = Math.max(1, opts.page || 1);
    const pageSize = Math.min(100, Math.max(1, opts.pageSize || 20));
    const offset = (page - 1) * pageSize;

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        let query = supabase
          .from("orders")
          .select("*, order_items(*), payments(*), packing_tasks(*), shipments(*), return_requests(*)", { count: "exact" });

        if (opts.status && opts.status !== "all") query = query.eq("order_status", opts.status);
        if (opts.paymentStatus && opts.paymentStatus !== "all") query = query.eq("payment_status", opts.paymentStatus);
        if (opts.paymentMethod && opts.paymentMethod !== "all") query = query.eq("payment_method", opts.paymentMethod);
        if (opts.search && opts.search.trim()) {
          const term = `%${opts.search.trim()}%`;
          query = query.or(`order_number.ilike.${term},customer_name.ilike.${term},customer_phone.ilike.${term}`);
        }

        query = query.order("created_at", { ascending: false });

        const { data, count, error } = await query.range(offset, offset + pageSize - 1);
        if (!error && data) {
          const total = count || 0;
          return {
            orders: data.map(o => this.formatOrderWithItems(o)),
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize) || 1,
          };
        }
      }
    }

    // Local SQLite fallback
    let whereClause = "1=1";
    const params: any[] = [];

    if (opts.status && opts.status !== "all") {
      whereClause += " AND order_status = ?";
      params.push(opts.status);
    }
    if (opts.paymentStatus && opts.paymentStatus !== "all") {
      whereClause += " AND payment_status = ?";
      params.push(opts.paymentStatus);
    }
    if (opts.paymentMethod && opts.paymentMethod !== "all") {
      whereClause += " AND payment_method = ?";
      params.push(opts.paymentMethod);
    }
    if (opts.search && opts.search.trim()) {
      whereClause += " AND (order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)";
      const term = `%${opts.search.trim()}%`;
      params.push(term, term, term);
    }

    const countRow = this.db
      .prepare(`SELECT count(*) as total FROM orders WHERE ${whereClause}`)
      .get(...params) as any;
    const total = countRow?.total || 0;

    const rows = this.db
      .prepare(`SELECT * FROM orders WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(...params, pageSize, offset) as any[];

    const orders = rows.map(r => this.assembleOrderWithRelations(r));

    return {
      orders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  // --- Workflow Actions ---

  public async confirmCodOrder(
    orderId: string,
    adminUserId: string,
    adminNotes?: string
  ): Promise<OrderWithItems> {
    const now = new Date().toISOString();

    // 1. Update Order Status
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        await supabase
          .from("orders")
          .update({
            order_status: "confirmed",
            admin_notes: adminNotes || "COD order confirmed by admin",
            updated_at: now,
          })
          .eq("id", orderId);

        // 2. Create Packing task exactly once
        await supabase
          .from("packing_tasks")
          .upsert({
            order_id: orderId,
            status: "pending",
            updated_at: now,
          }, { onConflict: "order_id" });

        // 3. Queue Notification
        const order = await this.getOrderById(orderId);
        if (order) {
          await this.queueNotification({
            orderId,
            channel: "internal",
            notificationType: "cod_confirmed",
            recipient: order.customerEmail || order.customerPhone,
            title: `COD Order Confirmed #${order.orderNumber}`,
            body: `Your COD order #${order.orderNumber} is confirmed and queued for packing.`,
            idempotencyKey: `notif-cod-confirmed-${orderId}`,
          });
        }

        // 4. Record Audit Log
        await this.createAuditLog({
          adminUserId,
          action: "CONFIRM_COD_ORDER",
          entityType: "order",
          entityId: orderId,
          details: { notes: adminNotes },
        });

        return (await this.getOrderById(orderId))!;
      }
    }

    // Local SQLite
    this.db
      .prepare(
        `UPDATE orders SET order_status = 'confirmed', admin_notes = ?, updated_at = ? WHERE id = ?`
      )
      .run(adminNotes || "COD order confirmed by admin", now, orderId);

    // Create packing task exactly once
    const existingPacking = this.db
      .prepare("SELECT id FROM packing_tasks WHERE order_id = ?")
      .get(orderId);

    if (!existingPacking) {
      const packingId = nanoid();
      this.db
        .prepare(
          `INSERT INTO packing_tasks (id, order_id, status, created_at, updated_at) VALUES (?, ?, 'pending', ?, ?)`
        )
        .run(packingId, orderId, now, now);
    }

    const order = await this.getOrderById(orderId);
    if (order) {
      await this.queueNotification({
        orderId,
        channel: "internal",
        notificationType: "cod_confirmed",
        recipient: order.customerEmail || order.customerPhone,
        title: `COD Order Confirmed #${order.orderNumber}`,
        body: `Your COD order #${order.orderNumber} is confirmed and queued for packing.`,
        idempotencyKey: `notif-cod-confirmed-${orderId}`,
      });
    }

    await this.createAuditLog({
      adminUserId,
      action: "CONFIRM_COD_ORDER",
      entityType: "order",
      entityId: orderId,
      details: { notes: adminNotes },
    });

    return (await this.getOrderById(orderId))!;
  }

  public async verifyManualUpiPayment(
    orderId: string,
    upiReference: string,
    adminUserId: string,
    notes?: string
  ): Promise<OrderWithItems> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        // 1. Update Payment record
        await supabase
          .from("payments")
          .update({
            status: "verified",
            upi_reference: upiReference,
            verified_by: adminUserId,
            verified_at: now,
            notes: notes || null,
            updated_at: now,
          })
          .eq("order_id", orderId);

        // 2. Update Order
        await supabase
          .from("orders")
          .update({
            payment_status: "upi_verified",
            order_status: "confirmed",
            admin_notes: notes ? `UPI Verified: ${notes}` : "UPI verified by admin",
            updated_at: now,
          })
          .eq("id", orderId);

        // 3. Create Packing Task exactly once
        await supabase
          .from("packing_tasks")
          .upsert({
            order_id: orderId,
            status: "pending",
            updated_at: now,
          }, { onConflict: "order_id" });

        // 4. Queue Notification
        const order = await this.getOrderById(orderId);
        if (order) {
          await this.queueNotification({
            orderId,
            channel: "internal",
            notificationType: "upi_verified",
            recipient: order.customerEmail || order.customerPhone,
            title: `Payment Verified for Order #${order.orderNumber}`,
            body: `Your UPI payment for order #${order.orderNumber} has been verified. Packing is starting now.`,
            idempotencyKey: `notif-upi-verified-${orderId}`,
          });
        }

        await this.createAuditLog({
          adminUserId,
          action: "VERIFY_UPI_PAYMENT",
          entityType: "order",
          entityId: orderId,
          details: { upiReference, notes },
        });

        return (await this.getOrderById(orderId))!;
      }
    }

    // Local SQLite
    this.db
      .prepare(
        `
      UPDATE payments
      SET status = 'verified', upi_reference = ?, verified_by = ?, verified_at = ?, notes = ?, updated_at = ?
      WHERE order_id = ?
    `
      )
      .run(upiReference, adminUserId, now, notes || null, now, orderId);

    this.db
      .prepare(
        `
      UPDATE orders
      SET payment_status = 'upi_verified', order_status = 'confirmed',
          admin_notes = ?, updated_at = ?
      WHERE id = ?
    `
      )
      .run(notes ? `UPI Verified: ${notes}` : "UPI verified by admin", now, orderId);

    const existingPacking = this.db
      .prepare("SELECT id FROM packing_tasks WHERE order_id = ?")
      .get(orderId);

    if (!existingPacking) {
      const packingId = nanoid();
      this.db
        .prepare(
          `INSERT INTO packing_tasks (id, order_id, status, created_at, updated_at) VALUES (?, ?, 'pending', ?, ?)`
        )
        .run(packingId, orderId, now, now);
    }

    const order = await this.getOrderById(orderId);
    if (order) {
      await this.queueNotification({
        orderId,
        channel: "internal",
        notificationType: "upi_verified",
        recipient: order.customerEmail || order.customerPhone,
        title: `Payment Verified for Order #${order.orderNumber}`,
        body: `Your UPI payment for order #${order.orderNumber} has been verified. Packing is starting now.`,
        idempotencyKey: `notif-upi-verified-${orderId}`,
      });
    }

    await this.createAuditLog({
      adminUserId,
      action: "VERIFY_UPI_PAYMENT",
      entityType: "order",
      entityId: orderId,
      details: { upiReference, notes },
    });

    return (await this.getOrderById(orderId))!;
  }

  public async attachPaymentScreenshot(
    orderNumberOrId: string,
    screenshotUrl: string,
    upiReference?: string | null
  ): Promise<OrderWithItems | null> {
    const order =
      (await this.getOrderByNumber(orderNumberOrId)) ||
      (await this.getOrderById(orderNumberOrId));
    if (!order) return null;

    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const updatePayload: any = {
          screenshot_url: screenshotUrl,
          updated_at: now,
        };
        if (upiReference) {
          updatePayload.upi_reference = upiReference;
        }

        await supabase
          .from("payments")
          .update(updatePayload)
          .eq("order_id", order.id);

        return await this.getOrderById(order.id);
      }
    }

    // SQLite fallback
    let sql = "UPDATE payments SET screenshot_url = ?, updated_at = ?";
    const args: any[] = [screenshotUrl, now];
    if (upiReference) {
      sql += ", upi_reference = ?";
      args.push(upiReference);
    }
    sql += " WHERE order_id = ?";
    args.push(order.id);

    this.db.prepare(sql).run(...args);
    return await this.getOrderById(order.id);
  }

  public async updatePackingStatus(
    orderId: string,
    status: "pending" | "in_progress" | "completed",
    adminUserId: string,
    notes?: string
  ): Promise<OrderWithItems> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        await supabase
          .from("packing_tasks")
          .update({
            status,
            assignee: adminUserId,
            packing_notes: notes || null,
            started_at: status === "in_progress" ? now : undefined,
            completed_at: status === "completed" ? now : undefined,
            updated_at: now,
          })
          .eq("order_id", orderId);

        if (status === "completed") {
          await supabase
            .from("orders")
            .update({ order_status: "packed", updated_at: now })
            .eq("id", orderId);

          const order = await this.getOrderById(orderId);
          if (order) {
            await this.queueNotification({
              orderId,
              channel: "internal",
              notificationType: "order_packed",
              recipient: order.customerEmail || order.customerPhone,
              title: `Order Packed #${order.orderNumber}`,
              body: `Your delicious snacks are packed and ready for dispatch!`,
              idempotencyKey: `notif-packed-${orderId}`,
            });
          }
        }

        return (await this.getOrderById(orderId))!;
      }
    }

    // Local SQLite
    this.db
      .prepare(
        `
      UPDATE packing_tasks
      SET status = ?, assignee = ?, packing_notes = ?,
          started_at = CASE WHEN ? = 'in_progress' THEN ? ELSE started_at END,
          completed_at = CASE WHEN ? = 'completed' THEN ? ELSE completed_at END,
          updated_at = ?
      WHERE order_id = ?
    `
      )
      .run(status, adminUserId, notes || null, status, now, status, now, now, orderId);

    if (status === "completed") {
      this.db
        .prepare("UPDATE orders SET order_status = 'packed', updated_at = ? WHERE id = ?")
        .run(now, orderId);

      const order = await this.getOrderById(orderId);
      if (order) {
        await this.queueNotification({
          orderId,
          channel: "internal",
          notificationType: "order_packed",
          recipient: order.customerEmail || order.customerPhone,
          title: `Order Packed #${order.orderNumber}`,
          body: `Your delicious snacks are packed and ready for dispatch!`,
          idempotencyKey: `notif-packed-${orderId}`,
        });
      }
    }

    return (await this.getOrderById(orderId))!;
  }

  public async createOrUpdateShipment(data: {
    orderId: string;
    courierName: string;
    trackingNumber: string;
    expectedDeliveryDate?: string | null;
    shippingStatus?: "manifested" | "in_transit" | "out_for_delivery" | "delivered";
    notes?: string | null;
    adminUserId: string;
  }): Promise<OrderWithItems> {
    const now = new Date().toISOString();
    const shippingStatus = data.shippingStatus || "in_transit";
    const orderStatus: OrderStatus =
      shippingStatus === "delivered"
        ? "delivered"
        : shippingStatus === "out_for_delivery"
        ? "out_for_delivery"
        : "shipped";

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        // Upsert shipment
        await supabase.from("shipments").upsert({
          order_id: data.orderId,
          courier_name: data.courierName,
          tracking_number: data.trackingNumber,
          shipping_status: shippingStatus,
          expected_delivery_date: data.expectedDeliveryDate || null,
          delivered_at: shippingStatus === "delivered" ? now : null,
          notes: data.notes || null,
          updated_at: now,
        });

        // Update Order Status
        const orderUpdatePayload: any = {
          order_status: orderStatus,
          updated_at: now,
        };

        if (shippingStatus === "delivered") {
          // If COD, mark as collected
          const existingOrder = await this.getOrderById(data.orderId);
          if (existingOrder?.paymentMethod === "cod") {
            orderUpdatePayload.payment_status = "cod_collected";
            await supabase
              .from("payments")
              .update({ status: "collected", updated_at: now })
              .eq("order_id", data.orderId);
          }
        }

        await supabase.from("orders").update(orderUpdatePayload).eq("id", data.orderId);

        const order = await this.getOrderById(data.orderId);
        if (order) {
          const notifType: NotificationType =
            shippingStatus === "delivered" ? "order_delivered" : "order_shipped";
          await this.queueNotification({
            orderId: data.orderId,
            channel: "internal",
            notificationType: notifType,
            recipient: order.customerEmail || order.customerPhone,
            title:
              shippingStatus === "delivered"
                ? `Order Delivered #${order.orderNumber}`
                : `Order Shipped #${order.orderNumber} via ${data.courierName}`,
            body:
              shippingStatus === "delivered"
                ? `Your order #${order.orderNumber} has been delivered. Enjoy the authentic flavours of India!`
                : `Your order #${order.orderNumber} is on its way with tracking number ${data.trackingNumber}.`,
            idempotencyKey: `notif-${notifType}-${data.orderId}`,
          });
        }

        return (await this.getOrderById(data.orderId))!;
      }
    }

    // Local SQLite
    const existingShipment = this.db
      .prepare("SELECT id FROM shipments WHERE order_id = ?")
      .get(data.orderId) as any;

    if (existingShipment) {
      this.db
        .prepare(
          `
        UPDATE shipments
        SET courier_name = ?, tracking_number = ?, shipping_status = ?,
            expected_delivery_date = ?, delivered_at = CASE WHEN ? = 'delivered' THEN ? ELSE delivered_at END,
            notes = ?, updated_at = ?
        WHERE order_id = ?
      `
        )
        .run(
          data.courierName,
          data.trackingNumber,
          shippingStatus,
          data.expectedDeliveryDate || null,
          shippingStatus,
          now,
          data.notes || null,
          now,
          data.orderId
        );
    } else {
      const shipmentId = nanoid();
      this.db
        .prepare(
          `
        INSERT INTO shipments (
          id, order_id, courier_name, tracking_number, shipping_status,
          shipping_date, expected_delivery_date, delivered_at, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .run(
          shipmentId,
          data.orderId,
          data.courierName,
          data.trackingNumber,
          shippingStatus,
          now,
          data.expectedDeliveryDate || null,
          shippingStatus === "delivered" ? now : null,
          data.notes || null,
          now,
          now
        );
    }

    // Update order status
    let paymentStatusUpdate = "";
    if (shippingStatus === "delivered") {
      const order = this.db.prepare("SELECT payment_method FROM orders WHERE id = ?").get(data.orderId) as any;
      if (order?.payment_method === "cod") {
        paymentStatusUpdate = ", payment_status = 'cod_collected'";
        this.db.prepare("UPDATE payments SET status = 'collected', updated_at = ? WHERE order_id = ?").run(now, data.orderId);
      }
    }

    this.db
      .prepare(`UPDATE orders SET order_status = ?${paymentStatusUpdate}, updated_at = ? WHERE id = ?`)
      .run(orderStatus, now, data.orderId);

    const order = await this.getOrderById(data.orderId);
    if (order) {
      const notifType: NotificationType =
        shippingStatus === "delivered" ? "order_delivered" : "order_shipped";
      await this.queueNotification({
        orderId: data.orderId,
        channel: "internal",
        notificationType: notifType,
        recipient: order.customerEmail || order.customerPhone,
        title:
          shippingStatus === "delivered"
            ? `Order Delivered #${order.orderNumber}`
            : `Order Shipped #${order.orderNumber} via ${data.courierName}`,
        body:
          shippingStatus === "delivered"
            ? `Your order #${order.orderNumber} has been delivered. Enjoy the authentic flavours of India!`
            : `Your order #${order.orderNumber} is on its way with tracking number ${data.trackingNumber}.`,
        idempotencyKey: `notif-${notifType}-${data.orderId}`,
      });
    }

    return (await this.getOrderById(data.orderId))!;
  }

  // ==========================================================================
  // Returns & Refunds
  // ==========================================================================

  public async createReturnRequest(data: {
    orderId: string;
    customerReason: string;
  }): Promise<ReturnRequest> {
    const id = nanoid();
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: inserted, error } = await supabase
          .from("return_requests")
          .insert({
            order_id: data.orderId,
            customer_reason: data.customerReason,
            status: "requested",
          })
          .select("*")
          .single();

        if (error) throw new Error(`Supabase return create error: ${error.message}`);
        await supabase
          .from("orders")
          .update({ order_status: "return_requested", updated_at: now })
          .eq("id", data.orderId);

        return {
          id: inserted.id,
          orderId: inserted.order_id,
          customerReason: inserted.customer_reason,
          internalDecision: inserted.internal_decision,
          status: inserted.status,
          refundAmountInMinorUnits: inserted.refund_amount_in_minor_units,
          refundMethod: inserted.refund_method,
          refundReference: inserted.refund_reference,
          reviewedBy: inserted.reviewed_by,
          createdAt: inserted.created_at,
          updatedAt: inserted.updated_at,
        };
      }
    }

    this.db
      .prepare(
        `
      INSERT INTO return_requests (
        id, order_id, customer_reason, internal_decision, status,
        refund_amount_in_minor_units, refund_method, refund_reference, reviewed_by, created_at, updated_at
      ) VALUES (?, ?, ?, NULL, 'requested', NULL, NULL, NULL, NULL, ?, ?)
    `
      )
      .run(id, data.orderId, data.customerReason, now, now);

    this.db
      .prepare("UPDATE orders SET order_status = 'return_requested', updated_at = ? WHERE id = ?")
      .run(now, data.orderId);

    return {
      id,
      orderId: data.orderId,
      customerReason: data.customerReason,
      internalDecision: null,
      status: "requested",
      refundAmountInMinorUnits: null,
      refundMethod: null,
      refundReference: null,
      reviewedBy: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  public async reviewReturnRequest(data: {
    returnRequestId: string;
    decision: "approved" | "rejected" | "received" | "refund_pending" | "refunded";
    internalDecisionNote: string;
    refundAmountInMinorUnits?: number | null;
    refundMethod?: string | null;
    refundReference?: string | null;
    adminUserId: string;
  }): Promise<OrderWithItems> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: retReq } = await supabase
          .from("return_requests")
          .update({
            status: data.decision,
            internal_decision: data.internalDecisionNote,
            refund_amount_in_minor_units: data.refundAmountInMinorUnits ?? null,
            refund_method: data.refundMethod || null,
            refund_reference: data.refundReference || null,
            reviewed_by: data.adminUserId,
            updated_at: now,
          })
          .eq("id", data.returnRequestId)
          .select("*")
          .single();

        if (retReq) {
          let nextOrderStatus: OrderStatus = "return_requested";
          if (data.decision === "approved") nextOrderStatus = "return_requested";
          else if (data.decision === "rejected") nextOrderStatus = "delivered";
          else if (data.decision === "received") nextOrderStatus = "returned";
          else if (data.decision === "refund_pending") nextOrderStatus = "refund_pending";
          else if (data.decision === "refunded") nextOrderStatus = "refunded";

          await supabase
            .from("orders")
            .update({
              order_status: nextOrderStatus,
              payment_status: data.decision === "refunded" ? "refunded" : undefined,
              updated_at: now,
            })
            .eq("id", retReq.order_id);

          return (await this.getOrderById(retReq.order_id))!;
        }
      }
    }

    // Local SQLite
    const row = this.db
      .prepare("SELECT * FROM return_requests WHERE id = ?")
      .get(data.returnRequestId) as any;
    if (!row) throw new Error("Return request not found");

    this.db
      .prepare(
        `
      UPDATE return_requests
      SET status = ?, internal_decision = ?, refund_amount_in_minor_units = ?,
          refund_method = ?, refund_reference = ?, reviewed_by = ?, updated_at = ?
      WHERE id = ?
    `
      )
      .run(
        data.decision,
        data.internalDecisionNote,
        data.refundAmountInMinorUnits ?? null,
        data.refundMethod || null,
        data.refundReference || null,
        data.adminUserId,
        now,
        data.returnRequestId
      );

    let nextOrderStatus: OrderStatus = "return_requested";
    if (data.decision === "approved") nextOrderStatus = "return_requested";
    else if (data.decision === "rejected") nextOrderStatus = "delivered";
    else if (data.decision === "received") nextOrderStatus = "returned";
    else if (data.decision === "refund_pending") nextOrderStatus = "refund_pending";
    else if (data.decision === "refunded") nextOrderStatus = "refunded";

    let paymentUpdate = "";
    if (data.decision === "refunded") {
      paymentUpdate = ", payment_status = 'refunded'";
      this.db
        .prepare("UPDATE payments SET status = 'refunded', updated_at = ? WHERE order_id = ?")
        .run(now, row.order_id);
    }

    this.db
      .prepare(`UPDATE orders SET order_status = ?${paymentUpdate}, updated_at = ? WHERE id = ?`)
      .run(nextOrderStatus, now, row.order_id);

    return (await this.getOrderById(row.order_id))!;
  }

  // ==========================================================================
  // Notifications Queue
  // ==========================================================================

  public async queueNotification(data: {
    orderId?: string | null;
    channel: NotificationChannel;
    notificationType: NotificationType;
    recipient: string;
    title: string;
    body: string;
    idempotencyKey: string;
  }): Promise<NotificationRecord> {
    const id = nanoid();
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: inserted, error } = await supabase
          .from("notifications")
          .upsert(
            {
              order_id: data.orderId || null,
              channel: data.channel,
              notification_type: data.notificationType,
              recipient: data.recipient,
              title: data.title,
              body: data.body,
              status: "queued",
              idempotency_key: data.idempotencyKey,
              updated_at: now,
            },
            { onConflict: "idempotency_key" }
          )
          .select("*")
          .single();

        if (!error && inserted) {
          return {
            id: inserted.id,
            orderId: inserted.order_id,
            channel: inserted.channel,
            notificationType: inserted.notification_type,
            recipient: inserted.recipient,
            title: inserted.title,
            body: inserted.body,
            status: inserted.status,
            providerMessageId: inserted.provider_message_id,
            retryCount: inserted.retry_count,
            errorMessage: inserted.error_message,
            idempotencyKey: inserted.idempotency_key,
            createdAt: inserted.created_at,
            updatedAt: inserted.updated_at,
          };
        }
      }
    }

    // Local SQLite fallback with idempotency
    const existing = this.db
      .prepare("SELECT * FROM notifications WHERE idempotency_key = ?")
      .get(data.idempotencyKey) as any;

    if (existing) {
      return {
        id: existing.id,
        orderId: existing.order_id,
        channel: existing.channel,
        notificationType: existing.notification_type,
        recipient: existing.recipient,
        title: existing.title,
        body: existing.body,
        status: existing.status,
        providerMessageId: existing.provider_message_id,
        retryCount: existing.retry_count,
        errorMessage: existing.error_message,
        idempotencyKey: existing.idempotency_key,
        createdAt: existing.created_at,
        updatedAt: existing.updated_at,
      };
    }

    this.db
      .prepare(
        `
      INSERT INTO notifications (
        id, order_id, channel, notification_type, recipient, title, body,
        status, provider_message_id, retry_count, error_message, idempotency_key, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'queued', NULL, 0, NULL, ?, ?, ?)
    `
      )
      .run(
        id,
        data.orderId || null,
        data.channel,
        data.notificationType,
        data.recipient,
        data.title,
        data.body,
        data.idempotencyKey,
        now,
        now
      );

    return {
      id,
      orderId: data.orderId || null,
      channel: data.channel,
      notificationType: data.notificationType,
      recipient: data.recipient,
      title: data.title,
      body: data.body,
      status: "queued",
      providerMessageId: null,
      retryCount: 0,
      errorMessage: null,
      idempotencyKey: data.idempotencyKey,
      createdAt: now,
      updatedAt: now,
    };
  }

  public async getAdminNotifications(opts: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    notifications: NotificationRecord[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = Math.max(1, opts.page || 1);
    const pageSize = Math.min(100, Math.max(1, opts.pageSize || 20));
    const offset = (page - 1) * pageSize;

    let whereClause = "1=1";
    const params: any[] = [];

    if (opts.status && opts.status !== "all") {
      whereClause += " AND status = ?";
      params.push(opts.status);
    }

    const countRow = this.db
      .prepare(`SELECT count(*) as total FROM notifications WHERE ${whereClause}`)
      .get(...params) as any;
    const total = countRow?.total || 0;

    const rows = this.db
      .prepare(`SELECT * FROM notifications WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(...params, pageSize, offset) as any[];

    return {
      notifications: rows.map(r => ({
        id: r.id,
        orderId: r.order_id,
        channel: r.channel,
        notificationType: r.notification_type,
        recipient: r.recipient,
        title: r.title,
        body: r.body,
        status: r.status,
        providerMessageId: r.provider_message_id,
        retryCount: r.retry_count,
        errorMessage: r.error_message,
        idempotencyKey: r.idempotency_key,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  // ==========================================================================
  // Audit & Import Logs
  // ==========================================================================

  public async createAuditLog(data: {
    adminUserId: string | null;
    action: string;
    entityType: string;
    entityId: string;
    details?: any;
    ipAddress?: string | null;
  }): Promise<AuditLog> {
    const id = nanoid();
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        await supabase.from("audit_logs").insert({
          admin_user_id: data.adminUserId || null,
          action: data.action,
          entity_type: data.entityType,
          entity_id: data.entityId,
          details: data.details || null,
          ip_address: data.ipAddress || null,
        });
      }
    }

    this.db
      .prepare(
        `
      INSERT INTO audit_logs (id, admin_user_id, action, entity_type, entity_id, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        id,
        data.adminUserId || null,
        data.action,
        data.entityType,
        data.entityId,
        data.details ? JSON.stringify(data.details) : null,
        data.ipAddress || null,
        now
      );

    return {
      id,
      adminUserId: data.adminUserId || null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      details: data.details,
      ipAddress: data.ipAddress || null,
      createdAt: now,
    };
  }

  public async createImportLog(data: {
    adminUserId: string | null;
    fileName: string;
    importType: "products" | "payments" | "reconciliation";
    totalRows: number;
    importedRows: number;
    failedRows: number;
    errors?: any;
  }): Promise<ImportLog> {
    const id = nanoid();
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        await supabase.from("import_logs").insert({
          admin_user_id: data.adminUserId || null,
          file_name: data.fileName,
          import_type: data.importType,
          total_rows: data.totalRows,
          imported_rows: data.importedRows,
          failed_rows: data.failedRows,
          errors: data.errors || null,
        });
      }
    }

    this.db
      .prepare(
        `
      INSERT INTO import_logs (id, admin_user_id, file_name, import_type, total_rows, imported_rows, failed_rows, errors, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        id,
        data.adminUserId || null,
        data.fileName,
        data.importType,
        data.totalRows,
        data.importedRows,
        data.failedRows,
        data.errors ? JSON.stringify(data.errors) : null,
        now
      );

    return {
      id,
      adminUserId: data.adminUserId || null,
      fileName: data.fileName,
      importType: data.importType,
      totalRows: data.totalRows,
      importedRows: data.importedRows,
      failedRows: data.failedRows,
      errors: data.errors,
      createdAt: now,
    };
  }

  // ==========================================================================
  // Dashboard Metrics & Aggregations
  // ==========================================================================

  public async getDashboardSummary(): Promise<{
    cartsStarted: number;
    cartsAbandoned: number;
    cartsConverted: number;
    conversionRate: number;
    totalProducts: number;
    draftProducts: number;
    publishedProducts: number;
    totalOrders: number;
    pendingCodOrders: number;
    pendingUpiOrders: number;
    pendingPackingTasks: number;
    inTransitShipments: number;
    totalRevenueInMinorUnits: number;
    recentActivities: Array<{
      id: string;
      title: string;
      subtitle: string;
      time: string;
      type: string;
    }>;
  }> {
    const totalCarts =
      (this.db.prepare("SELECT count(*) as c FROM carts").get() as any)?.c || 0;
    const abandonedCarts =
      (this.db.prepare("SELECT count(*) as c FROM carts WHERE status = 'abandoned'").get() as any)?.c || 0;
    const convertedCarts =
      (this.db.prepare("SELECT count(*) as c FROM carts WHERE status = 'converted'").get() as any)?.c || 0;
    const conversionRate =
      totalCarts > 0 ? Number(((convertedCarts / totalCarts) * 100).toFixed(1)) : 0;

    const totalProducts =
      (this.db.prepare("SELECT count(*) as c FROM products WHERE deleted_at IS NULL").get() as any)?.c || 0;
    const draftProducts =
      (this.db.prepare("SELECT count(*) as c FROM products WHERE deleted_at IS NULL AND (is_published = 0 OR stock_status = 'draft')").get() as any)?.c || 0;
    const publishedProducts =
      (this.db.prepare("SELECT count(*) as c FROM products WHERE deleted_at IS NULL AND is_published = 1").get() as any)?.c || 0;

    const totalOrders =
      (this.db.prepare("SELECT count(*) as c FROM orders").get() as any)?.c || 0;
    const pendingCodOrders =
      (this.db.prepare("SELECT count(*) as c FROM orders WHERE order_status = 'cod_confirmation_pending'").get() as any)?.c || 0;
    const pendingUpiOrders =
      (this.db.prepare("SELECT count(*) as c FROM orders WHERE payment_status = 'upi_pending_verification'").get() as any)?.c || 0;
    const pendingPackingTasks =
      (this.db.prepare("SELECT count(*) as c FROM packing_tasks WHERE status = 'pending'").get() as any)?.c || 0;
    const inTransitShipments =
      (this.db.prepare("SELECT count(*) as c FROM shipments WHERE shipping_status = 'in_transit'").get() as any)?.c || 0;

    const revenueRow = this.db
      .prepare(
        "SELECT sum(total_in_minor_units) as rev FROM orders WHERE payment_status IN ('paid', 'upi_verified', 'cod_collected')"
      )
      .get() as any;
    const totalRevenueInMinorUnits = revenueRow?.rev || 0;

    const recentActivities: Array<{
      id: string;
      title: string;
      subtitle: string;
      time: string;
      type: string;
    }> = [];

    if (pendingCodOrders > 0) {
      recentActivities.push({
        id: "act-cod",
        title: `${pendingCodOrders} COD order(s) pending verification`,
        subtitle: "Review address & phone number before dispatch",
        time: "Action required",
        type: "order",
      });
    }

    if (pendingUpiOrders > 0) {
      recentActivities.push({
        id: "act-upi",
        title: `${pendingUpiOrders} Manual UPI payment(s) awaiting verification`,
        subtitle: "Cross-check customer UTR reference against bank statement",
        time: "Action required",
        type: "payment",
      });
    }

    if (pendingPackingTasks > 0) {
      recentActivities.push({
        id: "act-pack",
        title: `${pendingPackingTasks} order(s) ready to pack`,
        subtitle: "Confirmed orders awaiting dispatch prep",
        time: "In queue",
        type: "packing",
      });
    }

    if (recentActivities.length === 0) {
      recentActivities.push({
        id: "act-healthy",
        title: "All operations up to date",
        subtitle: `${publishedProducts} active published snack products in catalogue`,
        time: "Live",
        type: "system",
      });
    }

    return {
      cartsStarted: totalCarts,
      cartsAbandoned: abandonedCarts,
      cartsConverted: convertedCarts,
      conversionRate,
      totalProducts,
      draftProducts,
      publishedProducts,
      totalOrders,
      pendingCodOrders,
      pendingUpiOrders,
      pendingPackingTasks,
      inTransitShipments,
      totalRevenueInMinorUnits,
      recentActivities,
    };
  }

  public close() {
    this.db.close();
  }
}

export const db = new DatabaseService();

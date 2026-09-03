# Flavours of India — Supabase Production Deployment Guide

This guide details the complete process for deploying **Flavours of India** with Supabase as the single production source of truth for PostgreSQL database, Supabase Auth, Row Level Security (RLS), and Storage.

---

## 1. Prerequisites

- A [Supabase](https://supabase.com/) account and project.
- Node.js 18+ and `pnpm`.
- Production hosting provider (Render, Railway, Fly.io, AWS, Vercel, etc.).

---

## 2. Supabase Project Configuration

### 2.1 Database Schema Migrations

Apply the idempotent SQL migrations located in `supabase/migrations/` in sequence:

1. **Schema and RLS Policies:**
   Execute `supabase/migrations/20260902000001_initial_schema.sql` in the Supabase SQL Editor.
   - Creates all core domain tables: `profiles`, `products`, `product_images`, `carts`, `cart_items`, `orders`, `order_items`, `payments`, `packing_tasks`, `shipments`, `return_requests`, `notifications`, `audit_logs`, `import_logs`.
   - Enables Row Level Security (RLS) on all tables.
   - Defines `is_admin()` and `is_staff_or_admin()` security helper functions.
   - Establishes fine-grained public read policies for published products and customer order tracking.

2. **Storage Setup:**
   Execute `supabase/migrations/20260902000002_storage_setup.sql`.
   - Creates the `product-images` storage bucket (public access enabled for optimized CDN image delivery).
   - Enforces 5MB file upload limit and MIME types (`image/jpeg`, `image/png`, `image/webp`, `image/avif`).
   - Configures storage RLS allowing authenticated staff/admins to insert, update, and delete images.

3. **Sample Snack Catalogue (Optional):**
   Execute `supabase/seed.sql` to populate authentic sample Indian snacks across Pickles, Papad, Roasted Snacks, Savoury Snacks, and Tea-Time Snacks.

---

## 3. Environment Variables Configuration

Set the following environment variables on your hosting environment. **Never commit secrets to Git or expose the service role key to browsers.**

```env
# Node Environment
NODE_ENV=production
PORT=5000

# Supabase Production Credentials
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application Configuration
PUBLIC_SITE_URL=https://yourdomain.com
SESSION_SECRET=a_very_long_cryptographically_secure_random_string_32_chars

# Administrative Initial Bootstrap (Required once on first run)
ADMIN_BOOTSTRAP_EMAIL=admin@yourdomain.com
ADMIN_BOOTSTRAP_PASSWORD=YourStrongUniqueAdminPassword2026!
ADMIN_BOOTSTRAP_NAME="Operations Admin"

# Transactional Delivery Providers (Optional / Fallback to queued)
EMAIL_PROVIDER_API_KEY=
SMS_PROVIDER_API_KEY=
WHATSAPP_API_KEY=
```

---

## 4. Bootstrapping the Production Administrator

After configuring your environment variables, run the administrative bootstrap script to provision the primary admin user in Supabase Auth and link their profile:

```bash
pnpm seed:admin
```

This creates the user in Supabase Auth with email confirmed and inserts a `profiles` record with `role = 'admin'`.

---

## 5. Security & Isolation Checklist

| Security Requirement | Status | Verification Mechanism |
| :--- | :--- | :--- |
| **No Service Role Key in Frontend** | Verified | Client bundle builds with only public endpoints; Supabase client with Service Role is isolated in `server/db/supabaseClient.ts` |
| **No Default Credentials** | Verified | All hardcoded passwords (`Admin@12345`) eliminated; requires explicit environment variables |
| **Row Level Security (RLS)** | Verified | RLS enabled on all 14 database tables; policies restrict admin mutations to `is_admin()` or `is_staff_or_admin()` |
| **Server-Side Financial Verification** | Verified | Customer price snapshots recorded at checkout; UPI references verified server-side |
| **Safe Spreadsheet Import** | Verified | Dry-run parser validates rows in memory; duplicates and negative prices rejected before database write |
| **Single Production Database** | Verified | Server automatically uses Supabase PostgreSQL; local SQLite exists only as an isolated offline unit test runner |

---

## 6. Build and Start Commands

```bash
# Type check and run tests
pnpm check
pnpm test

# Build production assets
pnpm build

# Start production server
pnpm start
```

# Flavours of India — Data Migration & Spreadsheet Operations Guide

This document explains the data migration mechanisms from legacy SQLite development databases to Supabase PostgreSQL, as well as the specifications for spreadsheet catalogue and reconciliation imports.

---

## 1. Migrating Legacy SQLite Data to Supabase

If you have existing product catalogue data or images in local SQLite (`data/flavours.db`), you can migrate them directly to Supabase PostgreSQL using the idempotent migration utility.

### Step 1: Ensure Supabase Credentials are Set
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

### Step 2: Run the Migration Utility
```bash
pnpm db:migrate
```

The script will:
1. Connect to `data/flavours.db`.
2. Extract all non-deleted products and upsert them into Supabase `products` using `slug` as the unique conflict target.
3. Extract all product images and associate them with their respective Supabase products in `product_images`.
4. Report total migrated records and status.

---

## 2. Spreadsheet Import Specifications

Admins can upload spreadsheets in **CSV** or **Excel (.xlsx, .xls)** format via the Admin Operations Workspace (`/admin/import`).

### 2.1 Tab 1: Product Catalogue Schema (`products`)

| Column Name | Required | Type | Validation Rules & Notes |
| :--- | :--- | :--- | :--- |
| `sku` | Optional | String | Unique inventory SKU code (e.g. `SNK-MNGO-300G`). |
| `slug` | **Yes** | String | URL-safe identifier (e.g. `traditional-mango-pickle`). Must be unique. |
| `title` | **Yes** | String | Product display name (min 2 characters). |
| `short_description`| **Yes** | String | Concise summary shown in card grids. |
| `long_description` | Optional | String | Full culinary narrative and serving notes. |
| `category` | **Yes** | String | Category name (`Pickles`, `Papad`, `Roasted Snacks`, `Savoury Snacks`, `Tea-Time Snacks`). |
| `pack_size` | Optional | String | Package size (e.g. `300g Jar`, `250g Pouch`). |
| `price_inr` | **Yes** | Decimal | Retail price in Indian Rupees (e.g. `249.00`). Converted safely to paise (e.g. `24900`) server-side. Must be > 0. |
| `stock_quantity` | Optional | Integer | Available inventory count (default: `0`). Must be >= 0. |
| `stock_status` | Optional | String | Enum: `in_stock`, `low_stock`, `out_of_stock`, `made_to_order`, `draft`. |
| `is_published` | Optional | Boolean | `TRUE` / `FALSE` (or `1` / `0`). Items without valid prices cannot be published. |
| `sourcing_note` | Optional | String | Regional origin note (e.g. `Small batch from Ganjam, Odisha`). |
| `ingredients` | Optional | String | Comma-separated ingredient list. |
| `shelf_life` | Optional | String | Shelf life statement (e.g. `12 months from manufacturing`). |
| `storage_instructions`| Optional | String | Storage guidelines (e.g. `Store in cool dry pantry`). |
| `image_url_1` | Optional | URL | Direct HTTPS URL to primary product photography. |
| `image_url_2` | Optional | URL | Direct HTTPS URL to secondary product photography. |

### 2.2 Tab 2: Payment Reconciliation Schema (`payments`)

| Column Name | Required | Type | Description |
| :--- | :--- | :--- | :--- |
| `order_number` | **Yes** | String | Order reference (e.g. `FOI-2026-10042`). |
| `payment_method` | **Yes** | String | `cod` or `manual_upi`. |
| `amount_inr` | **Yes** | Decimal | Verified payment amount in INR. |
| `upi_reference` | Required for UPI | String | 12-digit Bank Reference Number (UTR). |
| `verification_status`| **Yes** | String | `verified`, `pending`, `rejected`, or `refunded`. |
| `bank_reference` | Optional | String | Internal merchant bank statement entry code. |
| `verified_date` | Optional | ISO Date | Timestamp of bank reconciliation. |
| `verification_notes`| Optional | String | Notes recorded during ledger cross-check. |

### 2.3 Tab 3: Shipping Settings Schema (`shipping_settings`)

| Column Name | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `free_shipping_threshold_inr` | Optional | `499` | Minimum cart subtotal qualifying for free delivery. |
| `standard_shipping_fee_inr` | Optional | `50` | Default delivery charge for orders below threshold. |
| `default_courier` | Optional | `Delhivery` | Preferred logistics provider. |

---

## 3. Spreadsheet Safe Dry-Run Protocol

To prevent accidental data corruption or schema discrepancies:

1. **Upload:** Admin uploads the file at `/admin/import`.
2. **Dry Run:** Server parses rows into memory, validates against Zod schema, checks for duplicate slugs within the file, and checks existing database records.
3. **Inspection:** Admin reviews summary metrics (Total rows, Valid items, Error count) and the row error breakdown table.
4. **Commit:** Admin clicks "Commit Import" to batch write valid rows to Supabase PostgreSQL in a single transaction with an audit log record.

# Flavours of India — Local Run Instructions & Backend Integration

This project contains a full-stack **React 19 + TypeScript + Vite** frontend connected to a secure **TypeScript Express** backend with relational database persistence, admin authentication, image storage, CRM scaffolds, and customer storefront synchronization.

## Requirements

- Node.js 20 or newer (`node --version`)
- pnpm 10 or newer (`pnpm --version` or `npx pnpm --version`)

## Setup and Run

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Configuration

Copy the example environment configuration:

```bash
cp .env.example .env
```

| Variable                   | Description                          | Default                              |
| -------------------------- | ------------------------------------ | ------------------------------------ |
| `DATABASE_URL`             | PostgreSQL connection URL (optional) | _Empty (falls back to local SQLite)_ |
| `SQLITE_DB_PATH`           | Local SQLite database file path      | `./data/flavours.db`                 |
| `SESSION_SECRET`           | Secret key for signing sessions      | `dev-session-secret`                 |
| `APP_URL`                  | Application base URL                 | `http://localhost:3000`              |
| `ADMIN_BOOTSTRAP_EMAIL`    | Initial admin account email          | `admin@flavoursofindia.com`          |
| `ADMIN_BOOTSTRAP_PASSWORD` | Initial admin account password       | `Admin@12345`                        |
| `OBJECT_STORAGE_BUCKET`    | S3 bucket name (optional)            | _Empty (uses local storage)_         |

### 3. Bootstrap First Administrator

Run the admin setup script to create or update the initial administrator:

```bash
pnpm seed:admin
```

Initial credentials:

- **Email**: `admin@flavoursofindia.com`
- **Password**: `Admin@12345`

### 4. (Optional) Load Sample Development Data

To seed clearly labeled demo products, carts, and customer profiles:

```bash
pnpm seed
```

> **Note**: Demo products are explicitly tagged with `Sample Product — ...` and are intended for staging and development testing only.

### 5. Start Development Server

```bash
pnpm dev
```

Open `http://localhost:3000` in your browser.

## Available Routes

### Customer Storefront

| Route            | Description                                                |
| ---------------- | ---------------------------------------------------------- |
| `/`              | Premium homepage featuring live published products         |
| `/collection`    | Customer product catalogue with category & sorting filters |
| `/product/:slug` | Customer product detail with image gallery & accordion     |
| `/cart`          | Customer shopping bag and checkout scaffold                |

### Operations & Admin (Protected)

| Route             | Description                                                     |
| ----------------- | --------------------------------------------------------------- |
| `/admin/login`    | Admin sign-in screen                                            |
| `/admin`          | Operations overview metrics & activity                          |
| `/admin/products` | Live product catalogue management (Add, Edit, Publish, Archive) |
| `/admin/carts`    | Customer recovery CRM & notes                                   |
| `/admin/users`    | Customer directory & order counts                               |

## Testing and Quality Verification

Run all test suites, TypeScript type checks, and production bundles:

```bash
# 1. Run full Vitest integration test suite
pnpm test

# 2. Run TypeScript typecheck
pnpm check

# 3. Build production bundle (client + server)
pnpm build

# 4. Run production server
pnpm start
```

# 🍛 Flavours of India (FOI) — E-Commerce Platform

An authentic, premium Indian sweets, snacks, and regional delicacies e-commerce web application with rich catalogue filtering, regional speciality spotlights, dynamic cart & checkout, order tracking, admin dashboard, Supabase / PostgreSQL backend, and automated Google Sheets synchronization.

---

## ✨ Features

- **🛍️ Rich Product Showcase**: Regional filtering (North, South, East, West, Central), dietary filters (Pure Veg, Sugar-Free, Vegan, Gluten-Free), tags (Festive Special, Best Seller), and dynamic search.
- **📦 Smart Cart & Checkout**: Weight & pack size selectors, real-time total calculations, free shipping threshold bar, and coupon code support.
- **💳 Multi-Payment Support**: Cash on Delivery (COD), UPI / QR payments, and NetBanking / Card options with configurable fee/discount rules.
- **🚚 Live Order Tracking**: Tracking page by Order ID / Mobile Number with visual milestone progression (Confirmed, Packed, Shipped, Out for Delivery, Delivered).
- **📊 Admin Control Center**:
  - Live Dashboard (Revenue metrics, Order statuses, Inventory alerts)
  - Product Catalogue Management with CSV Bulk Import & Export
  - Order Management & Status Workflow
  - Customer Inquiry CRM
  - Dynamic Banner & Announcement Management
  - Shipping Rules & Payment Methods Configuration
- **🔄 Google Sheets Real-Time Sync**: Automatically dispatches new orders and leads to Google Sheets via Apps Script webhook.
- **🔐 Hybrid Data Layer**: Seamless support for local SQLite development and cloud Supabase (PostgreSQL) production deployment with Row-Level Security (RLS).

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Radix UI, Wouter Routing, TanStack Query
- **Backend**: Node.js, Express, TypeScript
- **Database**: 
  - **Production**: Supabase (PostgreSQL + RLS + Storage)
  - **Local/Fallback**: SQLite via better-sqlite3
- **External Integrations**: Google Sheets Webhook, Supabase Auth & Storage

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- `pnpm` or `npm`

### 2. Installation
```bash
# Clone repository
git clone https://github.com/<YOUR-USERNAME>/flavours-of-india.git
cd flavours-of-india

# Install dependencies
pnpm install
# or: npm install
```

### 3. Environment Setup
Copy the `.env.example` template to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase credentials or leave blank to use local SQLite mode.

### 4. Running the App
```bash
# Start development server (Client + Server concurrently)
pnpm dev
# or: npm run dev
```
Open your browser at `http://localhost:3000` (or `http://localhost:5173`).

---

## 📁 Project Structure

```
flavours-of-india/
├── client/                     # React Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Route pages (Home, Products, Admin, etc.)
│   │   ├── contexts/           # Cart, Auth, Wishlist contexts
│   │   └── lib/                # Utilities and query client
├── server/                     # Express Backend
│   ├── routes/                 # API routes (products, orders, admin, sync)
│   ├── db/                     # Supabase & SQLite database adapters
│   └── scripts/                # Database migration scripts
├── shared/                     # Shared TypeScript schemas & types
├── supabase/                   # Supabase SQL migrations & schema definitions
├── data/                       # Local SQLite storage directory
└── *.csv                       # Sample catalogue and settings CSV templates
```

---

## 📄 License
This project is licensed under the MIT License.

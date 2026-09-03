-- ==============================================================================
-- Flavours of India — Supabase Production Database Schema & Security Migration
-- Idempotent SQL Migration
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. Helper Functions & Triggers
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user is admin or staff
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 2. Profiles Table (Linked to auth.users)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Auto-create profile trigger on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 3. Products Table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  short_description text NOT NULL,
  long_description text,
  category text NOT NULL,
  pack_size text,
  price_in_minor_units integer,
  currency text NOT NULL DEFAULT 'INR',
  stock_status text NOT NULL DEFAULT 'draft' CHECK (stock_status IN ('in_stock', 'out_of_stock', 'draft')),
  stock_quantity integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  ingredients text,
  allergen_information text,
  shelf_life text,
  storage_instructions text,
  sourcing_note text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_published ON public.products(is_published);
CREATE INDEX IF NOT EXISTS idx_products_deleted ON public.products(deleted_at);

-- ==============================================================================
-- 4. Product Images Table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  alt_text text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);

-- ==============================================================================
-- 5. Carts & Cart Items Table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'abandoned', 'contacted', 'recovered', 'converted')),
  currency text NOT NULL DEFAULT 'INR',
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carts_session_id ON public.carts(session_id);
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_status ON public.carts(status);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_in_minor_units integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);

-- ==============================================================================
-- 6. Orders & Order Items Table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  shipping_address_line1 text NOT NULL,
  shipping_address_line2 text,
  shipping_city text NOT NULL,
  shipping_state text NOT NULL,
  shipping_pincode text NOT NULL,
  shipping_landmark text,
  subtotal_in_minor_units integer NOT NULL,
  shipping_fee_in_minor_units integer NOT NULL DEFAULT 0,
  discount_in_minor_units integer NOT NULL DEFAULT 0,
  total_in_minor_units integer NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  payment_method text NOT NULL CHECK (payment_method IN ('cod', 'manual_upi', 'gateway')),
  payment_status text NOT NULL CHECK (payment_status IN (
    'cod_pending', 'cod_collected',
    'upi_pending_verification', 'upi_verified', 'upi_failed',
    'gateway_pending', 'paid', 'refunded'
  )),
  order_status text NOT NULL CHECK (order_status IN (
    'placed', 'cod_confirmation_pending', 'confirmed',
    'packing', 'packed', 'shipped', 'out_for_delivery', 'delivered',
    'cancelled', 'return_requested', 'returned', 'refund_pending', 'refunded'
  )),
  customer_notes text,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_title_snapshot text NOT NULL,
  pack_size_snapshot text,
  unit_price_in_minor_units integer NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  subtotal_in_minor_units integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- ==============================================================================
-- 7. Payments Table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  method text NOT NULL CHECK (method IN ('cod', 'manual_upi', 'gateway')),
  status text NOT NULL CHECK (status IN ('pending', 'verified', 'collected', 'failed', 'refunded')),
  amount_in_minor_units integer NOT NULL,
  upi_reference text,
  screenshot_url text,
  verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_upi_ref ON public.payments(upi_reference);

-- ==============================================================================
-- 8. Packing Tasks Table (Exactly once per confirmed order)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.packing_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  assignee uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  packing_notes text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_packing_tasks_order_id ON public.packing_tasks(order_id);
CREATE INDEX IF NOT EXISTS idx_packing_tasks_status ON public.packing_tasks(status);

-- ==============================================================================
-- 9. Shipments Table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  courier_name text NOT NULL,
  tracking_number text NOT NULL,
  shipping_status text NOT NULL DEFAULT 'manifested' CHECK (shipping_status IN (
    'manifested', 'in_transit', 'out_for_delivery', 'delivered', 'failed_attempt', 'returned_to_origin'
  )),
  shipping_date timestamptz NOT NULL DEFAULT now(),
  expected_delivery_date date,
  delivered_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON public.shipments(tracking_number);

-- ==============================================================================
-- 10. Return Requests Table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.return_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_reason text NOT NULL,
  internal_decision text,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN (
    'requested', 'approved', 'rejected', 'received', 'refund_pending', 'refunded'
  )),
  refund_amount_in_minor_units integer,
  refund_method text,
  refund_reference text,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_return_requests_order_id ON public.return_requests(order_id);

-- ==============================================================================
-- 11. Notifications Table (Idempotent Queue)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'internal')),
  notification_type text NOT NULL CHECK (notification_type IN (
    'order_received', 'cod_confirmed', 'upi_verified',
    'order_packed', 'order_shipped', 'order_delivered',
    'return_approved', 'refund_completed'
  )),
  recipient text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
  provider_message_id text,
  retry_count integer NOT NULL DEFAULT 0,
  error_message text,
  idempotency_key text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_idempotency ON public.notifications(idempotency_key);

-- ==============================================================================
-- 12. Audit & Import Logs
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  details jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS public.import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  import_type text NOT NULL CHECK (import_type IN ('products', 'payments', 'reconciliation')),
  total_rows integer NOT NULL DEFAULT 0,
  imported_rows integer NOT NULL DEFAULT 0,
  failed_rows integer NOT NULL DEFAULT 0,
  errors jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 13. Row Level Security (RLS) Policies
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packing_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- --- Profiles RLS ---
DROP POLICY IF EXISTS "Public can view staff/admin info" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_staff_or_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Only Admins can update roles" ON public.profiles;
CREATE POLICY "Only Admins can update roles" ON public.profiles
  FOR ALL USING (public.is_admin());

-- --- Products RLS ---
DROP POLICY IF EXISTS "Public can view published non-deleted products" ON public.products;
CREATE POLICY "Public can view published non-deleted products" ON public.products
  FOR SELECT USING (deleted_at IS NULL AND is_published = true);

DROP POLICY IF EXISTS "Staff and Admin can manage all products" ON public.products;
CREATE POLICY "Staff and Admin can manage all products" ON public.products
  FOR ALL USING (public.is_staff_or_admin());

-- --- Product Images RLS ---
DROP POLICY IF EXISTS "Public can view product images" ON public.product_images;
CREATE POLICY "Public can view product images" ON public.product_images
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff and Admin can manage product images" ON public.product_images;
CREATE POLICY "Staff and Admin can manage product images" ON public.product_images
  FOR ALL USING (public.is_staff_or_admin());

-- --- Carts RLS ---
DROP POLICY IF EXISTS "Users can view own carts" ON public.carts;
CREATE POLICY "Users can view own carts" ON public.carts
  FOR SELECT USING (user_id = auth.uid() OR public.is_staff_or_admin());

DROP POLICY IF EXISTS "Users can manage own carts" ON public.carts;
CREATE POLICY "Users can manage own carts" ON public.carts
  FOR ALL USING (user_id = auth.uid() OR public.is_staff_or_admin());

DROP POLICY IF EXISTS "Users can manage own cart items" ON public.cart_items;
CREATE POLICY "Users can manage own cart items" ON public.cart_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id AND (carts.user_id = auth.uid() OR public.is_staff_or_admin())
    )
  );

-- --- Orders RLS ---
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders" ON public.orders
  FOR SELECT USING (customer_id = auth.uid() OR public.is_staff_or_admin());

DROP POLICY IF EXISTS "Staff and Admin can manage all orders" ON public.orders;
CREATE POLICY "Staff and Admin can manage all orders" ON public.orders
  FOR ALL USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Customers can view own order items" ON public.order_items;
CREATE POLICY "Customers can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id AND (orders.customer_id = auth.uid() OR public.is_staff_or_admin())
    )
  );

DROP POLICY IF EXISTS "Staff and Admin can manage order items" ON public.order_items;
CREATE POLICY "Staff and Admin can manage order items" ON public.order_items
  FOR ALL USING (public.is_staff_or_admin());

-- --- Payments RLS ---
DROP POLICY IF EXISTS "Staff and Admin can manage payments" ON public.payments;
CREATE POLICY "Staff and Admin can manage payments" ON public.payments
  FOR ALL USING (public.is_staff_or_admin());

-- --- Packing Tasks, Shipments, Returns, Notifications, Logs RLS ---
DROP POLICY IF EXISTS "Staff and Admin can manage packing tasks" ON public.packing_tasks;
CREATE POLICY "Staff and Admin can manage packing tasks" ON public.packing_tasks
  FOR ALL USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Staff and Admin can manage shipments" ON public.shipments;
CREATE POLICY "Staff and Admin can manage shipments" ON public.shipments
  FOR ALL USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Customers can view own return requests" ON public.return_requests;
CREATE POLICY "Customers can view own return requests" ON public.return_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = return_requests.order_id AND (orders.customer_id = auth.uid() OR public.is_staff_or_admin())
    )
  );

DROP POLICY IF EXISTS "Staff and Admin can manage return requests" ON public.return_requests;
CREATE POLICY "Staff and Admin can manage return requests" ON public.return_requests
  FOR ALL USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Staff and Admin can view notifications" ON public.notifications;
CREATE POLICY "Staff and Admin can view notifications" ON public.notifications
  FOR ALL USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Staff and Admin can view audit logs" ON public.audit_logs;
CREATE POLICY "Staff and Admin can view audit logs" ON public.audit_logs
  FOR ALL USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Staff and Admin can view import logs" ON public.import_logs;
CREATE POLICY "Staff and Admin can view import logs" ON public.import_logs
  FOR ALL USING (public.is_staff_or_admin());

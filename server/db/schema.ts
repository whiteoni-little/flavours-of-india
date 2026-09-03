export type UserRole = "customer" | "admin" | "staff";

export interface UserProfile {
  id: string;
  fullName: string | null;
  phone: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type StockStatus = "in_stock" | "out_of_stock" | "draft";

export interface Product {
  id: string;
  sku?: string | null;
  slug: string;
  title: string;
  shortDescription: string;
  longDescription: string | null;
  category: string;
  packSize: string | null;
  priceInMinorUnits: number | null; // in paise, e.g. 24900 = ₹249.00
  currency: string; // default "INR"
  stockStatus: StockStatus;
  stockQuantity: number;
  isPublished: boolean;
  sourcingNote: string | null;
  ingredients: string | null;
  allergenInformation: string | null;
  shelfLife: string | null;
  storageInstructions: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProductImage {
  id: string;
  productId: string;
  storagePath: string;
  publicUrl: string;
  altText: string;
  sortOrder: number;
  createdAt: string;
}

export interface ProductWithImages extends Product {
  images: ProductImage[];
}

export type CartStatus =
  | "active"
  | "abandoned"
  | "contacted"
  | "recovered"
  | "converted";

export interface Cart {
  id: string;
  sessionId: string | null;
  userId: string | null;
  status: CartStatus;
  currency: string;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  unitPriceInMinorUnits: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CartItemWithProduct extends CartItem {
  product?: {
    id: string;
    title: string;
    slug: string;
    packSize?: string | null;
    priceInMinorUnits: number | null;
    currency: string;
    category: string;
    primaryImage?: string;
  };
}

export type PaymentMethod = "cod" | "manual_upi" | "gateway";

export type PaymentStatus =
  | "cod_pending"
  | "cod_collected"
  | "upi_pending_verification"
  | "upi_verified"
  | "upi_failed"
  | "gateway_pending"
  | "paid"
  | "refunded";

export type OrderStatus =
  | "placed"
  | "cod_confirmation_pending"
  | "confirmed"
  | "packing"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "return_requested"
  | "returned"
  | "refund_pending"
  | "refunded";

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  shippingAddressLine1: string;
  shippingAddressLine2: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  shippingLandmark: string | null;
  subtotalInMinorUnits: number;
  shippingFeeInMinorUnits: number;
  discountInMinorUnits: number;
  totalInMinorUnits: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  customerNotes: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  productTitleSnapshot: string;
  packSizeSnapshot: string | null;
  unitPriceInMinorUnits: number;
  quantity: number;
  subtotalInMinorUnits: number;
  createdAt: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  payment?: Payment | null;
  packingTask?: PackingTask | null;
  shipment?: Shipment | null;
  returnRequest?: ReturnRequest | null;
}

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: "pending" | "verified" | "collected" | "failed" | "refunded";
  amountInMinorUnits: number;
  upiReference: string | null;
  screenshotUrl?: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PackingTask {
  id: string;
  orderId: string;
  status: "pending" | "in_progress" | "completed";
  assignee: string | null;
  assigneeName?: string | null;
  packingNotes: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  courierName: string;
  trackingNumber: string;
  shippingStatus:
    | "manifested"
    | "in_transit"
    | "out_for_delivery"
    | "delivered"
    | "failed_attempt"
    | "returned_to_origin";
  shippingDate: string;
  expectedDeliveryDate: string | null;
  deliveredAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  customerReason: string;
  internalDecision: string | null;
  status:
    | "requested"
    | "approved"
    | "rejected"
    | "received"
    | "refund_pending"
    | "refunded";
  refundAmountInMinorUnits: number | null;
  refundMethod: string | null;
  refundReference: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NotificationChannel = "email" | "sms" | "whatsapp" | "internal";

export type NotificationType =
  | "order_received"
  | "cod_confirmed"
  | "upi_verified"
  | "order_packed"
  | "order_shipped"
  | "order_delivered"
  | "return_approved"
  | "refund_completed";

export interface NotificationRecord {
  id: string;
  orderId: string | null;
  channel: NotificationChannel;
  notificationType: NotificationType;
  recipient: string;
  title: string;
  body: string;
  status: "queued" | "sent" | "failed";
  providerMessageId: string | null;
  retryCount: number;
  errorMessage: string | null;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartNote {
  id: string;
  cartId: string;
  authorAdminId: string;
  authorName?: string;
  body: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details: any;
  ipAddress: string | null;
  createdAt: string;
}

export interface ImportLog {
  id: string;
  adminUserId: string | null;
  fileName: string;
  importType: "products" | "payments" | "reconciliation";
  totalRows: number;
  importedRows: number;
  failedRows: number;
  errors: any;
  createdAt: string;
}

// Legacy AdminUser interface for backward compatibility if needed
export interface AdminUser {
  id: string;
  email: string;
  passwordHash?: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface AdminSession {
  id: string;
  adminUserId: string;
  expiresAt: string;
  createdAt: string;
}

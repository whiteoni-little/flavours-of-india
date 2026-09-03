import { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "../db";
import { getSupabaseAdmin, isSupabaseConfigured } from "../db/supabaseClient";

export const publicCheckoutRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Allowed: JPEG, PNG, WebP, AVIF"));
    }
  },
});

async function syncOrderToGoogleSheet(order: any) {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.startsWith("http")) return;

  try {
    const itemsSummary = (order.items || [])
      .map((i: any) => `${i.productTitleSnapshot || i.title} x ${i.quantity}`)
      .join(", ");

    const payload = {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail || "",
      shippingAddress: `${order.shippingAddressLine1 || ""}${order.shippingAddressLine2 ? ", " + order.shippingAddressLine2 : ""}`,
      shippingCity: order.shippingCity,
      shippingState: order.shippingState,
      shippingPincode: order.shippingPincode,
      itemsSummary,
      totalInRupees: (order.totalInMinorUnits / 100).toFixed(0),
      paymentMethod: order.paymentMethod,
      upiReference: order.payment?.upiReference || order.upiReference || "",
      screenshotUrl: order.payment?.screenshotUrl || order.screenshotUrl || "",
      orderStatus: order.orderStatus,
    };

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log(`[GOOGLE SHEETS] Synced order ${order.orderNumber} to Google Sheet successfully.`);
  } catch (err: any) {
    console.error(`[GOOGLE SHEETS] Failed to sync order ${order.orderNumber}:`, err.message);
  }
}

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Full name is required"),
  customerPhone: z
    .string()
    .min(10, "A valid 10-digit phone number is required")
    .max(15),
  customerEmail: z.string().email().nullable().optional(),
  shippingAddressLine1: z.string().min(5, "Street address is required"),
  shippingAddressLine2: z.string().nullable().optional(),
  shippingCity: z.string().min(2, "City is required"),
  shippingState: z.string().min(2, "State is required"),
  shippingPincode: z
    .string()
    .min(6, "A valid 6-digit PIN code is required")
    .max(6),
  shippingLandmark: z.string().nullable().optional(),
  paymentMethod: z.enum(["cod", "manual_upi", "gateway"]),
  upiReference: z.string().nullable().optional(),
  screenshotUrl: z.string().nullable().optional(),
  customerNotes: z.string().nullable().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "At least one item is required for checkout"),
});

// 1. Create Customer Order (COD or Manual UPI)
publicCheckoutRouter.post("/", async (req, res) => {
  try {
    const parseResult = checkoutSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Validation error",
        details: parseResult.error.issues,
      });
    }

    const data = parseResult.data;

    // Snapshot items with live prices and check stock
    const itemSnapshots: Array<{
      productId: string;
      productTitleSnapshot: string;
      packSizeSnapshot: string | null;
      unitPriceInMinorUnits: number;
      quantity: number;
      subtotalInMinorUnits: number;
    }> = [];

    let calculatedSubtotal = 0;

    for (const item of data.items) {
      const product = await db.getAdminProductById(item.productId);
      if (!product || !product.isPublished || product.deletedAt) {
        return res.status(400).json({
          error: "Product Unavailable",
          message: `Product '${product?.title || item.productId}' is currently unavailable`,
        });
      }

      const unitPrice = product.priceInMinorUnits || 0;
      const subtotal = unitPrice * item.quantity;
      calculatedSubtotal += subtotal;

      itemSnapshots.push({
        productId: product.id,
        productTitleSnapshot: product.title,
        packSizeSnapshot: product.packSize || null,
        unitPriceInMinorUnits: unitPrice,
        quantity: item.quantity,
        subtotalInMinorUnits: subtotal,
      });
    }

    // Shipping fee calculation: Free shipping for orders ₹499+ (49900 paise), else ₹50 (5000 paise)
    const shippingFee = calculatedSubtotal >= 49900 ? 0 : 5000;
    const totalAmount = calculatedSubtotal + shippingFee;

    const createdOrder = await db.createOrder({
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || null,
      shippingAddressLine1: data.shippingAddressLine1,
      shippingAddressLine2: data.shippingAddressLine2 || null,
      shippingCity: data.shippingCity,
      shippingState: data.shippingState,
      shippingPincode: data.shippingPincode,
      shippingLandmark: data.shippingLandmark || null,
      subtotalInMinorUnits: calculatedSubtotal,
      shippingFeeInMinorUnits: shippingFee,
      discountInMinorUnits: 0,
      totalInMinorUnits: totalAmount,
      currency: "INR",
      paymentMethod: data.paymentMethod,
      customerNotes: data.customerNotes || null,
      upiReference: data.upiReference || null,
      screenshotUrl: data.screenshotUrl || null,
      items: itemSnapshots,
    });

    // Forward lead/order to Google Sheet webhook asynchronously if configured
    syncOrderToGoogleSheet(createdOrder).catch(() => {});

    return res.status(201).json({
      success: true,
      message:
        data.paymentMethod === "cod"
          ? "Your order has been placed. Our team will verify your address before dispatch."
          : "Your order has been received. Please submit your UPI reference if not done yet.",
      orderNumber: createdOrder.orderNumber,
      orderId: createdOrder.id,
      totalInMinorUnits: createdOrder.totalInMinorUnits,
      paymentMethod: createdOrder.paymentMethod,
      paymentStatus: createdOrder.paymentStatus,
      orderStatus: createdOrder.orderStatus,
    });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message || "Failed to process checkout order",
    });
  }
});

// 2. Upload Payment Screenshot / Receipt (Public endpoint for checkout & tracking)
publicCheckoutRouter.post("/upload-receipt", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Missing file",
        message: "Please upload an image file (JPEG, PNG, WebP)",
      });
    }

    const orderNumber = req.body.orderNumber as string | undefined;
    const upiReference = req.body.upiReference as string | undefined;
    const ext = path.extname(req.file.originalname) || ".jpg";
    const fileName = `receipt-${nanoid()}${ext}`;

    let publicUrl = "";

    // 1. If Supabase Storage is active, upload to payment-receipts bucket
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("payment-receipts")
          .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true,
          });

        if (uploadError) {
          console.error("Supabase Storage receipt upload error:", uploadError.message);
        } else if (uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from("payment-receipts")
            .getPublicUrl(fileName);
          publicUrl = publicUrlData.publicUrl;
        }
      }
    }

    // 2. Local Fallback storage if Supabase upload was not used
    if (!publicUrl) {
      const uploadsDir = path.resolve(process.cwd(), "client", "public", "manus-storage", "receipts");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, req.file.buffer);
      publicUrl = `/manus-storage/receipts/${fileName}`;
    }

    // 3. If order reference provided, link to order payment record
    if (orderNumber) {
      await db.attachPaymentScreenshot(orderNumber, publicUrl, upiReference);
      const updatedOrder = await db.getOrderByNumber(orderNumber);
      if (updatedOrder) {
        syncOrderToGoogleSheet(updatedOrder).catch(() => {});
      }
    }

    return res.status(201).json({
      success: true,
      message: "Payment screenshot uploaded successfully",
      url: publicUrl,
    });
  } catch (err: any) {
    console.error("Receipt upload error:", err);
    return res.status(500).json({
      error: "Upload failed",
      message: err.message || "Failed to upload payment receipt",
    });
  }
});

// 3. Public Track Order Endpoint
publicCheckoutRouter.get("/track/:orderNumber", async (req, res) => {
  try {
    const order = await db.getOrderByNumber(req.params.orderNumber);
    if (!order) {
      return res.status(404).json({
        error: "Not Found",
        message: "No order found matching this order number",
      });
    }

    // Public sanitized order response (excludes admin notes, internal payment IDs)
    return res.json({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      shippingCity: order.shippingCity,
      shippingState: order.shippingState,
      totalInMinorUnits: order.totalInMinorUnits,
      currency: order.currency,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
      payment: order.payment
        ? {
            method: order.payment.method,
            status: order.payment.status,
            upiReference: order.payment.upiReference,
            screenshotUrl: order.payment.screenshotUrl,
          }
        : null,
      items: order.items.map(i => ({
        title: i.productTitleSnapshot,
        packSize: i.packSizeSnapshot,
        quantity: i.quantity,
        unitPriceInMinorUnits: i.unitPriceInMinorUnits,
        subtotalInMinorUnits: i.subtotalInMinorUnits,
      })),
      shipment: order.shipment
        ? {
            courierName: order.shipment.courierName,
            trackingNumber: order.shipment.trackingNumber,
            shippingStatus: order.shipment.shippingStatus,
            shippingDate: order.shipment.shippingDate,
            expectedDeliveryDate: order.shipment.expectedDeliveryDate,
            deliveredAt: order.shipment.deliveredAt,
          }
        : null,
    });
  } catch (err: any) {
    console.error("Track order error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Could not retrieve order tracking status",
    });
  }
});

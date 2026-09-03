import { Router } from "express";
import { z } from "zod";
import { requireStaffOrAdminAuth, type AuthenticatedRequest } from "../auth";
import { db } from "../db";

export const adminOrdersRouter = Router();

adminOrdersRouter.use(requireStaffOrAdminAuth);

// List orders
adminOrdersRouter.get("/", async (req, res) => {
  try {
    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;
    const paymentStatus =
      typeof req.query.paymentStatus === "string"
        ? req.query.paymentStatus
        : undefined;
    const paymentMethod =
      typeof req.query.paymentMethod === "string"
        ? req.query.paymentMethod
        : undefined;
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;
    const page =
      typeof req.query.page === "string" ? parseInt(req.query.page, 10) : 1;
    const pageSize =
      typeof req.query.pageSize === "string"
        ? parseInt(req.query.pageSize, 10)
        : 20;

    const result = await db.getAdminOrders({
      status,
      paymentStatus,
      paymentMethod,
      search,
      page,
      pageSize,
    });

    return res.json(result);
  } catch (err: any) {
    console.error("Error fetching admin orders:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Could not retrieve orders list",
    });
  }
});

// Get order details
adminOrdersRouter.get("/:id", async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({
        error: "Not Found",
        message: "Order not found",
      });
    }
    return res.json(order);
  } catch (err: any) {
    console.error("Error fetching order details:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Could not retrieve order details",
    });
  }
});

// COD Order Confirmation Workflow
const confirmCodSchema = z.object({
  notes: z.string().optional(),
});

adminOrdersRouter.post(
  "/:id/confirm-cod",
  async (req: AuthenticatedRequest, res) => {
    try {
      const order = await db.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({
          error: "Not Found",
          message: "Order not found",
        });
      }

      if (order.paymentMethod !== "cod") {
        return res.status(400).json({
          error: "Invalid Action",
          message: "Order is not a Cash on Delivery (COD) order",
        });
      }

      const parseResult = confirmCodSchema.safeParse(req.body);
      const notes = parseResult.success ? parseResult.data.notes : undefined;

      const updated = await db.confirmCodOrder(
        req.params.id,
        req.adminUser?.id || "admin",
        notes
      );

      return res.json({
        success: true,
        message: `COD order #${updated.orderNumber} confirmed. Packing task created.`,
        order: updated,
      });
    } catch (err: any) {
      console.error("Error confirming COD order:", err);
      return res.status(500).json({
        error: "Internal Server Error",
        message: err.message || "Failed to confirm COD order",
      });
    }
  }
);

// Manual UPI Verification Workflow
const verifyUpiSchema = z.object({
  upiReference: z.string().min(4, "A valid UPI reference/UTR number is required"),
  notes: z.string().optional(),
});

adminOrdersRouter.post(
  "/:id/verify-upi",
  async (req: AuthenticatedRequest, res) => {
    try {
      const order = await db.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({
          error: "Not Found",
          message: "Order not found",
        });
      }

      if (order.paymentMethod !== "manual_upi") {
        return res.status(400).json({
          error: "Invalid Action",
          message: "Order is not a Manual UPI order",
        });
      }

      const parseResult = verifyUpiSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Validation error",
          details: parseResult.error.issues,
        });
      }

      const { upiReference, notes } = parseResult.data;

      const updated = await db.verifyManualUpiPayment(
        req.params.id,
        upiReference,
        req.adminUser?.id || "admin",
        notes
      );

      return res.json({
        success: true,
        message: `UPI payment verified for order #${updated.orderNumber}. Packing task created.`,
        order: updated,
      });
    } catch (err: any) {
      console.error("Error verifying UPI payment:", err);
      return res.status(500).json({
        error: "Internal Server Error",
        message: err.message || "Failed to verify UPI payment",
      });
    }
  }
);

// Packing Task Workflow
const packingSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed"]),
  notes: z.string().optional(),
});

adminOrdersRouter.post(
  "/:id/packing",
  async (req: AuthenticatedRequest, res) => {
    try {
      const parseResult = packingSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Validation error",
          details: parseResult.error.issues,
        });
      }

      const { status, notes } = parseResult.data;
      const updated = await db.updatePackingStatus(
        req.params.id,
        status,
        req.adminUser?.id || "staff",
        notes
      );

      return res.json({
        success: true,
        message: `Packing status updated to '${status}'`,
        order: updated,
      });
    } catch (err: any) {
      console.error("Error updating packing status:", err);
      return res.status(500).json({
        error: "Internal Server Error",
        message: err.message || "Failed to update packing status",
      });
    }
  }
);

// Shipment & Tracking Workflow
const shipmentSchema = z.object({
  courierName: z.string().min(2, "Courier name is required"),
  trackingNumber: z.string().min(3, "Tracking number is required"),
  expectedDeliveryDate: z.string().nullable().optional(),
  shippingStatus: z
    .enum(["manifested", "in_transit", "out_for_delivery", "delivered"])
    .default("in_transit"),
  notes: z.string().nullable().optional(),
});

adminOrdersRouter.post(
  "/:id/shipment",
  async (req: AuthenticatedRequest, res) => {
    try {
      const parseResult = shipmentSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Validation error",
          details: parseResult.error.issues,
        });
      }

      const data = parseResult.data;
      const updated = await db.createOrUpdateShipment({
        orderId: req.params.id,
        courierName: data.courierName,
        trackingNumber: data.trackingNumber,
        expectedDeliveryDate: data.expectedDeliveryDate || null,
        shippingStatus: data.shippingStatus,
        notes: data.notes || null,
        adminUserId: req.adminUser?.id || "admin",
      });

      return res.json({
        success: true,
        message: `Shipment updated (${data.shippingStatus}) for order #${updated.orderNumber}`,
        order: updated,
      });
    } catch (err: any) {
      console.error("Error updating shipment:", err);
      return res.status(500).json({
        error: "Internal Server Error",
        message: err.message || "Failed to update shipment",
      });
    }
  }
);

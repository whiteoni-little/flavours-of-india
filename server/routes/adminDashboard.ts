import { Router } from "express";
import { z } from "zod";
import { requireAdminAuth, type AuthenticatedRequest } from "../auth";
import { db } from "../db";

export const adminDashboardRouter = Router();

adminDashboardRouter.use(requireAdminAuth);

adminDashboardRouter.get(
  ["/dashboard/summary", "/summary"],
  async (_req, res) => {
    try {
      const summary = await db.getDashboardSummary();
      return res.json(summary);
    } catch (err: any) {
      console.error("Error fetching dashboard summary:", err);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Could not retrieve dashboard metrics",
      });
    }
  }
);

// Admin Carts
adminDashboardRouter.get("/carts", async (req, res) => {
  try {
    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;
    const page =
      typeof req.query.page === "string" ? parseInt(req.query.page, 10) : 1;
    const pageSize =
      typeof req.query.pageSize === "string"
        ? parseInt(req.query.pageSize, 10)
        : 10;

    const result = await db.getAdminCarts({ status, page, pageSize });
    return res.json(result);
  } catch (err: any) {
    console.error("Error fetching carts:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Could not retrieve carts list",
    });
  }
});

adminDashboardRouter.post("/carts/:id/contacted", async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.updateCartStatus(id, "contacted");
    if (!success) {
      return res.status(404).json({
        error: "Not Found",
        message: "Cart not found",
      });
    }
    return res.json({ success: true, message: "Cart marked as contacted" });
  } catch (err: any) {
    console.error("Error marking cart contacted:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Could not update cart status",
    });
  }
});

const createNoteSchema = z.object({
  body: z.string().min(1, "Note cannot be empty").max(1000),
});

adminDashboardRouter.post(
  "/carts/:id/notes",
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const parseResult = createNoteSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Validation error",
          details: parseResult.error.issues,
        });
      }

      const note = await db.createCartNote(
        id,
        req.adminUser!.id,
        parseResult.data.body
      );
      return res.status(201).json(note);
    } catch (err: any) {
      console.error("Error creating cart note:", err);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Could not create note",
      });
    }
  }
);

adminDashboardRouter.get("/carts/:id/notes", async (req, res) => {
  try {
    const { id } = req.params;
    const notes = await db.getCartNotes(id);
    return res.json({ notes });
  } catch (err: any) {
    console.error("Error fetching cart notes:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Could not retrieve notes",
    });
  }
});

// Reminder stubs
adminDashboardRouter.post("/carts/:id/remind-email", async (_req, res) => {
  return res.status(501).json({
    configured: false,
    error: "Email messaging provider not configured",
    message:
      "Email notifications require SMTP/SES configuration in production environment",
  });
});

adminDashboardRouter.post("/carts/:id/remind-whatsapp", async (_req, res) => {
  return res.status(501).json({
    configured: false,
    error: "WhatsApp messaging provider not configured",
    message:
      "WhatsApp messaging requires a business API provider in production environment",
  });
});

// Admin Users
adminDashboardRouter.get("/users", async (req, res) => {
  try {
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;
    const page =
      typeof req.query.page === "string" ? parseInt(req.query.page, 10) : 1;
    const pageSize =
      typeof req.query.pageSize === "string"
        ? parseInt(req.query.pageSize, 10)
        : 10;

    const result = await db.getAdminUsers({ search, page, pageSize });
    return res.json(result);
  } catch (err: any) {
    console.error("Error fetching users:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Could not retrieve users list",
    });
  }
});

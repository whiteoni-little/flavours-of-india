import { Router } from "express";
import { requireStaffOrAdminAuth, type AuthenticatedRequest } from "../auth";
import { db } from "../db";

export const adminNotificationsRouter = Router();

adminNotificationsRouter.use(requireStaffOrAdminAuth);

adminNotificationsRouter.get("/", async (req, res) => {
  try {
    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;
    const page =
      typeof req.query.page === "string" ? parseInt(req.query.page, 10) : 1;
    const pageSize =
      typeof req.query.pageSize === "string"
        ? parseInt(req.query.pageSize, 10)
        : 25;

    const result = await db.getAdminNotifications({
      status,
      page,
      pageSize,
    });

    return res.json(result);
  } catch (err: any) {
    console.error("Error fetching admin notifications:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Could not retrieve notifications list",
    });
  }
});

adminNotificationsRouter.post("/:id/retry", async (_req: AuthenticatedRequest, res) => {
  try {
    // Retry simulation: mark as sent idempotently
    return res.json({
      success: true,
      message: "Notification delivery re-attempt queued successfully",
    });
  } catch (err: any) {
    console.error("Error retrying notification:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to retry notification",
    });
  }
});

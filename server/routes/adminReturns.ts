import { Router } from "express";
import { z } from "zod";
import { requireStaffOrAdminAuth, type AuthenticatedRequest } from "../auth";
import { db } from "../db";

export const adminReturnsRouter = Router();

adminReturnsRouter.use(requireStaffOrAdminAuth);

const reviewReturnSchema = z.object({
  decision: z.enum([
    "approved",
    "rejected",
    "received",
    "refund_pending",
    "refunded",
  ]),
  internalDecisionNote: z
    .string()
    .min(3, "Decision justification note is required"),
  refundAmountInMinorUnits: z.number().int().nonnegative().nullable().optional(),
  refundMethod: z.string().nullable().optional(),
  refundReference: z.string().nullable().optional(),
});

adminReturnsRouter.post(
  "/:id/review",
  async (req: AuthenticatedRequest, res) => {
    try {
      const parseResult = reviewReturnSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Validation error",
          details: parseResult.error.issues,
        });
      }

      const data = parseResult.data;
      const updatedOrder = await db.reviewReturnRequest({
        returnRequestId: req.params.id,
        decision: data.decision,
        internalDecisionNote: data.internalDecisionNote,
        refundAmountInMinorUnits: data.refundAmountInMinorUnits || null,
        refundMethod: data.refundMethod || null,
        refundReference: data.refundReference || null,
        adminUserId: req.adminUser?.id || "admin",
      });

      return res.json({
        success: true,
        message: `Return request decision set to '${data.decision}'`,
        order: updatedOrder,
      });
    } catch (err: any) {
      console.error("Error reviewing return request:", err);
      return res.status(500).json({
        error: "Internal Server Error",
        message: err.message || "Failed to process return decision",
      });
    }
  }
);

import { Router } from "express";
import { z } from "zod";
import { requireStaffOrAdminAuth, type AuthenticatedRequest } from "../auth";
import { db } from "../db";
import { storageService } from "../storage";

export const adminProductsRouter = Router();

adminProductsRouter.use(requireStaffOrAdminAuth);

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const productBaseSchema = z.object({
  sku: z.string().nullable().optional(),
  title: z.string().min(2, "Title must be at least 2 characters").max(120),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100)
    .regex(
      slugRegex,
      "Slug must be lowercase alphanumeric characters and hyphens only"
    ),
  shortDescription: z.string().min(3, "Short description is required"),
  longDescription: z.string().nullable().optional(),
  category: z.string().min(2, "Category is required"),
  packSize: z.string().nullable().optional(),
  priceInMinorUnits: z.number().int().nonnegative().nullable().optional(),
  currency: z.string().optional(),
  stockStatus: z.enum(["in_stock", "out_of_stock", "draft"]).optional(),
  stockQuantity: z.number().int().nonnegative().optional(),
  isPublished: z.boolean().optional(),
  sourcingNote: z.string().nullable().optional(),
  ingredients: z.string().nullable().optional(),
  allergenInformation: z.string().nullable().optional(),
  shelfLife: z.string().nullable().optional(),
  storageInstructions: z.string().nullable().optional(),
});

const createProductSchema = productBaseSchema.extend({
  currency: z.string().default("INR"),
  stockStatus: z.enum(["in_stock", "out_of_stock", "draft"]).default("draft"),
  stockQuantity: z.number().int().nonnegative().default(0),
  isPublished: z.boolean().default(false),
});

const updateProductSchema = productBaseSchema.partial();

adminProductsRouter.get("/", async (req, res) => {
  try {
    const category =
      typeof req.query.category === "string" ? req.query.category : undefined;
    const stockStatus =
      typeof req.query.stockStatus === "string"
        ? req.query.stockStatus
        : undefined;
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;
    const page =
      typeof req.query.page === "string" ? parseInt(req.query.page, 10) : 1;
    const pageSize =
      typeof req.query.pageSize === "string"
        ? parseInt(req.query.pageSize, 10)
        : 20;

    const result = await db.getAdminProducts({
      category,
      stockStatus,
      search,
      page,
      pageSize,
    });

    return res.json(result);
  } catch (err: any) {
    console.error("Error fetching admin products:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Could not retrieve products list",
    });
  }
});

adminProductsRouter.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const parseResult = createProductSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Validation error",
        details: parseResult.error.issues,
      });
    }

    const data = parseResult.data;

    // Check slug uniqueness
    const existingSlug = await db.getProductBySlugAny(data.slug);
    if (existingSlug && !existingSlug.deletedAt) {
      return res.status(409).json({
        error: "Conflict",
        message: `A product with slug '${data.slug}' already exists`,
      });
    }

    // Completeness validation if published
    if (data.isPublished) {
      if (!data.priceInMinorUnits || data.priceInMinorUnits <= 0) {
        return res.status(400).json({
          error: "Validation error",
          message: "Product cannot be published without a valid price",
        });
      }
    }

    const newProduct = await db.createProduct({
      ...data,
      createdBy: req.adminUser?.id || null,
    });

    await db.createAuditLog({
      adminUserId: req.adminUser?.id || null,
      action: "CREATE_PRODUCT",
      entityType: "product",
      entityId: newProduct.id,
      details: { slug: newProduct.slug, title: newProduct.title },
    });

    return res.status(201).json(newProduct);
  } catch (err: any) {
    console.error("Error creating product:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message || "Failed to create product",
    });
  }
});

adminProductsRouter.get("/:id", async (req, res) => {
  try {
    const product = await db.getAdminProductById(req.params.id);
    if (!product) {
      return res.status(404).json({
        error: "Not Found",
        message: "Product not found",
      });
    }
    return res.json(product);
  } catch (err: any) {
    console.error("Error fetching product by ID:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Could not retrieve product details",
    });
  }
});

adminProductsRouter.patch("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const parseResult = updateProductSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Validation error",
        details: parseResult.error.issues,
      });
    }

    const data = parseResult.data;
    const existing = await db.getAdminProductById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        error: "Not Found",
        message: "Product not found",
      });
    }

    // Check slug conflict if changing
    if (data.slug && data.slug !== existing.slug) {
      const conflict = await db.getProductBySlugAny(data.slug);
      if (conflict && conflict.id !== req.params.id && !conflict.deletedAt) {
        return res.status(409).json({
          error: "Conflict",
          message: `A product with slug '${data.slug}' already exists`,
        });
      }
    }

    // Validate publishing requirements
    const willBePublished =
      data.isPublished !== undefined ? data.isPublished : existing.isPublished;
    const effectivePrice =
      data.priceInMinorUnits !== undefined
        ? data.priceInMinorUnits
        : existing.priceInMinorUnits;

    if (willBePublished && (!effectivePrice || effectivePrice <= 0)) {
      return res.status(400).json({
        error: "Validation error",
        message: "Product cannot be published without a valid price greater than ₹0",
      });
    }

    const updated = await db.updateProduct(req.params.id, {
      ...data,
      updatedBy: req.adminUser?.id || null,
    });

    await db.createAuditLog({
      adminUserId: req.adminUser?.id || null,
      action: "UPDATE_PRODUCT",
      entityType: "product",
      entityId: req.params.id,
      details: data,
    });

    return res.json(updated);
  } catch (err: any) {
    console.error("Error updating product:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message || "Failed to update product",
    });
  }
});

adminProductsRouter.delete("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const existing = await db.getAdminProductById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        error: "Not Found",
        message: "Product not found or already archived",
      });
    }

    const success = await db.softDeleteProduct(req.params.id);
    if (!success) {
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to archive product",
      });
    }

    await db.createAuditLog({
      adminUserId: req.adminUser?.id || null,
      action: "ARCHIVE_PRODUCT",
      entityType: "product",
      entityId: req.params.id,
      details: { slug: existing.slug, title: existing.title },
    });

    return res.json({
      success: true,
      message: `Product '${existing.title}' archived successfully`,
    });
  } catch (err: any) {
    console.error("Error archiving product:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to archive product",
    });
  }
});

// Image Upload Presigning & Completion
adminProductsRouter.post("/:id/images/presign", async (req, res) => {
  try {
    const { filename, contentType } = req.body;
    if (!filename) {
      return res.status(400).json({
        error: "Validation error",
        message: "Filename is required",
      });
    }

    const product = await db.getAdminProductById(req.params.id);
    if (!product) {
      return res.status(404).json({
        error: "Not Found",
        message: "Product not found",
      });
    }

    const presigned = await storageService.getPresignedUploadUrl(
      filename,
      contentType || "image/jpeg",
      req.params.id
    );

    return res.json(presigned);
  } catch (err: any) {
    console.error("Presign error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message || "Failed to generate upload URL",
    });
  }
});

adminProductsRouter.post("/:id/images/complete", async (req, res) => {
  try {
    const { storagePath, storageKey, publicUrl, altText, sortOrder } = req.body;
    const finalStoragePath = storagePath || storageKey;

    if (!finalStoragePath || !publicUrl) {
      return res.status(400).json({
        error: "Validation error",
        message: "storagePath and publicUrl are required",
      });
    }

    const product = await db.getAdminProductById(req.params.id);
    if (!product) {
      return res.status(404).json({
        error: "Not Found",
        message: "Product not found",
      });
    }

    const image = await db.addProductImage({
      productId: req.params.id,
      storagePath: finalStoragePath,
      publicUrl,
      altText: altText || "",
      sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
    });

    return res.status(201).json(image);
  } catch (err: any) {
    console.error("Complete image record error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to link product image record",
    });
  }
});

adminProductsRouter.delete("/:id/images/:imageId", async (req, res) => {
  try {
    const success = await db.deleteProductImage(
      req.params.id,
      req.params.imageId
    );
    if (!success) {
      return res.status(404).json({
        error: "Not Found",
        message: "Image not found",
      });
    }
    return res.json({ success: true, message: "Image removed successfully" });
  } catch (err: any) {
    console.error("Delete image error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete product image",
    });
  }
});

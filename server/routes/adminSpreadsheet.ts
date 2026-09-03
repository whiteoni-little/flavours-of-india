import { Router } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { z } from "zod";
import { requireAdminAuth, type AuthenticatedRequest } from "../auth";
import { db } from "../db";

export const adminSpreadsheetRouter = Router();

adminSpreadsheetRouter.use(requireAdminAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "application/octet-stream",
    ];
    if (
      allowed.includes(file.mimetype) ||
      file.originalname.endsWith(".csv") ||
      file.originalname.endsWith(".xlsx") ||
      file.originalname.endsWith(".xls")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV and Excel (.xlsx, .xls) files are supported"));
    }
  },
});

const productRowSchema = z.object({
  sku: z.string().nullable().optional(),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  title: z.string().min(2, "Title is required"),
  short_description: z.string().min(3, "Short description is required"),
  long_description: z.string().nullable().optional(),
  category: z.string().min(2, "Category is required"),
  pack_size: z.string().nullable().optional(),
  price_inr: z.number().positive("Price in INR must be greater than 0"),
  stock_quantity: z.number().int().nonnegative().default(0),
  stock_status: z.enum(["in_stock", "out_of_stock", "draft"]).default("in_stock"),
  ingredients: z.string().nullable().optional(),
  allergen_information: z.string().nullable().optional(),
  shelf_life: z.string().nullable().optional(),
  storage_instructions: z.string().nullable().optional(),
  sourcing_note: z.string().nullable().optional(),
  is_published: z.boolean().default(true),
  image_url_1: z.string().nullable().optional(),
  image_url_2: z.string().nullable().optional(),
  alt_text_1: z.string().nullable().optional(),
  alt_text_2: z.string().nullable().optional(),
});

function parseWorkbook(buffer: Buffer): any[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });

  return rawRows.map(row => {
    const normalized: Record<string, any> = {};
    for (const [key, val] of Object.entries(row)) {
      const cleanKey = key.trim().toLowerCase().replace(/[\s-]+/g, "_");
      normalized[cleanKey] = typeof val === "string" ? val.trim() : val;
    }
    return normalized;
  });
}

function normalizeRow(raw: Record<string, any>) {
  // Convert boolean strings
  const isPublishedStr = String(raw.is_published || raw.published || "true").toLowerCase();
  const isPublished = isPublishedStr === "true" || isPublishedStr === "1" || isPublishedStr === "yes";

  // Parse price
  let priceInr = Number(raw.price_inr || raw.price || raw.mrp || 0);
  if (isNaN(priceInr)) priceInr = 0;

  // Parse quantity
  let stockQty = parseInt(String(raw.stock_quantity || raw.stock || raw.quantity || 0), 10);
  if (isNaN(stockQty) || stockQty < 0) stockQty = 0;

  return {
    sku: raw.sku ? String(raw.sku) : null,
    slug: raw.slug ? String(raw.slug).toLowerCase().trim() : "",
    title: raw.title ? String(raw.title) : "",
    short_description: raw.short_description || raw.short_desc || raw.description || "",
    long_description: raw.long_description || raw.long_desc || null,
    category: raw.category || "Savoury Snacks",
    pack_size: raw.pack_size || raw.size || null,
    price_inr: priceInr,
    stock_quantity: stockQty,
    stock_status: (raw.stock_status || (stockQty > 0 ? "in_stock" : "draft")).toLowerCase(),
    ingredients: raw.ingredients || null,
    allergen_information: raw.allergen_information || raw.allergens || null,
    shelf_life: raw.shelf_life || null,
    storage_instructions: raw.storage_instructions || null,
    sourcing_note: raw.sourcing_note || null,
    is_published: isPublished,
    image_url_1: raw.image_url_1 || raw.image_1 || null,
    image_url_2: raw.image_url_2 || raw.image_2 || null,
    alt_text_1: raw.alt_text_1 || null,
    alt_text_2: raw.alt_text_2 || null,
  };
}

// 1. Dry Run Spreadsheet Validation
adminSpreadsheetRouter.post(
  "/dry-run",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "Validation error",
          message: "Please upload a valid CSV or XLSX spreadsheet file",
        });
      }

      const rawRows = parseWorkbook(req.file.buffer);
      if (rawRows.length === 0) {
        return res.status(400).json({
          error: "Validation error",
          message: "Uploaded spreadsheet is empty",
        });
      }

      const errors: Array<{ row: number; field: string; message: string }> = [];
      const validRows: any[] = [];
      const seenSlugsInFile = new Set<string>();

      for (let idx = 0; idx < rawRows.length; idx++) {
        const rowNum = idx + 2; // Accounting for 1-based index + header
        const normalized = normalizeRow(rawRows[idx]);

        // Validate slug uniqueness within file
        if (normalized.slug) {
          if (seenSlugsInFile.has(normalized.slug)) {
            errors.push({
              row: rowNum,
              field: "slug",
              message: `Duplicate slug '${normalized.slug}' found in file`,
            });
          } else {
            seenSlugsInFile.add(normalized.slug);
          }
        }

        const parseResult = productRowSchema.safeParse(normalized);
        if (!parseResult.success) {
          for (const issue of parseResult.error.issues) {
            errors.push({
              row: rowNum,
              field: issue.path.join("."),
              message: issue.message,
            });
          }
        } else {
          // Check existing database conflict
          const existingInDb = await db.getProductBySlugAny(normalized.slug);
          const isUpdate = Boolean(existingInDb && !existingInDb.deletedAt);

          validRows.push({
            ...parseResult.data,
            price_in_minor_units: Math.round(parseResult.data.price_inr * 100),
            isUpdate,
            rowNumber: rowNum,
          });
        }
      }

      return res.json({
        success: true,
        fileName: req.file.originalname,
        totalRows: rawRows.length,
        validCount: validRows.length,
        errorCount: errors.length,
        errors,
        preview: validRows.slice(0, 10),
        canCommit: errors.length === 0 && validRows.length > 0,
        validatedData: validRows,
      });
    } catch (err: any) {
      console.error("Spreadsheet dry-run error:", err);
      return res.status(500).json({
        error: "Internal Server Error",
        message: err.message || "Failed to process spreadsheet dry run",
      });
    }
  }
);

// 2. Commit Spreadsheet Import
const commitSchema = z.object({
  fileName: z.string(),
  rows: z.array(
    productRowSchema.extend({
      price_in_minor_units: z.number().int().positive(),
    })
  ),
});

adminSpreadsheetRouter.post(
  "/commit",
  async (req: AuthenticatedRequest, res) => {
    try {
      const parseResult = commitSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Validation error",
          message: "Invalid commit payload",
          details: parseResult.error.issues,
        });
      }

      const { fileName, rows } = parseResult.data;
      if (rows.length === 0) {
        return res.status(400).json({
          error: "Validation error",
          message: "No rows to import",
        });
      }

      let importedCount = 0;
      let failedCount = 0;
      const failedItems: any[] = [];

      for (const row of rows) {
        try {
          const existing = await db.getProductBySlugAny(row.slug);
          let productId = existing?.id;

          if (existing && !existing.deletedAt) {
            // Update existing
            await db.updateProduct(existing.id, {
              sku: row.sku,
              title: row.title,
              shortDescription: row.short_description,
              longDescription: row.long_description,
              category: row.category,
              packSize: row.pack_size,
              priceInMinorUnits: row.price_in_minor_units,
              stockStatus: row.stock_status,
              stockQuantity: row.stock_quantity,
              isPublished: row.is_published,
              ingredients: row.ingredients,
              allergenInformation: row.allergen_information,
              shelfLife: row.shelf_life,
              storageInstructions: row.storage_instructions,
              sourcingNote: row.sourcing_note,
              updatedBy: req.adminUser?.id || null,
            });
          } else {
            // Create new
            const created = await db.createProduct({
              sku: row.sku,
              slug: row.slug,
              title: row.title,
              shortDescription: row.short_description,
              longDescription: row.long_description,
              category: row.category,
              packSize: row.pack_size,
              priceInMinorUnits: row.price_in_minor_units,
              stockStatus: row.stock_status,
              stockQuantity: row.stock_quantity,
              isPublished: row.is_published,
              ingredients: row.ingredients,
              allergenInformation: row.allergen_information,
              shelfLife: row.shelf_life,
              storageInstructions: row.storage_instructions,
              sourcingNote: row.sourcing_note,
              createdBy: req.adminUser?.id || null,
            });
            productId = created.id;
          }

          // Add images if provided
          if (productId && row.image_url_1) {
            await db.addProductImage({
              productId,
              storagePath: row.image_url_1,
              publicUrl: row.image_url_1,
              altText: row.alt_text_1 || `${row.title} Image 1`,
              sortOrder: 0,
            });
          }
          if (productId && row.image_url_2) {
            await db.addProductImage({
              productId,
              storagePath: row.image_url_2,
              publicUrl: row.image_url_2,
              altText: row.alt_text_2 || `${row.title} Image 2`,
              sortOrder: 1,
            });
          }

          importedCount++;
        } catch (itemErr: any) {
          failedCount++;
          failedItems.push({ slug: row.slug, error: itemErr.message });
        }
      }

      // Record in import log and audit log
      await db.createImportLog({
        adminUserId: req.adminUser?.id || null,
        fileName,
        importType: "products",
        totalRows: rows.length,
        importedRows: importedCount,
        failedRows: failedCount,
        errors: failedItems.length > 0 ? failedItems : null,
      });

      await db.createAuditLog({
        adminUserId: req.adminUser?.id || null,
        action: "IMPORT_PRODUCTS_SPREADSHEET",
        entityType: "product_catalogue",
        entityId: fileName,
        details: { total: rows.length, imported: importedCount, failed: failedCount },
      });

      return res.json({
        success: true,
        message: `Successfully imported ${importedCount} product(s). ${failedCount} failed.`,
        importedCount,
        failedCount,
        failedItems,
      });
    } catch (err: any) {
      console.error("Spreadsheet commit error:", err);
      return res.status(500).json({
        error: "Internal Server Error",
        message: err.message || "Failed to commit spreadsheet import",
      });
    }
  }
);

// 3. Download Spreadsheet Templates
adminSpreadsheetRouter.get("/template/:type", (req, res) => {
  const type = req.params.type;
  if (type === "payments" || type === "reconciliation") {
    const csvContent = `order_number,customer_name,customer_phone,customer_email,payment_method,payment_status,upi_reference,amount_inr,payment_verified_at,admin_notes\nFOI-2026-10041,Aarav Sharma,9876543210,aarav.sharma@example.com,manual_upi,upi_verified,423891002341,498.00,2026-09-02T10:30:00Z,Bank statement matched UTR\nFOI-2026-10042,Priya Patel,9823456789,priya.patel@example.com,cod,cod_pending,,398.00,,Customer confirmed phone on call`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=payment_reconciliation_template.csv");
    return res.send(csvContent);
  }

  // Product template
  const csvContent = `sku,slug,title,short_description,long_description,category,pack_size,price_inr,stock_quantity,stock_status,ingredients,allergen_information,shelf_life,storage_instructions,sourcing_note,is_published,image_url_1,image_url_2,alt_text_1,alt_text_2\nSNK-MANGO-300G,traditional-mango-pickle,Traditional Sun-Dried Mango Pickle,Hand-cut raw mangoes cured in mustard oil with aromatic spices,Handcrafted family recipe sun-cured for three weeks,Pickles,300g Jar,249.00,50,in_stock,"Raw mango, mustard oil, fenugreek, chili, salt, turmeric",Contains mustard,12 months,Store in a cool dry place,Vijayawada organic mangoes,TRUE,https://example.com/mango1.jpg,,Mango Pickle Front,\nSNK-PAPAD-200G,crispy-urad-dal-papad,Hand-Rolled Urad Dal Papad,Sun-dried thin wafers made from stone-ground urad dal,Crisp and light seasoned with crushed black pepper,Papad,200g Pack,149.00,100,in_stock,"Urad dal flour, black pepper, cumin, salt",May contain gluten,9 months,Keep airtight in dry pantry,Bikaner artisan cooperative,TRUE,,,Urad Papad,`;
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=product_catalogue_template.csv");
  return res.send(csvContent);
});

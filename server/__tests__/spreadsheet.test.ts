import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { hashPassword } from "../auth";
import { db } from "../db";

describe("Flavours of India — Spreadsheet Import & Dry-Run Test Suite", () => {
  let adminCookie: string;
  const testSuffix = Math.random().toString(36).substring(2, 7);

  beforeAll(async () => {
    const email = `spreadsheetadmin_${testSuffix}@flavoursofindia.com`;
    const password = "AdminTestPassword@123";
    const passwordHash = await hashPassword(password);

    const user = await db.createAdminUser({
      email,
      passwordHash,
      name: "Spreadsheet Admin",
      role: "admin",
    });

    const loginRes = await request(app)
      .post("/api/admin/auth/login")
      .send({ email, password });

    adminCookie = loginRes.headers["set-cookie"][0];
  });

  it("should reject unauthorized dry-run requests without admin credentials", async () => {
    const res = await request(app).post("/api/admin/spreadsheet/dry-run");
    expect(res.status).toBe(401);
  });

  it("should validate CSV format and return dry-run preview with converted paise prices", async () => {
    const csvData = Buffer.from(
      `sku,slug,title,short_description,category,pack_size,price_inr,stock_quantity,stock_status,is_published\n` +
      `SNK-TEST-1,test-spiced-snack-${testSuffix},Spiced Test Snack,Crispy snack,Savoury Snacks,200g,199.50,50,in_stock,TRUE\n` +
      `SNK-TEST-2,test-sweet-snack-${testSuffix},Sweet Test Snack,Melt in mouth snack,Tea-Time Snacks,250g,250.00,30,in_stock,TRUE`
    );

    const res = await request(app)
      .post("/api/admin/spreadsheet/dry-run")
      .set("Cookie", adminCookie)
      .attach("file", csvData, "valid_products.csv");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.totalRows).toBe(2);
    expect(res.body.validCount).toBe(2);
    expect(res.body.errorCount).toBe(0);
    expect(res.body.canCommit).toBe(true);

    // Verify INR 199.50 -> 19950 paise
    expect(res.body.validatedData[0].price_in_minor_units).toBe(19950);
  });

  it("should flag duplicate slugs within the spreadsheet file", async () => {
    const duplicateSlugCsv = Buffer.from(
      `sku,slug,title,short_description,category,price_inr,stock_quantity,is_published\n` +
      `SKU-1,duplicate-slug-${testSuffix},Item One,Short desc,Pickles,200,10,TRUE\n` +
      `SKU-2,duplicate-slug-${testSuffix},Item Two,Short desc,Pickles,200,10,TRUE`
    );

    const res = await request(app)
      .post("/api/admin/spreadsheet/dry-run")
      .set("Cookie", adminCookie)
      .attach("file", duplicateSlugCsv, "duplicate_products.csv");

    expect(res.status).toBe(200);
    expect(res.body.canCommit).toBe(false);
    expect(res.body.errorCount).toBeGreaterThanOrEqual(1);
    const slugErr = res.body.errors.find((e: any) => e.field === "slug");
    expect(slugErr).toBeDefined();
    expect(slugErr.message).toContain("Duplicate slug");
  });

  it("should flag invalid prices and missing required fields in dry run", async () => {
    const invalidCsv = Buffer.from(
      `sku,slug,title,short_description,category,price_inr,stock_quantity\n` +
      `SKU-1,valid-slug-${testSuffix},Valid Title,Valid short description,Papad,-50,10\n` + // Negative price
      `SKU-2,invalid_SLUG!,,Missing Title & Category,,0,0` // Invalid slug regex & missing fields
    );

    const res = await request(app)
      .post("/api/admin/spreadsheet/dry-run")
      .set("Cookie", adminCookie)
      .attach("file", invalidCsv, "invalid_products.csv");

    expect(res.status).toBe(200);
    expect(res.body.canCommit).toBe(false);
    expect(res.body.errorCount).toBeGreaterThanOrEqual(2);
  });

  it("should commit valid products to database transactionally with import log", async () => {
    const validRows = [
      {
        sku: `SNK-COMMIT-1-${testSuffix}`,
        slug: `commit-snack-1-${testSuffix}`,
        title: "Committed Snack One",
        short_description: "A wonderful test snack",
        category: "Roasted Snacks",
        price_inr: 220,
        price_in_minor_units: 22000,
        stock_quantity: 45,
        stock_status: "in_stock" as const,
        is_published: true,
      },
    ];

    const res = await request(app)
      .post("/api/admin/spreadsheet/commit")
      .set("Cookie", adminCookie)
      .send({
        fileName: "test_committed_snack.csv",
        rows: validRows,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.importedCount).toBe(1);

    // Verify product is now present in DB
    const checkProduct = await db.getProductBySlugAny(`commit-snack-1-${testSuffix}`);
    expect(checkProduct).toBeDefined();
    expect(checkProduct?.title).toBe("Committed Snack One");
  });

  it("should provide downloadable CSV templates", async () => {
    const prodTemplateRes = await request(app)
      .get("/api/admin/spreadsheet/template/products")
      .set("Cookie", adminCookie);

    expect(prodTemplateRes.status).toBe(200);
    expect(prodTemplateRes.text).toContain("sku,slug,title,short_description");

    const payTemplateRes = await request(app)
      .get("/api/admin/spreadsheet/template/payments")
      .set("Cookie", adminCookie);

    expect(payTemplateRes.status).toBe(200);
    expect(payTemplateRes.text).toContain("order_number,customer_name,customer_phone");
  });
});

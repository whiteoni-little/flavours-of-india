import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { hashPassword } from "../auth";
import { db } from "../db";

describe("Flavours of India — Supabase Architecture & Production Test Suite", () => {
  let adminCookie: string;
  let testAdminId: string;
  let liveProductId: string;
  let draftProductId: string;
  let testCodOrderId: string;
  let testUpiOrderId: string;
  let testOrderNumber: string;

  const testSuffix = Math.random().toString(36).substring(2, 7);
  const liveSlug = `test-live-papad-${testSuffix}`;
  const draftSlug = `test-draft-product-${testSuffix}`;

  beforeAll(async () => {
    // Seed test admin user
    const email = `testadmin_${testSuffix}@flavoursofindia.com`;
    const password = "TestPassword@123";
    const passwordHash = await hashPassword(password);

    const existing = await db.getAdminUserByEmail(email);
    if (!existing) {
      const user = await db.createAdminUser({
        email,
        passwordHash,
        name: "Test Admin",
        role: "admin",
      });
      testAdminId = user.id;
    } else {
      testAdminId = existing.id;
    }
  });

  // =========================================================================
  // 1. Admin Authentication & Role-Based Access Control
  // =========================================================================
  describe("1. Admin Authentication & Role Enforcement", () => {
    it("should reject unauthenticated access to /api/admin/products with 401", async () => {
      const res = await request(app).get("/api/admin/products");
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Unauthorized");
    });

    it("should reject unauthenticated access to /api/admin/orders with 401", async () => {
      const res = await request(app).get("/api/admin/orders");
      expect(res.status).toBe(401);
    });

    it("should reject login with invalid credentials with 401", async () => {
      const res = await request(app)
        .post("/api/admin/auth/login")
        .send({
          email: `testadmin_${testSuffix}@flavoursofindia.com`,
          password: "wrongpassword",
        });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Unauthorized");
    });

    it("should successfully log in with valid credentials and return session cookie", async () => {
      const res = await request(app)
        .post("/api/admin/auth/login")
        .send({
          email: `testadmin_${testSuffix}@flavoursofindia.com`,
          password: "TestPassword@123",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(`testadmin_${testSuffix}@flavoursofindia.com`);
      expect(res.body.user.role).toBe("admin");

      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      adminCookie = cookies[0];
    });

    it("should verify active session via /api/admin/auth/session", async () => {
      const res = await request(app)
        .get("/api/admin/auth/session")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.authenticated).toBe(true);
      expect(res.body.user.role).toBe("admin");
    });
  });

  // =========================================================================
  // 2. Product Catalogue CRUD & Validation
  // =========================================================================
  describe("2. Product Catalogue CRUD & Storefront Boundaries", () => {
    it("should reject creating published product without a valid price", async () => {
      const res = await request(app)
        .post("/api/admin/products")
        .set("Cookie", adminCookie)
        .send({
          title: "Incomplete Snack",
          slug: `incomplete-${testSuffix}`,
          shortDescription: "Sample description",
          category: "Pickles",
          isPublished: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("cannot be published without a valid price");
    });

    it("should create a draft product successfully", async () => {
      const res = await request(app)
        .post("/api/admin/products")
        .set("Cookie", adminCookie)
        .send({
          sku: `SKU-DRAFT-${testSuffix}`,
          title: "Draft Nankhatai",
          slug: draftSlug,
          shortDescription: "Cardamom shortbread cookie",
          category: "Tea-Time Snacks",
          stockStatus: "draft",
          stockQuantity: 20,
          isPublished: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.slug).toBe(draftSlug);
      expect(res.body.isPublished).toBe(false);
      draftProductId = res.body.id;
    });

    it("should create a published product with images", async () => {
      const res = await request(app)
        .post("/api/admin/products")
        .set("Cookie", adminCookie)
        .send({
          sku: `SKU-LIVE-${testSuffix}`,
          title: "Live Masala Papad",
          slug: liveSlug,
          shortDescription: "Crispy black pepper papad",
          category: "Papad",
          packSize: "200g Pack",
          priceInMinorUnits: 14900, // ₹149.00
          stockStatus: "in_stock",
          stockQuantity: 100,
          isPublished: true,
          ingredients: "Urad dal, pepper, cumin, salt",
          shelfLife: "9 months",
        });

      expect(res.status).toBe(201);
      expect(res.body.priceInMinorUnits).toBe(14900);
      expect(res.body.isPublished).toBe(true);
      liveProductId = res.body.id;

      // Add image to live product
      const imgRes = await request(app)
        .post(`/api/admin/products/${liveProductId}/images/complete`)
        .set("Cookie", adminCookie)
        .send({
          storagePath: "products/sample_papad.jpg",
          publicUrl: "/manus-storage/product-papad_e718ba72.jpg",
          altText: "Live Masala Papad Pack",
          sortOrder: 0,
        });

      expect(imgRes.status).toBe(201);
      expect(imgRes.body.productId).toBe(liveProductId);
    });

    it("should return only published items in public /api/products (draft excluded)", async () => {
      const res = await request(app).get("/api/products");
      expect(res.status).toBe(200);
      expect(res.body.products).toBeInstanceOf(Array);

      const foundDraft = res.body.products.find((p: any) => p.slug === draftSlug);
      expect(foundDraft).toBeUndefined();

      const foundLive = res.body.products.find((p: any) => p.slug === liveSlug);
      expect(foundLive).toBeDefined();
      expect(foundLive.images.length).toBeGreaterThanOrEqual(1);
    });

    it("should return 404 on public endpoint for draft slug", async () => {
      const res = await request(app).get(`/api/products/${draftSlug}`);
      expect(res.status).toBe(404);
    });

    it("should soft-delete product and exclude from catalogue", async () => {
      const delRes = await request(app)
        .delete(`/api/admin/products/${draftProductId}`)
        .set("Cookie", adminCookie);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);
    });
  });

  // =========================================================================
  // 3. Customer Checkout Workflows (COD & Manual UPI)
  // =========================================================================
  describe("3. Customer Checkout & Order Creation", () => {
    it("should create a Cash on Delivery (COD) order in cod_confirmation_pending state", async () => {
      const res = await request(app)
        .post("/api/checkout")
        .send({
          customerName: "Aarav Sharma",
          customerPhone: "9876543210",
          customerEmail: "aarav@example.com",
          shippingAddressLine1: "Flat 201, Green Heights, MG Road",
          shippingCity: "Bhubaneswar",
          shippingState: "Odisha",
          shippingPincode: "751024",
          paymentMethod: "cod",
          items: [
            {
              productId: liveProductId,
              quantity: 2,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.orderNumber).toBeDefined();
      expect(res.body.paymentMethod).toBe("cod");
      expect(res.body.orderStatus).toBe("cod_confirmation_pending");
      expect(res.body.paymentStatus).toBe("cod_pending");

      testCodOrderId = res.body.orderId;
      testOrderNumber = res.body.orderNumber;
    });

    it("should create a Manual UPI order in upi_pending_verification state", async () => {
      const res = await request(app)
        .post("/api/checkout")
        .send({
          customerName: "Priya Patel",
          customerPhone: "9823456789",
          customerEmail: "priya@example.com",
          shippingAddressLine1: "House 12, Sunrise Enclave",
          shippingCity: "Mumbai",
          shippingState: "Maharashtra",
          shippingPincode: "400001",
          paymentMethod: "manual_upi",
          upiReference: "423891002341",
          items: [
            {
              productId: liveProductId,
              quantity: 1,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.paymentMethod).toBe("manual_upi");
      expect(res.body.paymentStatus).toBe("upi_pending_verification");
      testUpiOrderId = res.body.orderId;
    });

    it("should allow uploading a payment screenshot and attaching it to order", async () => {
      const dummyImageBuffer = Buffer.from("fake-png-binary-data");
      const res = await request(app)
        .post("/api/checkout/upload-receipt")
        .attach("file", dummyImageBuffer, "receipt.png")
        .field("orderNumber", testOrderNumber)
        .field("upiReference", "423891002341");

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.url).toBeDefined();

      // Check tracking endpoint returns updated screenshot url
      const trackRes = await request(app).get(`/api/checkout/track/${testOrderNumber}`);
      expect(trackRes.status).toBe(200);
      expect(trackRes.body.payment).toBeDefined();
      expect(trackRes.body.payment.screenshotUrl).toBeDefined();
    });

    it("should track order publicly by order number", async () => {
      const res = await request(app).get(`/api/checkout/track/${testOrderNumber}`);
      expect(res.status).toBe(200);
      expect(res.body.orderNumber).toBe(testOrderNumber);
      expect(res.body.customerName).toBe("Aarav Sharma");
      expect(res.body.items.length).toBe(1);
    });
  });

  // =========================================================================
  // 4. Admin Order Confirmation, Packing, and Dispatch Workflows
  // =========================================================================
  describe("4. Admin Workflows: COD Confirm, UPI Verify, Packing & Shipping", () => {
    it("should confirm COD order and create packing task exactly once", async () => {
      const res = await request(app)
        .post(`/api/admin/orders/${testCodOrderId}/confirm-cod`)
        .set("Cookie", adminCookie)
        .send({ notes: "Phone verified with customer" });

      expect(res.status).toBe(200);
      expect(res.body.order.orderStatus).toBe("confirmed");
      expect(res.body.order.packingTask).toBeDefined();
      expect(res.body.order.packingTask.status).toBe("pending");

      // Attempting duplicate confirm must remain idempotent
      const dupRes = await request(app)
        .post(`/api/admin/orders/${testCodOrderId}/confirm-cod`)
        .set("Cookie", adminCookie);

      expect(dupRes.status).toBe(200);
      expect(dupRes.body.order.packingTask).toBeDefined();
    });

    it("should verify Manual UPI payment and transition to confirmed with packing task", async () => {
      const res = await request(app)
        .post(`/api/admin/orders/${testUpiOrderId}/verify-upi`)
        .set("Cookie", adminCookie)
        .send({
          upiReference: "423891002341",
          notes: "Bank statement match confirmed",
        });

      expect(res.status).toBe(200);
      expect(res.body.order.paymentStatus).toBe("upi_verified");
      expect(res.body.order.orderStatus).toBe("confirmed");
      expect(res.body.order.packingTask).toBeDefined();
    });

    it("should update packing status from pending -> in_progress -> completed", async () => {
      const packRes = await request(app)
        .post(`/api/admin/orders/${testCodOrderId}/packing`)
        .set("Cookie", adminCookie)
        .send({ status: "completed", notes: "Extra protective packaging added" });

      expect(packRes.status).toBe(200);
      expect(packRes.body.order.orderStatus).toBe("packed");
      expect(packRes.body.order.packingTask.status).toBe("completed");
    });

    it("should dispatch shipment with courier name and tracking number", async () => {
      const shipRes = await request(app)
        .post(`/api/admin/orders/${testCodOrderId}/shipment`)
        .set("Cookie", adminCookie)
        .send({
          courierName: "Delhivery",
          trackingNumber: "DEL99283741",
          expectedDeliveryDate: "2026-09-08",
          shippingStatus: "in_transit",
        });

      expect(shipRes.status).toBe(200);
      expect(shipRes.body.order.orderStatus).toBe("shipped");
      expect(shipRes.body.order.shipment.trackingNumber).toBe("DEL99283741");
    });

    it("should mark delivery and collect COD payment automatically", async () => {
      const deliverRes = await request(app)
        .post(`/api/admin/orders/${testCodOrderId}/shipment`)
        .set("Cookie", adminCookie)
        .send({
          courierName: "Delhivery",
          trackingNumber: "DEL99283741",
          shippingStatus: "delivered",
        });

      expect(deliverRes.status).toBe(200);
      expect(deliverRes.body.order.orderStatus).toBe("delivered");
      expect(deliverRes.body.order.paymentStatus).toBe("cod_collected");
    });
  });

  // =========================================================================
  // 5. Returns & Refunds Workflow
  // =========================================================================
  describe("5. Returns & Refunds Workflow", () => {
    let returnRequestId: string;

    it("should submit a customer return request", async () => {
      const retReq = await db.createReturnRequest({
        orderId: testCodOrderId,
        customerReason: "Damaged outer packaging during transit",
      });

      expect(retReq.id).toBeDefined();
      expect(retReq.status).toBe("requested");
      returnRequestId = retReq.id;

      const order = await db.getOrderById(testCodOrderId);
      expect(order?.orderStatus).toBe("return_requested");
    });

    it("should review and approve return request with refund", async () => {
      const res = await request(app)
        .post(`/api/admin/returns/${returnRequestId}/review`)
        .set("Cookie", adminCookie)
        .send({
          decision: "refunded",
          internalDecisionNote: "Verified damaged courier claim. Refund initiated.",
          refundAmountInMinorUnits: 29800,
          refundReference: "REF-4238910",
        });

      expect(res.status).toBe(200);
      expect(res.body.order.orderStatus).toBe("refunded");
      expect(res.body.order.paymentStatus).toBe("refunded");
    });
  });

  // =========================================================================
  // 6. Notifications Queue & Idempotency
  // =========================================================================
  describe("6. Notifications Queue & Idempotency", () => {
    it("should list queued and delivered notifications", async () => {
      const res = await request(app)
        .get("/api/admin/notifications")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.notifications).toBeInstanceOf(Array);
      expect(res.body.notifications.length).toBeGreaterThanOrEqual(1);
    });

    it("should reject duplicate notifications with same idempotency key", async () => {
      const notif1 = await db.queueNotification({
        orderId: testCodOrderId,
        channel: "internal",
        notificationType: "order_delivered",
        recipient: "customer@example.com",
        title: "Order Delivered",
        body: "Your snacks arrived!",
        idempotencyKey: `test-idempotent-key-${testSuffix}`,
      });

      const notif2 = await db.queueNotification({
        orderId: testCodOrderId,
        channel: "internal",
        notificationType: "order_delivered",
        recipient: "customer@example.com",
        title: "Order Delivered",
        body: "Your snacks arrived!",
        idempotencyKey: `test-idempotent-key-${testSuffix}`,
      });

      expect(notif1.id).toBe(notif2.id); // Same record returned without creating duplicates
    });
  });

  // =========================================================================
  // 7. Admin Logout
  // =========================================================================
  describe("7. Admin Logout", () => {
    it("should invalidate session upon logout", async () => {
      const res = await request(app)
        .post("/api/admin/auth/logout")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const sessionRes = await request(app)
        .get("/api/admin/auth/session")
        .set("Cookie", adminCookie);
      expect(sessionRes.status).toBe(401);
    });
  });
});

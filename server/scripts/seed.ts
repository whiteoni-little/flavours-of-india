import "dotenv/config";
import { hashPassword } from "../auth";
import { db } from "../db";
import { isSupabaseConfigured } from "../db/supabaseClient";

async function seed() {
  console.log(
    "[SEED] Starting sample snack seed for Flavours of India..."
  );

  // 1. Seed Admin User (Development only)
  const adminEmail =
    process.env.ADMIN_BOOTSTRAP_EMAIL || "dev-admin@flavoursofindia.com";
  const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || "DevAdminSecure2026!";
  const passwordHash = await hashPassword(adminPassword);

  let admin = await db.getAdminUserByEmail(adminEmail);
  if (!admin) {
    admin = await db.createAdminUser({
      email: adminEmail,
      passwordHash,
      password: adminPassword,
      name: "Operations Admin",
      role: "admin",
    });
    console.log(`[SEED] Created sample admin account: ${adminEmail}`);
  } else {
    console.log(`[SEED] Admin account ${adminEmail} already present.`);
  }

  // 2. Seed Sample Snack Catalogue
  const sampleProducts = [
    {
      sku: "SNK-MNGO-300G",
      slug: "sample-mango-pickle",
      title: "Sample — Traditional Mango Pickle",
      shortDescription:
        "Bright, tangy, sun-warmed mango pickle made with slow-roasted spices and cold-pressed mustard oil.",
      longDescription:
        "Hand-cut raw mangoes cured in cold-pressed mustard oil with fenugreek, nigella, and Kashmiri chili. Sourced from organic mango orchards.",
      category: "Pickles",
      packSize: "300g Jar",
      priceInMinorUnits: 24900, // ₹249.00
      currency: "INR",
      stockStatus: "in_stock" as const,
      stockQuantity: 75,
      isPublished: true,
      sourcingNote: "Small batch prepared in Ganjam, Odisha using age-old sun-curing traditions.",
      ingredients: "Raw green mangoes, mustard oil, fenugreek, fennel seeds, turmeric, red chilli, sea salt.",
      shelfLife: "12 months from manufacturing date.",
      storageInstructions: "Store in a cool, dry place. Use clean, dry spoon.",
      images: [
        {
          storagePath: "sample/product-pickle.jpg",
          publicUrl: "/manus-storage/product-pickle_c9669039.jpg",
          altText: "Jar of handcrafted mango pickle",
          sortOrder: 0,
        },
      ],
    },
    {
      sku: "SNK-PAPD-200G",
      slug: "sample-urad-dal-papad",
      title: "Sample — Hand-Rolled Urad Dal Papad",
      shortDescription:
        "Sun-dried thin wafers made from stone-ground urad dal and Tellicherry black pepper.",
      longDescription:
        "Crisp, light, and seasoned with stone-ground spices. Roast directly on flame or fry for authentic crunch.",
      category: "Papad",
      packSize: "200g Pack",
      priceInMinorUnits: 14900, // ₹149.00
      currency: "INR",
      stockStatus: "in_stock" as const,
      stockQuantity: 120,
      isPublished: true,
      sourcingNote: "Crafted by artisan women cooperatives in Bikaner.",
      ingredients: "Urad dal flour, black pepper, cumin, asafoetida, salt, sunflower oil.",
      shelfLife: "9 months from packaging.",
      storageInstructions: "Store sealed in airtight dry box.",
      images: [
        {
          storagePath: "sample/product-papad.jpg",
          publicUrl: "/manus-storage/product-papad_e718ba72.jpg",
          altText: "Stack of thin hand-rolled papads",
          sortOrder: 0,
        },
      ],
    },
    {
      sku: "SNK-GNUT-250G",
      slug: "sample-masala-groundnut",
      title: "Sample — Spiced Masala Groundnuts",
      shortDescription:
        "Crunchy roasted Gujarat peanuts coated in a fiery blend of dried spices, amchur, and curry leaves.",
      longDescription:
        "Dry-roasted red-skin groundnuts seasoned with signature chaat masala, rock salt, and toasted curry leaves.",
      category: "Roasted Snacks",
      packSize: "250g Pouch",
      priceInMinorUnits: 18900, // ₹189.00
      currency: "INR",
      stockStatus: "in_stock" as const,
      stockQuantity: 150,
      isPublished: true,
      sourcingNote: "Sourced directly from Saurashtra peanut harvest.",
      ingredients: "Peanuts, curry leaves, amchur, Kashmiri chili, rock salt, chaat masala.",
      shelfLife: "6 months.",
      storageInstructions: "Keep pouch sealed tightly after opening.",
      images: [
        {
          storagePath: "sample/product-groundnut.jpg",
          publicUrl: "/manus-storage/product-groundnut_9cfaea32.jpg",
          altText: "Bowl of spiced roasted groundnuts",
          sortOrder: 0,
        },
      ],
    },
    {
      sku: "SNK-CASH-200G",
      slug: "sample-roasted-cashews",
      title: "Sample — A2 Ghee Roasted Cashews",
      shortDescription:
        "Jumbo Goan cashews gently tossed in pure A2 cow ghee and crushed Malabar pepper.",
      longDescription:
        "Whole Grade W240 cashew nuts roasted slowly in small copper kadhais for maximum richness.",
      category: "Roasted Snacks",
      packSize: "200g Tin",
      priceInMinorUnits: 42900, // ₹429.00
      currency: "INR",
      stockStatus: "in_stock" as const,
      stockQuantity: 60,
      isPublished: true,
      sourcingNote: "Directly sourced from Goa cashew estates.",
      ingredients: "Goan cashews, pure cow ghee, black pepper, Himalayan pink salt.",
      shelfLife: "6 months.",
      storageInstructions: "Store in a cool dry pantry.",
      images: [
        {
          storagePath: "sample/product-cashews.jpg",
          publicUrl: "/manus-storage/product-cashews_555b706c.jpg",
          altText: "Ghee roasted pepper cashews",
          sortOrder: 0,
        },
      ],
    },
    {
      sku: "SNK-BHUJ-350G",
      slug: "sample-bhujia-mixture",
      title: "Sample — Royal Bikaneri Bhujia Mixture",
      shortDescription:
        "Crispy moth bean sev combined with roasted cashews, split chickpeas, raisins, and aromatic spices.",
      longDescription:
        "An iconic savoury delight prepared using traditional moth dal flour and whole Rajasthani spices.",
      category: "Savoury Snacks",
      packSize: "350g Pouch",
      priceInMinorUnits: 23900, // ₹239.00
      currency: "INR",
      stockStatus: "in_stock" as const,
      stockQuantity: 95,
      isPublished: true,
      sourcingNote: "Prepared in traditional small batches in Bikaner, Rajasthan.",
      ingredients: "Moth bean flour, gram flour, cashews, raisins, black pepper, salt, groundnut oil.",
      shelfLife: "6 months.",
      storageInstructions: "Keep away from moisture and direct heat.",
      images: [
        {
          storagePath: "sample/product-bhujia.jpg",
          publicUrl: "/manus-storage/product-bhujia_a94f6c41.jpg",
          altText: "Bikaneri bhujia savoury mixture",
          sortOrder: 0,
        },
      ],
    },
    {
      sku: "SNK-MATH-300G",
      slug: "sample-masala-methi-mathri",
      title: "Sample — Flaky Masala Methi Mathri",
      shortDescription:
        "Crisp, flaky layered shortcrust discs infused with kasuri methi, crushed peppercorns, and ajwain.",
      longDescription:
        "The quintessential North Indian tea-time treat. Fragrant with dried fenugreek leaves and golden baked.",
      category: "Tea-Time Snacks",
      packSize: "300g Pack",
      priceInMinorUnits: 20900, // ₹209.00
      currency: "INR",
      stockStatus: "in_stock" as const,
      stockQuantity: 80,
      isPublished: true,
      sourcingNote: "Nagaur fenugreek harvest spices.",
      ingredients: "Wheat flour, semolina, kasuri methi, ajwain, black pepper, vegetable oil, salt.",
      shelfLife: "6 months.",
      storageInstructions: "Store at room temperature in airtight container.",
      images: [
        {
          storagePath: "sample/product-mathri.jpg",
          publicUrl: "/manus-storage/product-papad_e718ba72.jpg",
          altText: "Crisp flaky methi mathri biscuits",
          sortOrder: 0,
        },
      ],
    },
    {
      sku: "SNK-NANK-250G",
      slug: "sample-cardamom-nankhatai",
      title: "Sample — Cardamom & Pistachio Nankhatai (Draft)",
      shortDescription:
        "Melt-in-mouth traditional Indian shortbread biscuits with green cardamom and slivered nuts.",
      longDescription:
        "Slow-baked traditional shortbread cookies with fragrant Idukki cardamom. Currently marked draft.",
      category: "Tea-Time Snacks",
      packSize: "250g Tin",
      priceInMinorUnits: null, // Draft item without price
      currency: "INR",
      stockStatus: "draft" as const,
      stockQuantity: 30,
      isPublished: false,
      sourcingNote: "Handcrafted confectionery.",
      ingredients: "Wheat flour, gram flour, ghee, sugar, cardamom, pistachio.",
      shelfLife: "3 months.",
      storageInstructions: "Keep in dry container.",
      images: [],
    },
  ];

  for (const item of sampleProducts) {
    const existing = await db.getProductBySlugAny(item.slug);
    let prodId: string;

    if (!existing) {
      const created = await db.createProduct({
        sku: item.sku,
        slug: item.slug,
        title: item.title,
        shortDescription: item.shortDescription,
        longDescription: item.longDescription,
        category: item.category,
        packSize: item.packSize,
        priceInMinorUnits: item.priceInMinorUnits,
        currency: item.currency,
        stockStatus: item.stockStatus,
        stockQuantity: item.stockQuantity,
        isPublished: item.isPublished,
        sourcingNote: item.sourcingNote,
        ingredients: item.ingredients,
        shelfLife: item.shelfLife,
        storageInstructions: item.storageInstructions,
        createdBy: admin.id,
      });
      prodId = created.id;
      console.log(`[SEED] Created product: ${item.title}`);
    } else {
      prodId = existing.id;
      console.log(`[SEED] Product ${item.title} already exists.`);
    }

    for (const img of item.images) {
      const currentImages = await db.getProductImages(prodId);
      const exists = currentImages.some(i => i.publicUrl === img.publicUrl);
      if (!exists) {
        await db.addProductImage({
          productId: prodId,
          storagePath: img.storagePath,
          publicUrl: img.publicUrl,
          altText: img.altText,
          sortOrder: img.sortOrder,
        });
      }
    }
  }

  console.log("✅ [SEED] Sample snack seed completed successfully.");
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ [SEED ERROR]:", err);
  process.exit(1);
});

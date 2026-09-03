import "dotenv/config";

async function testGoogleSheetWebhook() {
  const url = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  console.log("Testing Google Sheet Webhook URL:", url);
  if (!url) {
    console.error("Missing GOOGLE_SHEET_WEBHOOK_URL");
    return;
  }

  const payload = {
    orderNumber: `FOI-2026-${Math.floor(10000 + Math.random() * 90000)}`,
    customerName: "Durga Prasad Patro (Live Test)",
    customerPhone: "7978560619",
    customerEmail: "durgapatro06@gmail.com",
    shippingAddress: "Plot 45, Main Road",
    shippingCity: "Berhampur",
    shippingState: "Odisha",
    shippingPincode: "760001",
    itemsSummary: "Traditional Andhra Avakaya Mango Pickle (350g) x 1, Bikaneri Moong Papad (200g) x 2",
    totalInRupees: "547",
    paymentMethod: "manual_upi",
    upiReference: "423891002341",
    screenshotUrl: "https://zqmaorskilxfmodsznhf.supabase.co/storage/v1/object/public/payment-receipts/sample_receipt.png",
    orderStatus: "placed",
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log("Response status:", res.status);
    console.log("Response body:", text);
    console.log("✅ Check your Google Sheet now! A live order row has been added.");
  } catch (err: any) {
    console.error("Webhook failed:", err.message);
  }
}

testGoogleSheetWebhook();

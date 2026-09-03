import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Package,
  QrCode,
  ShieldCheck,
  Truck,
  Upload,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

interface OrderTrackingData {
  orderNumber: string;
  customerName: string;
  shippingCity: string;
  shippingState: string;
  totalInMinorUnits: number;
  paymentMethod: "cod" | "manual_upi" | "gateway";
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  payment?: {
    method: string;
    status: string;
    upiReference: string | null;
    screenshotUrl: string | null;
  } | null;
  items: Array<{
    title: string;
    packSize: string | null;
    quantity: number;
    unitPriceInMinorUnits: number;
    subtotalInMinorUnits: number;
  }>;
  shipment?: {
    courierName: string;
    trackingNumber: string;
    shippingStatus: string;
    expectedDeliveryDate: string | null;
  } | null;
}

export default function OrderConfirmation() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<OrderTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const merchantDetails = {
    accountHolder: "Durga Prasad Patro",
    accountNumber: "85650100011547",
    ifsc: "BARB0DBBERH",
    bankName: "Bank of Baroda",
    upiId: "7978560619@pthdfc",
  };

  const loadOrder = () => {
    if (!orderNumber) return;
    fetch(`/api/checkout/track/${orderNumber}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data) setOrder(data);
      })
      .catch(err => console.error("Error fetching confirmed order:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadOrder();
  }, [orderNumber]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied: ${text}`);
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !orderNumber) return;
    const file = e.target.files[0];

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("orderNumber", orderNumber);

    try {
      const res = await fetch("/api/checkout/upload-receipt", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        toast.success("Payment screenshot uploaded successfully!");
        loadOrder();
      } else {
        toast.error(data.message || "Failed to upload screenshot");
      }
    } catch (err) {
      toast.error("Network error uploading screenshot");
    } finally {
      setIsUploading(false);
    }
  };

  const totalRupees = order ? (order.totalInMinorUnits / 100).toFixed(0) : "0";
  const upiDeepLink = `upi://pay?pa=${merchantDetails.upiId}&pn=${encodeURIComponent(merchantDetails.accountHolder)}&am=${totalRupees}&cu=INR&tn=FlavoursOfIndia`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiDeepLink)}`;

  return (
    <div className="store-page">
      <header className="sub-header container">
        <Link href="/" className="back-link">
          <ArrowLeft size={16} /> Return to storefront
        </Link>
        <span className="eyebrow" style={{ margin: 0 }}>
          Order Confirmed
        </span>
      </header>

      <main className="container" style={{ maxWidth: "700px", padding: "48px 20px" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)" }}>
            Retrieving your order details...
          </div>
        ) : !order ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <h2>Order record not found</h2>
            <p style={{ color: "var(--secondary)", marginTop: "8px" }}>
              Please check your confirmation link.
            </p>
            <Link href="/" className="primary-button" style={{ marginTop: "16px", display: "inline-flex" }}>
              Back to Home
            </Link>
          </div>
        ) : (
          <div
            style={{
              background: "var(--raised)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "36px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  background: "rgba(75, 83, 32, 0.1)",
                  color: "var(--olive)",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 16px",
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <p className="eyebrow" style={{ margin: 0, color: "var(--olive)" }}>
                Order Received Successfully
              </p>
              <h1 style={{ font: "500 28px var(--font-serif)", margin: "6px 0 12px" }}>
                Thank you, {order.customerName.split(" ")[0]}!
              </h1>
              <p style={{ color: "var(--secondary)", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
                Your order is safely registered in our pantry fulfillment system.
              </p>
            </div>

            {/* Order Reference Box */}
            <div
              style={{
                background: "var(--sunken)",
                padding: "16px 20px",
                borderRadius: "6px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <div>
                <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>
                  Order Number
                </span>
                <div style={{ font: "600 18px var(--font-serif)", color: "var(--ink)", marginTop: "2px" }}>
                  {order.orderNumber}
                </div>
              </div>
              <button
                onClick={() => handleCopy(order.orderNumber, "Order Number")}
                className="quiet-button"
                style={{ fontSize: "12px", padding: "6px 12px", background: "#fff" }}
              >
                <Copy size={13} /> Copy Ref
              </button>
            </div>

            {/* Manual UPI & Bank Details Box */}
            {order.paymentMethod === "manual_upi" && (
              <div
                style={{
                  border: "1px solid var(--gold)",
                  background: "rgba(217, 142, 59, 0.05)",
                  borderRadius: "8px",
                  padding: "20px",
                  marginBottom: "24px",
                  fontSize: "13px",
                  lineHeight: "1.6",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "16px", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <strong style={{ display: "block", color: "var(--ink)", fontSize: "15px", marginBottom: "4px" }}>
                      UPI / QR Payment Instructions
                    </strong>
                    <p style={{ margin: "0 0 10px", color: "var(--secondary)", fontSize: "12px" }}>
                      Please pay <strong>₹{totalRupees}</strong> to our verified merchant account:
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--border)", marginBottom: "8px" }}>
                      <code style={{ fontSize: "13px", fontWeight: 700 }}>{merchantDetails.upiId}</code>
                      <button onClick={() => handleCopy(merchantDetails.upiId, "UPI ID")} className="quiet-button" style={{ fontSize: "11px", padding: "3px 8px" }}>
                        <Copy size={12} /> Copy
                      </button>
                    </div>
                  </div>

                  <div style={{ textAlign: "center", background: "#fff", padding: "8px", borderRadius: "6px", border: "1px solid var(--border)" }}>
                    <img src={qrCodeUrl} alt="UPI QR Code" style={{ width: "110px", height: "110px", display: "block" }} />
                    <small style={{ fontSize: "9px", color: "var(--muted)", display: "block", marginTop: "2px" }}>Scan to Pay</small>
                  </div>
                </div>

                {/* Bank Account Info */}
                <div style={{ background: "#fff", padding: "12px", borderRadius: "6px", border: "1px solid var(--border)", marginBottom: "16px", fontSize: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "var(--terracotta)", marginBottom: "6px" }}>
                    <Building2 size={13} /> Direct Bank Transfer (NEFT / IMPS)
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                    <div>Account Name: <strong>{merchantDetails.accountHolder}</strong></div>
                    <div>Bank: <strong>{merchantDetails.bankName}</strong></div>
                    <div>A/C No: <code>{merchantDetails.accountNumber}</code></div>
                    <div>IFSC: <code>{merchantDetails.ifsc}</code></div>
                  </div>
                </div>

                {/* Screenshot Upload Box */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleReceiptUpload}
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                  />

                  {order.payment?.screenshotUrl ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#DCFCE7", border: "1px solid #86EFAC", padding: "10px 14px", borderRadius: "6px" }}>
                      <CheckCircle2 size={16} color="#166534" />
                      <div style={{ flex: 1, fontSize: "12px", color: "#166534" }}>
                        <strong>Payment Screenshot Attached!</strong> Under admin review.
                      </div>
                      <a href={order.payment.screenshotUrl} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "#166534", textDecoration: "underline", display: "flex", alignItems: "center", gap: "4px" }}>
                        View <ExternalLink size={11} />
                      </a>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="quiet-button"
                      style={{ width: "100%", padding: "10px", background: "#fff", display: "flex", justifyContent: "center", gap: "8px", fontSize: "13px" }}
                    >
                      <Upload size={15} /> {isUploading ? "Uploading Screenshot..." : "Attach Payment Screenshot (PNG, JPEG)"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* COD Instructions */}
            {order.paymentMethod === "cod" && (
              <div
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--sunken)",
                  borderRadius: "6px",
                  padding: "16px",
                  marginBottom: "24px",
                  fontSize: "13px",
                  lineHeight: "1.6",
                }}
              >
                <strong style={{ display: "block", color: "var(--terracotta)", marginBottom: "4px" }}>
                  Cash on Delivery Verification
                </strong>
                <p style={{ margin: 0, color: "var(--secondary)" }}>
                  Our team will verify your contact details before packing. Please keep <strong>₹{totalRupees}</strong> in cash ready upon delivery to {order.shippingCity}.
                </p>
              </div>
            )}

            {/* Items Ordered Breakdown */}
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ font: "600 13px var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "12px" }}>
                Selected Snacks
              </h3>
              <div style={{ borderTop: "1px solid var(--border)" }}>
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "12px 0",
                      borderBottom: "1px solid var(--border)",
                      fontSize: "13px",
                    }}
                  >
                    <div>
                      <strong>{item.title}</strong>
                      <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                        {item.packSize || "Standard Pack"} × {item.quantity}
                      </div>
                    </div>
                    <strong>₹{(item.subtotalInMinorUnits / 100).toFixed(0)}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Total and Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "12px",
                borderTop: "2px solid var(--border)",
                marginBottom: "24px",
              }}
            >
              <span style={{ fontWeight: 600 }}>Total Paid / Payable</span>
              <strong style={{ font: "600 20px var(--font-serif)", color: "var(--terracotta)" }}>
                ₹{totalRupees}
              </strong>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Link href={`/track-order?ref=${order.orderNumber}`} className="primary-button" style={{ textAlign: "center", justifyContent: "center" }}>
                <Truck size={16} /> Track Order Live
              </Link>
              <Link href="/collection" className="quiet-button" style={{ textAlign: "center", justifyContent: "center", background: "var(--sunken)" }}>
                Explore More Snacks <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

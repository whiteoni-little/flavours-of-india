import { useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  Building2,
  CheckCircle2,
  Copy,
  Image as ImageIcon,
  QrCode,
  ShieldCheck,
  Truck,
  Upload,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const [, setLocation] = useLocation();
  const { items, subtotalInMinorUnits, clearCart } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingAddressLine1, setShippingAddressLine1] = useState("");
  const [shippingAddressLine2, setShippingAddressLine2] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingPincode, setShippingPincode] = useState("");
  const [shippingLandmark, setShippingLandmark] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "manual_upi" | "gateway">("manual_upi");
  const [upiReference, setUpiReference] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [customerNotes, setCustomerNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const shippingFeeInMinorUnits = subtotalInMinorUnits >= 49900 ? 0 : 5000;
  const totalInMinorUnits = subtotalInMinorUnits + shippingFeeInMinorUnits;
  const totalInRupees = (totalInMinorUnits / 100).toFixed(0);

  const merchantDetails = {
    accountHolder: "Durga Prasad Patro",
    accountNumber: "85650100011547",
    ifsc: "BARB0DBBERH",
    bankName: "Bank of Baroda",
    upiId: "7978560619@pthdfc",
  };

  const upiDeepLink = `upi://pay?pa=${merchantDetails.upiId}&pn=${encodeURIComponent(merchantDetails.accountHolder)}&am=${totalInRupees}&cu=INR&tn=FlavoursOfIndia`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiDeepLink)}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied: ${text}`);
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setIsUploadingReceipt(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/checkout/upload-receipt", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setScreenshotUrl(data.url);
        toast.success("Payment screenshot uploaded successfully!");
      } else {
        toast.error(data.message || "Failed to upload screenshot");
      }
    } catch (err) {
      toast.error("Network error uploading screenshot");
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim() || !shippingAddressLine1.trim() || !shippingCity.trim() || !shippingState.trim() || !shippingPincode.trim()) {
      toast.error("Please fill in all required delivery address fields");
      return;
    }

    if (customerPhone.trim().length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    if (shippingPincode.trim().length < 6) {
      toast.error("Please enter a valid 6-digit PIN code");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || null,
        shippingAddressLine1: shippingAddressLine1.trim(),
        shippingAddressLine2: shippingAddressLine2.trim() || null,
        shippingCity: shippingCity.trim(),
        shippingState: shippingState.trim(),
        shippingPincode: shippingPincode.trim(),
        shippingLandmark: shippingLandmark.trim() || null,
        paymentMethod,
        upiReference: paymentMethod === "manual_upi" ? upiReference.trim() || null : null,
        screenshotUrl: paymentMethod === "manual_upi" ? screenshotUrl || null : null,
        customerNotes: customerNotes.trim() || null,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Order placed successfully: ${data.orderNumber}`);
        if (clearCart) await clearCart();
        onClose();
        setLocation(`/order-confirmation/${data.orderNumber}`);
      } else {
        toast.error(data.message || "Failed to place order");
      }
    } catch (err) {
      console.error("Checkout submission error:", err);
      toast.error("Network error while submitting order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(32, 27, 22, 0.7)",
        backdropFilter: "blur(4px)",
        display: "grid",
        placeItems: "center",
        zIndex: 200,
        padding: "16px",
      }}
    >
      <div
        className="modal-card"
        style={{
          background: "var(--ivory)",
          borderRadius: "8px",
          maxWidth: "680px",
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "var(--shadow-lg)",
          padding: "32px",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <span className="eyebrow" style={{ margin: 0 }}>Secure Pantry Checkout</span>
            <h2 style={{ font: "500 24px var(--font-serif)", margin: "4px 0 0" }}>Complete Your Order</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: 0,
              cursor: "pointer",
              color: "var(--muted)",
              padding: "4px",
            }}
            aria-label="Close checkout"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmitOrder}>
          {/* Section 1: Customer Contact */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ font: "600 14px var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--terracotta)", marginBottom: "12px" }}>
              1. Customer Information
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>10-Digit Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px" }}
                />
              </div>
            </div>
            <div style={{ marginTop: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Email Address (For receipt)</label>
              <input
                type="email"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                placeholder="e.g. priya@example.com"
                style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px" }}
              />
            </div>
          </div>

          {/* Section 2: Delivery Address */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ font: "600 14px var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--terracotta)", marginBottom: "12px" }}>
              2. Shipping Address
            </h3>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Flat / House No., Street Address *</label>
              <input
                type="text"
                required
                value={shippingAddressLine1}
                onChange={e => setShippingAddressLine1(e.target.value)}
                placeholder="e.g. Flat 402, Lotus Residency, MG Road"
                style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px" }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Landmark (Optional)</label>
                <input
                  type="text"
                  value={shippingLandmark}
                  onChange={e => setShippingLandmark(e.target.value)}
                  placeholder="e.g. Near City Center Mall"
                  style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>PIN Code *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={shippingPincode}
                  onChange={e => setShippingPincode(e.target.value)}
                  placeholder="e.g. 751024"
                  style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px" }}
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>City *</label>
                <input
                  type="text"
                  required
                  value={shippingCity}
                  onChange={e => setShippingCity(e.target.value)}
                  placeholder="e.g. Berhampur / Bhubaneswar"
                  style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>State *</label>
                <input
                  type="text"
                  required
                  value={shippingState}
                  onChange={e => setShippingState(e.target.value)}
                  placeholder="e.g. Odisha"
                  style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px" }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Payment Method */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ font: "600 14px var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--terracotta)", marginBottom: "12px" }}>
              3. Payment Method
            </h3>

            <div style={{ display: "grid", gap: "10px" }}>
              {/* Manual UPI / QR Option (Recommended) */}
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "14px",
                  border: paymentMethod === "manual_upi" ? "2px solid var(--gold)" : "1px solid var(--border)",
                  borderRadius: "6px",
                  background: paymentMethod === "manual_upi" ? "rgba(217, 142, 59, 0.05)" : "var(--raised)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="manual_upi"
                  checked={paymentMethod === "manual_upi"}
                  onChange={() => setPaymentMethod("manual_upi")}
                  style={{ marginTop: "3px" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <QrCode size={16} color="var(--gold)" />
                    <strong style={{ fontSize: "14px", color: "var(--ink)" }}>Direct UPI / QR Code & Bank Transfer</strong>
                    <span className="status-badge" style={{ background: "#DCFCE7", color: "#166534", fontSize: "10px" }}>Instant Confirmation</span>
                  </div>
                  <small style={{ color: "var(--secondary)", display: "block", marginTop: "2px", lineHeight: "1.4" }}>
                    Scan QR code via Google Pay, PhonePe, Paytm, or transfer to official Bank of Baroda account.
                  </small>
                </div>
              </label>

              {/* COD Option */}
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "14px",
                  border: paymentMethod === "cod" ? "2px solid var(--olive)" : "1px solid var(--border)",
                  borderRadius: "6px",
                  background: paymentMethod === "cod" ? "rgba(75, 83, 32, 0.04)" : "var(--raised)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  style={{ marginTop: "3px" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Banknote size={16} color="var(--olive)" />
                    <strong style={{ fontSize: "14px", color: "var(--ink)" }}>Cash on Delivery (COD)</strong>
                  </div>
                  <small style={{ color: "var(--secondary)", display: "block", marginTop: "2px", lineHeight: "1.4" }}>
                    Pay upon delivery. Operations team will call/message to confirm before dispatch.
                  </small>
                </div>
              </label>
            </div>

            {/* UPI QR & Bank Details Box */}
            {paymentMethod === "manual_upi" && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "20px",
                  background: "var(--sunken)",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "20px", alignItems: "center", marginBottom: "20px" }}>
                  <div>
                    <h4 style={{ font: "600 15px var(--font-serif)", margin: "0 0 8px", color: "var(--ink)" }}>
                      Scan QR Code to Pay ₹{totalInRupees}
                    </h4>
                    <p style={{ fontSize: "12px", color: "var(--secondary)", margin: "0 0 12px", lineHeight: "1.5" }}>
                      Open any UPI App (GPay, PhonePe, Paytm, BHIM) and scan the QR code to complete payment.
                    </p>

                    <div style={{ background: "#fff", padding: "10px 14px", borderRadius: "6px", border: "1px solid var(--border)", marginBottom: "8px" }}>
                      <div style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600 }}>UPI VPA ID</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px" }}>
                        <code style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>{merchantDetails.upiId}</code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(merchantDetails.upiId, "UPI ID")}
                          className="quiet-button"
                          style={{ fontSize: "11px", padding: "4px 8px" }}
                        >
                          <Copy size={12} /> Copy
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "center", background: "#fff", padding: "10px", borderRadius: "6px", border: "1px solid var(--border)" }}>
                    <img
                      src={qrCodeUrl}
                      alt="UPI Payment QR Code"
                      style={{ width: "130px", height: "130px", display: "block" }}
                    />
                    <small style={{ fontSize: "10px", color: "var(--muted)", marginTop: "4px", display: "block" }}>
                      Scan via any UPI App
                    </small>
                  </div>
                </div>

                {/* Bank Account Details Table */}
                <div style={{ background: "#fff", padding: "14px", borderRadius: "6px", border: "1px solid var(--border)", marginBottom: "16px", fontSize: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "var(--terracotta)", marginBottom: "8px" }}>
                    <Building2 size={14} /> Official Merchant Bank Account
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div>
                      <span style={{ color: "var(--muted)", display: "block" }}>Account Holder</span>
                      <strong>{merchantDetails.accountHolder}</strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--muted)", display: "block" }}>Bank & Branch</span>
                      <strong>{merchantDetails.bankName}, Berhampur</strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--muted)", display: "block" }}>Account Number</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <code style={{ fontWeight: 600 }}>{merchantDetails.accountNumber}</code>
                        <button type="button" onClick={() => copyToClipboard(merchantDetails.accountNumber, "Account Number")} style={{ background: "none", border: 0, cursor: "pointer", padding: 0 }} title="Copy Account Number">
                          <Copy size={12} color="var(--muted)" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <span style={{ color: "var(--muted)", display: "block" }}>IFSC Code</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <code style={{ fontWeight: 600 }}>{merchantDetails.ifsc}</code>
                        <button type="button" onClick={() => copyToClipboard(merchantDetails.ifsc, "IFSC Code")} style={{ background: "none", border: 0, cursor: "pointer", padding: 0 }} title="Copy IFSC">
                          <Copy size={12} color="var(--muted)" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 12-digit UTR Input */}
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>
                    12-digit UPI Reference (UTR) Number
                  </label>
                  <input
                    type="text"
                    value={upiReference}
                    onChange={e => setUpiReference(e.target.value)}
                    placeholder="e.g. 423891002341 (found in UPI app transaction receipt)"
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid var(--border)",
                      borderRadius: "4px",
                      fontSize: "13px",
                      fontFamily: "monospace",
                    }}
                  />
                </div>

                {/* Payment Screenshot Upload */}
                <div style={{ marginBottom: "10px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>
                    Upload Payment Screenshot / Receipt (Recommended)
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleReceiptUpload}
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                  />

                  {screenshotUrl ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#DCFCE7", border: "1px solid #86EFAC", padding: "10px 14px", borderRadius: "6px" }}>
                      <CheckCircle2 size={18} color="#166534" />
                      <div style={{ flex: 1, fontSize: "12px", color: "#166534" }}>
                        <strong>Screenshot Attached!</strong> Ready for instant admin verification.
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="quiet-button"
                        style={{ fontSize: "11px", padding: "4px 8px", background: "#fff" }}
                      >
                        Change Image
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingReceipt}
                      className="quiet-button"
                      style={{ width: "100%", padding: "10px", background: "#fff", display: "flex", justifyContent: "center", gap: "8px", fontSize: "13px" }}
                    >
                      <Upload size={16} /> {isUploadingReceipt ? "Uploading Screenshot..." : "Attach Payment Screenshot (PNG, JPEG)"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Cost Breakdown */}
          <div
            style={{
              background: "var(--sunken)",
              padding: "16px",
              borderRadius: "6px",
              marginBottom: "24px",
              fontSize: "13px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span>Items Subtotal ({items.length} snacks):</span>
              <strong>₹{(subtotalInMinorUnits / 100).toFixed(0)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span>Shipping Fee:</span>
              <span>{shippingFeeInMinorUnits === 0 ? "FREE (Orders ₹499+)" : "₹50"}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "16px",
                fontWeight: 700,
                borderTop: "1px solid var(--border)",
                paddingTop: "10px",
                marginTop: "6px",
              }}
            >
              <span>Total Payable</span>
              <span style={{ color: "var(--terracotta)" }}>₹{totalInRupees}</span>
            </div>
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={isSubmitting}
            style={{ width: "100%", padding: "14px", fontSize: "15px" }}
          >
            {isSubmitting ? "Placing Order..." : `Place Order — ₹${totalInRupees}`} <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

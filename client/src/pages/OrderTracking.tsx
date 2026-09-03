import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Package,
  RotateCcw,
  Search,
  Truck,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

interface OrderTrackingData {
  orderNumber: string;
  customerName: string;
  shippingCity: string;
  shippingState: string;
  totalInMinorUnits: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
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
    shippingDate: string;
    expectedDeliveryDate: string | null;
    deliveredAt: string | null;
  } | null;
}

export default function OrderTracking() {
  const [searchRef, setSearchRef] = useState("");
  const [order, setOrder] = useState<OrderTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setSearchRef(ref);
      fetchOrder(ref);
    }
  }, []);

  const fetchOrder = async (ref: string) => {
    if (!ref.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/checkout/track/${encodeURIComponent(ref.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        setOrder(null);
        toast.error("No active order found for this reference");
      }
    } catch (err) {
      toast.error("Failed to check tracking status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(searchRef);
  };

  const getStepIndex = (status: string) => {
    if (status === "placed" || status === "cod_confirmation_pending") return 1;
    if (status === "confirmed") return 2;
    if (status === "packing" || status === "packed") return 3;
    if (status === "shipped" || status === "out_for_delivery") return 4;
    if (status === "delivered") return 5;
    return 1;
  };

  const currentStep = order ? getStepIndex(order.orderStatus) : 0;

  return (
    <div className="store-page">
      <header className="sub-header container">
        <Link href="/" className="back-link">
          <ArrowLeft size={16} /> Back to storefront
        </Link>
        <span className="eyebrow" style={{ margin: 0 }}>
          Live Tracking
        </span>
      </header>

      <main className="container" style={{ maxWidth: "700px", padding: "48px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <p className="eyebrow">Real-Time Pantry Dispatch</p>
          <h1 style={{ font: "500 32px var(--font-serif)", margin: "4px 0 12px" }}>Track Your Order</h1>
          <p style={{ color: "var(--secondary)", fontSize: "14px" }}>
            Enter your order reference (e.g. <code>FOI-2026-10042</code>) to check packing and delivery progress.
          </p>
        </div>

        <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", marginBottom: "36px" }}>
          <input
            type="text"
            required
            value={searchRef}
            onChange={e => setSearchRef(e.target.value)}
            placeholder="Enter Order Reference (FOI-2026-XXXXX)"
            style={{
              flex: 1,
              padding: "12px 16px",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              fontSize: "14px",
              fontFamily: "var(--font-sans)",
            }}
          />
          <button type="submit" className="primary-button" disabled={isLoading} style={{ padding: "12px 24px" }}>
            <Search size={16} /> {isLoading ? "Checking..." : "Track"}
          </button>
        </form>

        {hasSearched && !order && !isLoading && (
          <div style={{ textAlign: "center", padding: "32px", background: "var(--sunken)", borderRadius: "8px" }}>
            <Package size={32} strokeWidth={1.5} style={{ margin: "0 auto 8px", color: "var(--muted)" }} />
            <p style={{ margin: 0, color: "var(--secondary)", fontSize: "14px" }}>
              No order found matching "<strong>{searchRef}</strong>". Please verify your order number.
            </p>
          </div>
        )}

        {order && (
          <div
            style={{
              background: "var(--raised)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "32px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
              <div>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--muted)" }}>Tracking Details</span>
                <h2 style={{ font: "600 22px var(--font-serif)", margin: "2px 0 0" }}>{order.orderNumber}</h2>
              </div>
              <span className="status-badge" style={{ textTransform: "capitalize" }}>
                {order.orderStatus.replace(/_/g, " ")}
              </span>
            </div>

            {/* Stepper */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", marginBottom: "32px", textAlign: "center" }}>
              {[
                { step: 1, label: "Placed" },
                { step: 2, label: "Confirmed" },
                { step: 3, label: "Packed" },
                { step: 4, label: "In Transit" },
                { step: 5, label: "Delivered" },
              ].map(s => {
                const isComplete = currentStep >= s.step;
                return (
                  <div key={s.step}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: isComplete ? "var(--olive)" : "var(--sunken)",
                        color: isComplete ? "#fff" : "var(--muted)",
                        display: "grid",
                        placeItems: "center",
                        margin: "0 auto 6px",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      {isComplete ? <CheckCircle2 size={16} /> : s.step}
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: isComplete ? 600 : 400, color: isComplete ? "var(--ink)" : "var(--muted)" }}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Courier Tracking Box */}
            {order.shipment && (
              <div
                style={{
                  background: "var(--sunken)",
                  padding: "16px 20px",
                  borderRadius: "6px",
                  marginBottom: "24px",
                  fontSize: "13px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span>Courier Partner:</span>
                  <strong>{order.shipment.courierName}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span>AWB Tracking Number:</span>
                  <code style={{ fontWeight: 600, color: "var(--terracotta)" }}>{order.shipment.trackingNumber}</code>
                </div>
                {order.shipment.expectedDeliveryDate && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Estimated Arrival:</span>
                    <strong>{order.shipment.expectedDeliveryDate}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Items in order */}
            <div>
              <h3 style={{ font: "600 13px var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "12px" }}>
                Items ({order.items.length})
              </h3>
              <div style={{ borderTop: "1px solid var(--border)" }}>
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom: "1px solid var(--border)",
                      fontSize: "13px",
                    }}
                  >
                    <span>{item.title} ({item.packSize || "Standard"}) × {item.quantity}</span>
                    <strong>₹{(item.subtotalInMinorUnits / 100).toFixed(0)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

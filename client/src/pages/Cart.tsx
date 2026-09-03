import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { Link } from "wouter";
import CheckoutModal from "@/components/CheckoutModal";
import SiteFooter from "@/components/SiteFooter";
import { useCart } from "@/contexts/CartContext";

const defaultImg = "/manus-storage/product-pickle_c9669039.jpg";

export default function Cart() {
  const {
    items,
    totalCount,
    subtotalInMinorUnits,
    updateQuantity,
    removeItem,
    isLoading,
  } = useCart();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const formattedSubtotal = `₹${(subtotalInMinorUnits / 100).toFixed(0)}`;
  const shippingFee = subtotalInMinorUnits >= 49900 || items.length === 0 ? 0 : 50;
  const formattedShipping = shippingFee === 0 ? "FREE" : "₹50";
  const totalAmount = (subtotalInMinorUnits / 100) + shippingFee;

  return (
    <div className="store-page">
      <header className="sub-header container">
        <Link href="/collection" className="back-link">
          <ArrowLeft size={16} /> Continue browsing
        </Link>
        <span className="eyebrow" style={{ margin: 0 }}>
          Your bag ({totalCount})
        </span>
      </header>

      <main className="container cart-main">
        {isLoading ? (
          <div
            style={{
              padding: "96px 0",
              color: "var(--muted)",
              textAlign: "center",
            }}
          >
            Loading your bag...
          </div>
        ) : items.length === 0 ? (
          <div className="empty-cart">
            <ShoppingBag size={28} strokeWidth={1.2} />
            <p className="eyebrow">A quiet little bag</p>
            <h1>
              Nothing in here
              <br />
              <em>just yet.</em>
            </h1>
            <p>
              Your cart is ready when you are. Browse the collection and find
              something worth sharing.
            </p>
            <Link href="/collection" className="primary-button">
              Explore the collection <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div>
            <p className="eyebrow" style={{ marginBottom: "16px" }}>
              Selected Pantry Favourites
            </p>
            <div style={{ borderTop: "1px solid var(--border)" }}>
              {items.map(item => {
                const img = item.product?.primaryImage || defaultImg;
                const unitPrice =
                  item.product?.priceInMinorUnits ||
                  item.unitPriceInMinorUnits ||
                  0;
                const itemTotal = (unitPrice * item.quantity) / 100;

                return (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "24px",
                      padding: "24px 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <img
                      src={img}
                      alt={item.product?.title || "Item"}
                      style={{
                        width: "80px",
                        height: "80px",
                        objectFit: "cover",
                        background: "var(--sunken)",
                        flexShrink: 0,
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: "11px",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          color: "var(--muted)",
                        }}
                      >
                        {item.product?.category || "Snack"}
                      </span>
                      <h3
                        style={{
                          font: "500 18px var(--font-serif)",
                          margin: "2px 0 6px",
                        }}
                      >
                        {item.product?.title || "Product"}
                      </h3>
                      <div
                        style={{
                          color: "var(--gold)",
                          fontWeight: 600,
                          fontSize: "14px",
                        }}
                      >
                        ₹{(unitPrice / 100).toFixed(0)} each
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        style={{
                          width: "32px",
                          height: "32px",
                          border: "1px solid var(--border)",
                          background: "var(--raised)",
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                        }}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span
                        style={{
                          minWidth: "24px",
                          textAlign: "center",
                          fontWeight: 600,
                          fontSize: "14px",
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        style={{
                          width: "32px",
                          height: "32px",
                          border: "1px solid var(--border)",
                          background: "var(--raised)",
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                        }}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div
                      style={{
                        minWidth: "70px",
                        textAlign: "right",
                        fontWeight: 600,
                        color: "var(--ink)",
                        fontSize: "16px",
                      }}
                    >
                      ₹{itemTotal.toFixed(0)}
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      style={{
                        background: "none",
                        border: 0,
                        color: "var(--muted)",
                        cursor: "pointer",
                        padding: "8px",
                      }}
                      title="Remove item"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <aside className="order-summary">
          <p className="eyebrow">Order summary</p>
          <h2>{items.length === 0 ? "₹ —" : formattedSubtotal}</h2>

          <div>
            <span>Items ({totalCount})</span>
            <span>{items.length === 0 ? "₹ 0" : formattedSubtotal}</span>
          </div>

          <div>
            <span>Shipping</span>
            <span>{items.length === 0 ? "—" : formattedShipping}</span>
          </div>

          <div
            style={{
              fontWeight: 600,
              color: "var(--ink)",
              borderTop: "2px solid var(--border)",
              paddingTop: "16px",
            }}
          >
            <span>Estimated Total</span>
            <span style={{ color: "var(--terracotta)" }}>
              {items.length === 0 ? "₹ 0" : `₹${totalAmount.toFixed(0)}`}
            </span>
          </div>

          <button
            className="primary-button"
            disabled={items.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
            style={{
              width: "100%",
              marginTop: "24px",
              cursor: items.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            Proceed to Checkout <ArrowRight size={18} />
          </button>

          <div
            style={{
              marginTop: "20px",
              padding: "14px",
              background: "var(--sunken)",
              borderRadius: "6px",
              fontSize: "12px",
              color: "var(--secondary)",
              lineHeight: "1.6",
            }}
          >
            🛡️ <strong>Store Assured:</strong> 3-Day Return window &amp; 7-Day Refund. Dispatched directly from Ganjam, Odisha.
          </div>
        </aside>
      </main>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      <SiteFooter />
    </div>
  );
}

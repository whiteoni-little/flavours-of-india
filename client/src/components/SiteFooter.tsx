import React from "react";
import { ArrowRight, Heart, MapPin, ShieldCheck, Truck } from "lucide-react";
import { Link } from "wouter";

const logo = "/manus-storage/flavours-of-india-logo_4e9a9073.png";

export default function SiteFooter() {
  return (
    <footer
      style={{
        background: "#1E1A16",
        color: "#E8E2D9",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        paddingTop: "64px",
        paddingBottom: "36px",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div className="container">
        {/* Top Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "40px",
            marginBottom: "56px",
          }}
        >
          {/* Column 1: Brand & Origin */}
          <div>
            <Link href="/" style={{ display: "inline-block", marginBottom: "16px" }}>
              <img
                src={logo}
                alt="Flavours of India"
                style={{
                  height: "44px",
                  filter: "brightness(0) invert(1)",
                  opacity: 0.9,
                }}
              />
            </Link>
            <p
              style={{
                fontSize: "14px",
                lineHeight: "1.7",
                color: "#B8B0A4",
                marginBottom: "20px",
                maxWidth: "280px",
              }}
            >
              Small-batch regional snacks, sun-cured pickles, and authentic pantry treasures crafted with love in Odisha.
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                fontSize: "13px",
                color: "#D8D0C4",
                background: "rgba(255,255,255,0.04)",
                padding: "12px 14px",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <MapPin size={18} style={{ color: "#E07A5F", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong style={{ display: "block", color: "#FFF", marginBottom: "2px" }}>
                  Store Location
                </strong>
                <span>Berhampur, Ganjam, Odisha - 760001, India</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "17px",
                fontWeight: 600,
                color: "#FFF",
                marginBottom: "18px",
                letterSpacing: "0.02em",
              }}
            >
              Explore Pantry
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              <li>
                <Link href="/collection" style={{ color: "#B8B0A4", fontSize: "14px", textDecoration: "none", transition: "color 0.2s" }}>
                  The Collection
                </Link>
              </li>
              <li>
                <Link href="/blog" style={{ color: "#B8B0A4", fontSize: "14px", textDecoration: "none", transition: "color 0.2s" }}>
                  Pantry Journal & Stories
                </Link>
              </li>
              <li>
                <Link href="/track-order" style={{ color: "#B8B0A4", fontSize: "14px", textDecoration: "none", transition: "color 0.2s" }}>
                  Track Order / Manifest
                </Link>
              </li>
              <li>
                <a href="/#story" style={{ color: "#B8B0A4", fontSize: "14px", textDecoration: "none", transition: "color 0.2s" }}>
                  Our Sourcing Heritage
                </a>
              </li>
              <li>
                <Link href="/admin/login" style={{ color: "#8E867B", fontSize: "13px", textDecoration: "none" }}>
                  Admin Portal ↗
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Store & Customer Policies */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "17px",
                fontWeight: 600,
                color: "#FFF",
                marginBottom: "18px",
                letterSpacing: "0.02em",
              }}
            >
              Customer Policies
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              <li>
                <Link href="/return-policy" style={{ color: "#B8B0A4", fontSize: "14px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <ShieldCheck size={14} style={{ color: "#E07A5F" }} />
                  Return, Refund & Cancellation Policy
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" style={{ color: "#B8B0A4", fontSize: "14px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Truck size={14} style={{ color: "#E07A5F" }} />
                  Shipping & Delivery Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" style={{ color: "#B8B0A4", fontSize: "14px", textDecoration: "none" }}>
                  Privacy & Data Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" style={{ color: "#B8B0A4", fontSize: "14px", textDecoration: "none" }}>
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Quality & Video Policy Notice */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "17px",
                fontWeight: 600,
                color: "#FFF",
                marginBottom: "18px",
                letterSpacing: "0.02em",
              }}
            >
              Quality Commitment
            </h4>
            <div
              style={{
                background: "rgba(224, 122, 95, 0.08)",
                border: "1px solid rgba(224, 122, 95, 0.2)",
                padding: "16px",
                borderRadius: "6px",
                fontSize: "13px",
                color: "#E2DAD0",
                lineHeight: "1.6",
              }}
            >
              <strong style={{ color: "#FFA487", display: "block", marginBottom: "6px" }}>
                🎥 Mandatory Unboxing Video
              </strong>
              For genuine damaged or missing item claims, a continuous video recording while opening the sealed outer parcel is mandatory within 3 days of delivery.
            </div>
            <p style={{ fontSize: "12px", color: "#8E867B", marginTop: "12px", margin: "12px 0 0" }}>
              Compliant with FSSAI standards and food hygiene regulations.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: "24px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            fontSize: "13px",
            color: "#8E867B",
          }}
        >
          <div>
            © 2026 Flavours of India. All rights reserved. Handcrafted & shipped from <strong>Ganjam, Odisha</strong>.
          </div>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <Link href="/return-policy" style={{ color: "#8E867B", textDecoration: "none" }}>
              3-Day Return Policy
            </Link>
            <Link href="/shipping-policy" style={{ color: "#8E867B", textDecoration: "none" }}>
              Pan-India Shipping
            </Link>
            <Link href="/privacy-policy" style={{ color: "#8E867B", textDecoration: "none" }}>
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

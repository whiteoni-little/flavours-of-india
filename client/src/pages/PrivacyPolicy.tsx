import React from "react";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function PrivacyPolicy() {
  return (
    <div className="site-shell">
      <SiteHeader announcement="We Respect & Protect Your Personal Privacy • Flavours of India" />

      <main style={{ padding: "48px 0 80px", background: "var(--ivory)", minHeight: "80vh" }}>
        <div className="container" style={{ maxWidth: "860px" }}>
          <div style={{ marginBottom: "32px" }}>
            <Link href="/" className="text-link" style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
              <ArrowLeft size={16} /> Back to Storefront
            </Link>
            <p className="eyebrow">Data Protection & Privacy</p>
            <h1 style={{ font: "600 38px/1.15 var(--font-serif)", color: "var(--ink)", margin: "0 0 16px" }}>
              Privacy Policy
            </h1>
            <p style={{ color: "var(--secondary)", fontSize: "15px", lineHeight: "1.7" }}>
              Effective Date: September 2026 • Flavours of India (Ganjam, Odisha)
            </p>
          </div>

          <div
            style={{
              background: "var(--raised)",
              border: "1px solid var(--border)",
              padding: "36px",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "28px",
            }}
          >
            <section>
              <h2 style={{ font: "600 20px var(--font-serif)", color: "var(--ink)", margin: "0 0 10px" }}>
                1. Information We Collect
              </h2>
              <p style={{ fontSize: "14px", lineHeight: "1.7", color: "var(--secondary)", margin: 0 }}>
                When you place an order or interact with Flavours of India, we collect necessary customer details such as your full name, delivery address within India, telephone/mobile number for courier dispatch notifications, email address, and order transaction details.
              </p>
            </section>

            <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: 0 }} />

            <section>
              <h2 style={{ font: "600 20px var(--font-serif)", color: "var(--ink)", margin: "0 0 10px" }}>
                2. How We Use Your Information
              </h2>
              <ul style={{ paddingLeft: "20px", fontSize: "14px", color: "var(--secondary)", lineHeight: "1.7", margin: 0 }}>
                <li>To safely pack, manifest, and deliver your food parcels via registered Indian courier partners.</li>
                <li>To send automated SMS, WhatsApp, and email order confirmation and dispatch tracking links.</li>
                <li>To verify manual UPI and bank payment references and prevent fraudulent checkout attempts.</li>
                <li>To address customer support and return claims promptly.</li>
              </ul>
            </section>

            <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: 0 }} />

            <section>
              <h2 style={{ font: "600 20px var(--font-serif)", color: "var(--ink)", margin: "0 0 10px" }}>
                3. Payment Security &amp; Banking Privacy
              </h2>
              <p style={{ fontSize: "14px", lineHeight: "1.7", color: "var(--secondary)", margin: 0 }}>
                We do not store your confidential bank account passwords, UPI PINs, or debit/credit card CVVs on our servers. All UPI transactions occur through certified banking applications (such as Google Pay, PhonePe, Paytm, BHIM) and we verify only the public 12-digit UPI UTR reference number for bookkeeping.
              </p>
            </section>

            <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: 0 }} />

            <section>
              <h2 style={{ font: "600 20px var(--font-serif)", color: "var(--ink)", margin: "0 0 10px" }}>
                4. Third-Party Sharing
              </h2>
              <p style={{ fontSize: "14px", lineHeight: "1.7", color: "var(--secondary)", margin: 0 }}>
                We never sell, trade, or rent your personal information to third-party marketing companies. Your delivery address and phone number are shared solely with verified logistics partners (e.g., Delhivery, BlueDart, India Post) strictly for the purpose of fulfilling your order.
              </p>
            </section>

            <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: 0 }} />

            <section>
              <h2 style={{ font: "600 20px var(--font-serif)", color: "var(--ink)", margin: "0 0 10px" }}>
                5. Contacting Our Data Privacy Officer
              </h2>
              <p style={{ fontSize: "14px", lineHeight: "1.7", color: "var(--secondary)", margin: "0 0 8px" }}>
                For data access, update, or deletion inquiries:
              </p>
              <div style={{ background: "var(--sunken)", padding: "14px 18px", borderRadius: "6px", fontSize: "13px", color: "var(--ink)" }}>
                <strong>Flavours of India</strong><br />
                Address: Berhampur, Ganjam, Odisha - 760001, India<br />
                Email: <a href="mailto:durgapatro06@gmail.com" style={{ color: "var(--terracotta)" }}>durgapatro06@gmail.com</a>
              </div>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

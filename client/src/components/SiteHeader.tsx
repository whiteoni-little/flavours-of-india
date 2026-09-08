import React, { useState } from "react";
import { ArrowRight, BookOpen, Menu, Package, ShoppingBag, Sparkles, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/contexts/CartContext";

const logo = "/manus-storage/flavours-of-india-logo_4e9a9073.png";

interface SiteHeaderProps {
  announcement?: string;
}

export default function SiteHeader({
  announcement = "A little taste of home, a lot of happiness. Handcrafted in Ganjam, Odisha.",
}: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { totalCount } = useCart();

  return (
    <>
      <div className="announcement">
        <Sparkles size={13} /> {announcement}
      </div>
      <header className="site-header container">
        <Link href="/" className="brand-lockup">
          <img src={logo} className="brand-logo" alt="Flavours of India" />
          <span className="brand-tagline">Goodness from home</span>
        </Link>
        <nav className={open ? "main-nav is-open" : "main-nav"}>
          <Link
            href="/collection"
            className={location === "/collection" && (!window.location.search || window.location.search === "?category=all") ? "active" : ""}
            onClick={() => setOpen(false)}
          >
            The Collection
          </Link>
          <Link
            href="/collection?category=Pickles"
            className={location === "/collection" && window.location.search.includes("category=Pickles") ? "active" : ""}
            onClick={() => setOpen(false)}
          >
            Pickles
          </Link>
          <Link
            href="/collection?category=Papad"
            className={location === "/collection" && window.location.search.includes("category=Papad") ? "active" : ""}
            onClick={() => setOpen(false)}
          >
            Papad
          </Link>
          <Link
            href="/collection?category=Roasted%20snacks"
            className={location === "/collection" && (window.location.search.includes("category=Roasted") || window.location.search.includes("category=Roasted%20snacks")) ? "active" : ""}
            onClick={() => setOpen(false)}
          >
            Roasted Snacks
          </Link>
          <Link
            href="/collection?category=Sweet%20things"
            className={location === "/collection" && (window.location.search.includes("category=Sweet") || window.location.search.includes("category=Sweet%20things")) ? "active" : ""}
            onClick={() => setOpen(false)}
          >
            Sweet Things
          </Link>
          <Link
            href="/track-order"
            className={location === "/track-order" ? "active" : ""}
            onClick={() => setOpen(false)}
          >
            Track Order
          </Link>
        </nav>
        <div className="header-actions">
          <Link href="/cart" className="icon-button" aria-label="Shopping bag">
            <ShoppingBag size={20} strokeWidth={1.6} />
            <span className="bag-count">{totalCount}</span>
          </Link>
          <button
            className="menu-button"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>
    </>
  );
}

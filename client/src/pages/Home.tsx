import { useEffect, useState } from "react";
import { ArrowRight, Menu, ShoppingBag, Sparkles, X } from "lucide-react";
import { Link } from "wouter";
import { useCart } from "@/contexts/CartContext";

import SiteFooter from "@/components/SiteFooter";

const logo = "/manus-storage/flavours-of-india-logo_4e9a9073.png";
const heroImages = [
  "/manus-storage/hero-pantry_47065533.jpg",
  "/manus-storage/product-roasted_1a2dd2a6.jpg",
  "/manus-storage/product-papad_ca672ac8.jpg",
];
const categories = ["Pickles", "Papad", "Roasted snacks", "Sweet things"];
const toneList = ["red", "olive", "gold"];

export default function Home() {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const { totalCount } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    fetch("/api/products?pageSize=3")
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data && Array.isArray(data.products)) {
          setFeaturedProducts(data.products);
        }
      })
      .catch(err => console.error("Error loading home products:", err))
      .finally(() => setLoadingProducts(false));
  }, []);

  return (
    <div className="site-shell">
      <div className="announcement">
        <Sparkles size={13} /> A little taste of home, a lot of happiness • Handcrafted in Ganjam, Odisha
      </div>
      <header className="site-header container">
        <Link href="/" className="brand-lockup">
          <img src={logo} className="brand-logo" alt="Flavours of India" />
          <span className="brand-tagline">Goodness from home</span>
        </Link>
        <nav className={open ? "main-nav is-open" : "main-nav"}>
          <Link href="/collection" onClick={() => setOpen(false)}>
            The Collection
          </Link>
          <Link href="/blog" onClick={() => setOpen(false)}>
            Pantry Journal
          </Link>
          <Link href="/track-order" onClick={() => setOpen(false)}>
            Track Order
          </Link>
          <a href="#story" onClick={() => setOpen(false)}>
            Our Story
          </a>
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
      <main>
        <section
          className="hero hero-art-directed"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(32,27,22,.82) 0%, rgba(32,27,22,.38) 55%, rgba(32,27,22,.02) 100%), url(${heroImages[active]})`,
          }}
        >
          <div className="hero-inner container">
            <div className="hero-kicker">
              <span>Pantry note 0{active + 1}</span>
              <span className="kicker-rule" />
              <span>{categories[active]}</span>
            </div>
            <p className="eyebrow light">
              Regional goodness, thoughtfully gathered
            </p>
            <h1>
              Make room
              <br />
              <em>for joy.</em>
            </h1>
            <p className="hero-copy">
              Small-batch favourites from the places that make them best —
              gathered for unhurried moments, shared tables, and happy little
              cravings.
            </p>
            <Link href="/collection" className="primary-button">
              Shop the collection <ArrowRight size={18} />
            </Link>
            <div className="hero-meta">
              <span>Scroll to savour</span>
              <span className="meta-line" />
              <span>Odisha → everywhere</span>
            </div>
          </div>
        </section>

        <section className="category-strip container">
          <div className="section-intro">
            <p className="eyebrow">A considered collection</p>
            <h2>
              Bring home
              <br />
              <em>the good stuff.</em>
            </h2>
            <p className="intro-copy">
              Not everything. Just the things worth reaching for again and
              again.
            </p>
          </div>
          <div className="category-list">
            {categories.map((category, index) => (
              <button
                key={category}
                className={
                  active === index ? "category-link active" : "category-link"
                }
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => setActive(index)}
              >
                <span>0{index + 1}</span>
                {category}
                <ArrowRight size={17} />
              </button>
            ))}
          </div>
        </section>

        <section className="collection-section">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">The first helping</p>
                <h2>
                  Curated for
                  <br />
                  <em>the everyday.</em>
                </h2>
              </div>
              <Link href="/collection" className="text-link">
                View all items <ArrowRight size={16} />
              </Link>
            </div>

            {loadingProducts ? (
              <div
                style={{
                  padding: "48px 0",
                  textAlign: "center",
                  color: "var(--muted)",
                }}
              >
                Loading collection...
              </div>
            ) : featuredProducts.length === 0 ? (
              <div
                style={{
                  background: "var(--ivory)",
                  border: "1px solid var(--border)",
                  padding: "48px 32px",
                  textAlign: "center",
                  maxWidth: "600px",
                  margin: "0 auto",
                }}
              >
                <p className="eyebrow">Pantry Preparation</p>
                <h3
                  style={{
                    font: "600 24px var(--font-serif)",
                    margin: "0 0 12px",
                  }}
                >
                  Our collection is being prepared.
                </h3>
                <p
                  style={{
                    color: "var(--secondary)",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    margin: "0 0 24px",
                  }}
                >
                  We are gathering fresh regional snack batches. Check back
                  shortly to explore our newly added favourites.
                </p>
                <Link href="/collection" className="primary-button">
                  Browse Catalogue <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="product-grid editorial-grid">
                {featuredProducts.map((product, idx) => {
                  const tone = toneList[idx % toneList.length];
                  const img =
                    product.images?.[0]?.publicUrl ||
                    heroImages[idx % heroImages.length];
                  const numStr = `0${idx + 1}`;

                  return (
                    <Link
                      href={`/product/${product.slug}`}
                      className="product-card editorial-card"
                      key={product.id}
                    >
                      <div
                        className={`product-art ${tone}`}
                        style={{
                          backgroundImage: `linear-gradient(180deg, rgba(32,27,22,0) 45%, rgba(32,27,22,.58) 100%), url(${img})`,
                        }}
                      >
                        <span className="product-number">{numStr}</span>
                        <span className="art-caption">{product.category}</span>
                      </div>
                      <div className="product-info">
                        <div>
                          <h3>{product.title}</h3>
                          <p className="product-description">
                            {product.shortDescription}
                          </p>
                          {product.priceInMinorUnits && (
                            <p
                              style={{
                                margin: "8px 0 0",
                                color: "var(--gold)",
                                fontWeight: 600,
                                fontSize: "14px",
                              }}
                            >
                              ₹{(product.priceInMinorUnits / 100).toFixed(0)}
                            </p>
                          )}
                        </div>
                        <span className="product-arrow">
                          <ArrowRight size={18} />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section id="story" className="story-section container">
          <div className="story-index">01 / 03</div>
          <div className="story-copy">
            <p className="eyebrow">A note from home</p>
            <blockquote>
              “The best flavours don’t need to shout. They wait patiently, then
              bring the whole table to life.”
            </blockquote>
            <p>
              We look to Berhampur, Ganjam and beyond for the snacks that carry
              a little place, a little memory, and a lot of heart. Then we bring
              them closer to you.
            </p>
            <Link href="/blog" className="text-link">
              Read Pantry Journal <ArrowRight size={16} />
            </Link>
          </div>
          <div className="story-aside">
            <span>Rooted in</span>
            <strong>Ganjam, Odisha</strong>
            <span>Shared with</span>
            <strong>everyone</strong>
          </div>
        </section>

        <section id="journal" className="newsletter-section">
          <div className="container newsletter-inner">
            <div>
              <p className="eyebrow">Stay close to the good stuff</p>
              <h2>
                A happy little note
                <br />
                in your inbox.
              </h2>
            </div>
            <form
              className="newsletter-form"
              onSubmit={e => {
                e.preventDefault();
                alert("Thank you for subscribing to our pantry stories!");
              }}
            >
              <label htmlFor="email">Your email address</label>
              <div>
                <input id="email" type="email" placeholder="you@example.com" required />
                <button className="primary-button" type="submit">
                  Keep me posted <ArrowRight size={17} />
                </button>
              </div>
              <small>
                No noise. Just new flavours, stories from Ganjam, and first dibs.
              </small>
            </form>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

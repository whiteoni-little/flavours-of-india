import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { supabase } from "@/lib/supabase";

const heroCategories = [
  {
    name: "Pickles",
    query: "Pickles",
    image: "/manus-storage/product-pickle_c9669039.jpg",
    kicker: "Small-batch sun-cured pickles",
  },
  {
    name: "Papad",
    query: "Papad",
    image: "/manus-storage/product-papad_ca672ac8.jpg",
    kicker: "Hand-rolled sun-dried papad",
  },
  {
    name: "Roasted snacks",
    query: "Roasted snacks",
    image: "/manus-storage/product-roasted_1a2dd2a6.jpg",
    kicker: "Dry-roasted spiced savouries",
  },
  {
    name: "Sweet things",
    query: "Sweet things",
    image: "/manus-storage/product-sweets_delicacy.jpg",
    kicker: "Traditional festive delicacies",
  },
];

const toneList = ["red", "olive", "gold"];

export default function Home() {
  const [active, setActive] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*, product_images(*)")
          .eq("is_published", true)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(3);

        if (!error && data && data.length > 0) {
          const formatted = data.map((p: any) => ({
            id: p.id,
            sku: p.sku,
            slug: p.slug,
            title: p.title,
            shortDescription: p.short_description,
            longDescription: p.long_description,
            category: p.category,
            packSize: p.pack_size,
            priceInMinorUnits: p.price_in_minor_units,
            currency: p.currency,
            stockStatus: p.stock_status,
            isPublished: p.is_published,
            images: (p.product_images || []).map((img: any) => ({
              id: img.id,
              storageKey: img.storage_path,
              publicUrl: img.public_url,
              altText: img.alt_text,
              sortOrder: img.sort_order,
            })),
          }));
          setFeaturedProducts(formatted);
          return;
        }

        // Fallback
        const res = await fetch("/api/products?pageSize=3");
        if (res.ok) {
          const apiData = await res.json();
          if (apiData && Array.isArray(apiData.products)) {
            setFeaturedProducts(apiData.products);
          }
        }
      } catch (err) {
        console.error("Error loading home products:", err);
      } finally {
        setLoadingProducts(false);
      }
    }

    loadFeatured();
  }, []);

  const activeCategory = heroCategories[active] || heroCategories[0];

  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section
          className="hero hero-art-directed"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(32,27,22,.82) 0%, rgba(32,27,22,.38) 55%, rgba(32,27,22,.02) 100%), url(${activeCategory.image})`,
          }}
        >
          <div className="hero-inner container">
            <div className="hero-kicker">
              <span>Pantry note 0{active + 1}</span>
              <span className="kicker-rule" />
              <span>{activeCategory.name}</span>
            </div>
            <p className="eyebrow light">
              {activeCategory.kicker}
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
            <Link href={`/collection?category=${encodeURIComponent(activeCategory.query)}`} className="primary-button">
              Shop {activeCategory.name} <ArrowRight size={18} />
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
            {heroCategories.map((cat, index) => (
              <Link
                key={cat.name}
                href={`/collection?category=${encodeURIComponent(cat.query)}`}
                className={
                  active === index ? "category-link active" : "category-link"
                }
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                style={{ textDecoration: "none" }}
              >
                <span>0{index + 1}</span>
                {cat.name}
                <ArrowRight size={17} />
              </Link>
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
                    heroCategories[idx % heroCategories.length].image;
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
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginTop: "8px",
                              flexWrap: "wrap",
                              gap: "6px",
                            }}
                          >
                            {product.priceInMinorUnits && (
                              <p
                                style={{
                                  margin: 0,
                                  color: "var(--gold)",
                                  fontWeight: 600,
                                  fontSize: "15px",
                                }}
                              >
                                ₹{(product.priceInMinorUnits / 100).toFixed(0)}
                              </p>
                            )}
                            <span
                              style={{
                                fontSize: "11px",
                                color: "var(--secondary)",
                                background: "var(--sunken)",
                                border: "1px solid var(--border)",
                                padding: "2px 8px",
                                fontWeight: 500,
                                borderRadius: "3px",
                              }}
                            >
                              {(product.category || "").toLowerCase().includes("papad") || (product.title || "").toLowerCase().includes("papad")
                                ? "200g · 400g"
                                : "200g – 1kg"}
                            </span>
                          </div>
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

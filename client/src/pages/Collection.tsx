import { useEffect, useState } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  ChevronDown,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Link } from "wouter";
import { useCart } from "@/contexts/CartContext";

const toneList = ["red", "olive", "gold"];
const defaultPlaceholderImg = "/manus-storage/product-pickle_c9669039.jpg";

export default function Collection() {
  const { totalCount } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (search.trim()) params.set("search", search.trim());
      if (sortBy !== "default") params.set("sort", sortBy);
      params.set("pageSize", "30");

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setTotal(data.total || 0);
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Error fetching collection:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedCategory, search, sortBy]);

  return (
    <div className="store-page">
      <header className="sub-header container">
        <Link href="/" className="back-link">
          ← Home
        </Link>
        <h1>The collection</h1>
        <Link href="/cart" className="text-link">
          Bag ({totalCount}) <ArrowRight size={16} />
        </Link>
      </header>

      <main className="container collection-main">
        <div className="collection-lede">
          <div>
            <p className="eyebrow">A pantry with a point of view</p>
            <h2>
              Good things,
              <br />
              <em>gathered slowly.</em>
            </h2>
          </div>
          <p>
            Browse our curated collection of regional snacks, pickles, and
            crisps. Every recipe carries place, craft, and memory from
            small-batch kitchens.
          </p>
        </div>

        {/* Toolbar & Filters */}
        <div
          className="filter-row"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative", minWidth: "180px" }}>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="filter-button"
              style={{
                width: "100%",
                appearance: "none",
                padding: "10px 32px 10px 14px",
                border: "1px solid var(--border)",
                background: "var(--sunken)",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--ink)",
                cursor: "pointer",
              }}
            >
              <option value="all">All categories</option>
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown
              size={15}
              style={{
                position: "absolute",
                right: "12px",
                top: "14px",
                pointerEvents: "none",
                color: "var(--muted)",
              }}
            />
          </div>

          <div style={{ position: "relative", minWidth: "180px" }}>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="filter-button"
              style={{
                width: "100%",
                appearance: "none",
                padding: "10px 32px 10px 14px",
                border: "1px solid var(--border)",
                background: "var(--sunken)",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--ink)",
                cursor: "pointer",
              }}
            >
              <option value="default">Sort by: Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="title_asc">Alphabetical</option>
            </select>
            <ChevronDown
              size={15}
              style={{
                position: "absolute",
                right: "12px",
                top: "14px",
                pointerEvents: "none",
                color: "var(--muted)",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--sunken)",
              border: "1px solid var(--border)",
              padding: "0 12px",
              minWidth: "220px",
              height: "40px",
            }}
          >
            <Search size={15} style={{ color: "var(--muted)" }} />
            <input
              type="text"
              placeholder="Search flavours..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                border: 0,
                outline: 0,
                background: "none",
                width: "100%",
                fontSize: "13px",
              }}
            />
          </div>

          <span>
            {total} product{total === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <div
            style={{
              padding: "64px 0",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            Loading collection...
          </div>
        ) : products.length === 0 ? (
          <div
            style={{
              background: "var(--raised)",
              border: "1px solid var(--border)",
              padding: "64px 32px",
              textAlign: "center",
              maxWidth: "600px",
              margin: "40px auto",
            }}
          >
            <p className="eyebrow">Catalogue note</p>
            <h2
              style={{
                font: "600 28px var(--font-serif)",
                margin: "0 0 16px",
              }}
            >
              Nothing matching just yet.
            </h2>
            <p
              style={{
                color: "var(--secondary)",
                fontSize: "14px",
                lineHeight: "1.6",
                margin: "0 0 24px",
              }}
            >
              {search || selectedCategory !== "all"
                ? "We couldn't find items matching your search. Try choosing 'All categories' or clearing your query."
                : "Our small-batch kitchen range is being prepared. Check back soon for fresh arrivals."}
            </p>
            {(search || selectedCategory !== "all") && (
              <button
                className="primary-button"
                onClick={() => {
                  setSelectedCategory("all");
                  setSearch("");
                  setSortBy("default");
                }}
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="collection-grid">
            {products.map((product, idx) => {
              const tone = toneList[idx % toneList.length];
              const img =
                product.images?.[0]?.publicUrl || defaultPlaceholderImg;
              const numStr = `0${idx + 1}`;
              const price = product.priceInMinorUnits
                ? `₹${(product.priceInMinorUnits / 100).toFixed(0)}`
                : null;

              return (
                <Link
                  href={`/product/${product.slug}`}
                  className="product-card editorial-card"
                  key={product.id}
                >
                  <div
                    className={`product-art ${tone}`}
                    style={{
                      backgroundImage: `linear-gradient(180deg, rgba(32,27,22,0) 40%, rgba(32,27,22,.62) 100%), url(${img})`,
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
                      {price && (
                        <p
                          style={{
                            margin: "8px 0 0",
                            color: "var(--gold)",
                            fontWeight: 600,
                            fontSize: "15px",
                          }}
                        >
                          {price}
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
      </main>
    </div>
  );
}

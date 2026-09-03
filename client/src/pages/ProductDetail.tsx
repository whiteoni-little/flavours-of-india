import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { Link, useRoute } from "wouter";
import { useCart } from "@/contexts/CartContext";

const defaultImage = "/manus-storage/product-pickle_c9669039.jpg";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:slug");
  const slug = params?.slug;
  const { totalCount, addItem } = useCart();

  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Accordion toggle states
  const [openIngredients, setOpenIngredients] = useState(false);
  const [openShelfLife, setOpenShelfLife] = useState(false);
  const [openSourcing, setOpenSourcing] = useState(false);

  // Add to cart feedback
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    fetch(`/api/products/${slug}`)
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data) {
          setProduct(data);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product || product.stockStatus === "out_of_stock" || adding) return;
    setAdding(true);
    const success = await addItem(product.id, 1);
    setAdding(false);
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="store-page">
        <header className="sub-header container">
          <Link href="/collection" className="back-link">
            <ArrowLeft size={16} /> Collection
          </Link>
          <Link href="/cart" className="text-link">
            Bag ({totalCount}) <ShoppingBag size={16} />
          </Link>
        </header>
        <main
          className="container"
          style={{
            padding: "128px 0",
            textAlign: "center",
            color: "var(--muted)",
          }}
        >
          Loading product notes...
        </main>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="store-page">
        <header className="sub-header container">
          <Link href="/collection" className="back-link">
            <ArrowLeft size={16} /> Collection
          </Link>
          <Link href="/cart" className="text-link">
            Bag ({totalCount}) <ShoppingBag size={16} />
          </Link>
        </header>
        <main
          className="container"
          style={{
            padding: "96px 0 128px",
            textAlign: "center",
            maxWidth: "600px",
          }}
        >
          <p className="eyebrow">Catalogue update</p>
          <h1
            style={{ font: "600 40px var(--font-serif)", margin: "0 0 16px" }}
          >
            Product not found
          </h1>
          <p
            style={{
              color: "var(--secondary)",
              margin: "0 0 32px",
              lineHeight: "1.7",
            }}
          >
            This recipe or batch is either unavailable or has been archived from
            our collection.
          </p>
          <Link href="/collection" className="primary-button">
            ← Explore other flavours
          </Link>
        </main>
      </div>
    );
  }

  const images =
    product.images && product.images.length > 0
      ? product.images
      : [{ publicUrl: defaultImage, altText: product.title }];
  const currentImage = images[activeImageIndex]?.publicUrl || defaultImage;
  const isOutOfStock = product.stockStatus === "out_of_stock";
  const formattedPrice = product.priceInMinorUnits
    ? `₹${(product.priceInMinorUnits / 100).toFixed(0)}`
    : null;

  return (
    <div className="store-page">
      <header className="sub-header container">
        <Link href="/collection" className="back-link">
          <ArrowLeft size={16} /> Collection
        </Link>
        <Link href="/cart" className="text-link">
          Bag ({totalCount}) <ShoppingBag size={16} />
        </Link>
      </header>

      <main className="container detail-main">
        {/* Gallery / Image container */}
        <div>
          <div
            className="detail-image"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(32,27,22,0) 45%, rgba(32,27,22,.6) 100%), url(${currentImage})`,
            }}
          >
            <span className="detail-stamp">
              {product.category} · pantry note
            </span>
          </div>

          {images.length > 1 && (
            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              {images.map((img: any, i: number) => (
                <button
                  key={img.id || i}
                  onClick={() => setActiveImageIndex(i)}
                  style={{
                    width: "64px",
                    height: "64px",
                    border:
                      activeImageIndex === i
                        ? "2px solid var(--terracotta)"
                        : "1px solid var(--border)",
                    padding: 0,
                    overflow: "hidden",
                    cursor: "pointer",
                    background: "none",
                  }}
                >
                  <img
                    src={img.publicUrl}
                    alt={img.altText || "Product photo"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Copy & Purchase Area */}
        <div className="detail-copy">
          <p className="eyebrow">
            {product.category} · {isOutOfStock ? "Sold out" : "In pantry"}
          </p>
          <h1>
            {product.title.split("—")[0]}
            <br />
            <em>{product.title.split("—")[1] || "small-batch"}</em>
          </h1>

          {formattedPrice && (
            <div
              style={{
                font: "600 32px var(--font-serif)",
                color: "var(--gold)",
                margin: "0 0 20px",
              }}
            >
              {formattedPrice}
            </div>
          )}

          <p className="detail-lede">{product.shortDescription}</p>

          {product.longDescription && (
            <p
              style={{
                color: "var(--secondary)",
                lineHeight: "1.7",
                margin: "0 0 32px",
              }}
            >
              {product.longDescription}
            </p>
          )}

          {isOutOfStock ? (
            <div
              className="sample-callout"
              style={{ borderColor: "var(--terracotta)" }}
            >
              This batch is currently sold out. Our kitchen is preparing the
              next small batch.
            </div>
          ) : (
            <button
              className="primary-button add-button"
              onClick={handleAddToCart}
              disabled={adding}
              style={{
                cursor: adding ? "wait" : "pointer",
                background: added ? "var(--olive)" : "var(--terracotta)",
              }}
            >
              <span>
                {added
                  ? "Added to your bag"
                  : adding
                    ? "Adding..."
                    : "Add to bag"}
              </span>
              {added ? (
                <Check size={18} />
              ) : adding ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ShoppingBag size={17} />
              )}
            </button>
          )}

          <div className="accordions">
            {product.ingredients && (
              <div>
                <button
                  type="button"
                  onClick={() => setOpenIngredients(!openIngredients)}
                >
                  <span>Ingredients & allergens</span>
                  {openIngredients ? (
                    <ChevronUp size={17} />
                  ) : (
                    <ChevronDown size={17} />
                  )}
                </button>
                {openIngredients && (
                  <div
                    style={{
                      padding: "0 0 16px",
                      color: "var(--secondary)",
                      fontSize: "14px",
                      lineHeight: "1.6",
                    }}
                  >
                    {product.ingredients}
                  </div>
                )}
              </div>
            )}

            {product.shelfLife && (
              <div>
                <button
                  type="button"
                  onClick={() => setOpenShelfLife(!openShelfLife)}
                >
                  <span>Shelf life & storage</span>
                  {openShelfLife ? (
                    <ChevronUp size={17} />
                  ) : (
                    <ChevronDown size={17} />
                  )}
                </button>
                {openShelfLife && (
                  <div
                    style={{
                      padding: "0 0 16px",
                      color: "var(--secondary)",
                      fontSize: "14px",
                      lineHeight: "1.6",
                    }}
                  >
                    {product.shelfLife}
                  </div>
                )}
              </div>
            )}

            {product.sourcingNote && (
              <div>
                <button
                  type="button"
                  onClick={() => setOpenSourcing(!openSourcing)}
                >
                  <span>Sourced from regional kitchens</span>
                  {openSourcing ? (
                    <ChevronUp size={17} />
                  ) : (
                    <ChevronDown size={17} />
                  )}
                </button>
                {openSourcing && (
                  <div
                    style={{
                      padding: "0 0 16px",
                      color: "var(--secondary)",
                      fontSize: "14px",
                      lineHeight: "1.6",
                    }}
                  >
                    {product.sourcingNote}
                  </div>
                )}
              </div>
            )}
          </div>

          <Link href="/collection" className="back-link">
            <ArrowLeft size={16} /> Back to collection
          </Link>
        </div>
      </main>
    </div>
  );
}

export interface PackOption {
  size: string;
  priceInMinorUnits: number;
  savingsLabel?: string;
}

export function isPapadProduct(category?: string | null, title?: string | null): boolean {
  const cat = (category || "").toLowerCase();
  const t = (title || "").toLowerCase();
  return cat.includes("papad") || t.includes("papad") || cat.includes("appalam");
}

export function getPackOptions(product: {
  category?: string | null;
  title?: string | null;
  priceInMinorUnits?: number | null;
  packSize?: string | null;
}): PackOption[] {
  const basePrice = product.priceInMinorUnits || 9900;
  const isPapad = isPapadProduct(product.category, product.title);

  if (isPapad) {
    return [
      {
        size: "200 gm",
        priceInMinorUnits: basePrice,
      },
      {
        size: "400 gm",
        priceInMinorUnits: 19000, // ₹190 value pack as specifically requested
        savingsLabel: "Popular",
      },
    ];
  }

  // For all other categories (Pickles, Snacks, Sweets, etc.): 200 gm, 400 gm, 800 gm, 1 kg
  const p400 = Math.round((basePrice * 1.9) / 100) * 100;
  const p800 = Math.round((basePrice * 3.6) / 100) * 100;
  const p1kg = Math.round((basePrice * 4.4) / 100) * 100;

  return [
    {
      size: "200 gm",
      priceInMinorUnits: basePrice,
    },
    {
      size: "400 gm",
      priceInMinorUnits: p400,
      savingsLabel: "Save 5%",
    },
    {
      size: "800 gm",
      priceInMinorUnits: p800,
      savingsLabel: "Save 10%",
    },
    {
      size: "1 kg",
      priceInMinorUnits: p1kg,
      savingsLabel: "Best Value",
    },
  ];
}

export function calculateVariantPrice(
  product: { category?: string | null; title?: string | null; priceInMinorUnits?: number | null },
  packSize?: string | null
): number {
  if (!packSize) return product.priceInMinorUnits || 0;
  const options = getPackOptions(product);
  const normalized = packSize.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const match = options.find(
    opt => opt.size.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized
  );
  return match ? match.priceInMinorUnits : product.priceInMinorUnits || 0;
}

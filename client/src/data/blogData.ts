export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  coverImage: string;
  category: string;
  readTime: string;
  publishedDate: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  tags: string[];
  content: {
    sectionHeading?: string;
    body: string;
    highlight?: string;
  }[];
  relatedCategory?: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "blog-1",
    slug: "the-art-of-sun-dried-pickles",
    title: "The Art of Sun-Dried Pickles: Mustard Oil, Summer Sun & Generational Recipes from Odisha",
    subtitle: "Why real Indian pickles cannot be rushed or mass-produced.",
    excerpt:
      "A journey into small-batch sun-curing, cold-pressed mustard oil, and the treasured porcelain pickle jars of Ganjam that have preserved taste across generations.",
    coverImage: "/manus-storage/product-roasted_1a2dd2a6.jpg",
    category: "Heritage Recipes",
    readTime: "5 min read",
    publishedDate: "September 1, 2026",
    author: {
      name: "Durga Prasad Patro",
      role: "Founder, Flavours of India",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
    },
    tags: ["Pickles", "Heritage", "Ganjam", "Odisha", "Small Batch"],
    relatedCategory: "Pickles",
    content: [
      {
        sectionHeading: "The Magic of Summer Terraces in Ganjam",
        body: "Long before factory jars and artificial preservatives lined supermarket shelves, summer across Indian homes was marked by ceramic 'Barnis' (earthenware pickle jars) lined up neatly under the blazing morning sun. In Berhampur and across Ganjam district, mothers and grandmothers would slice raw, tangy green mangoes, hand-toss them in turmeric and rock salt, and let the gentle coastal breeze dry them to exact moisture levels.",
        highlight:
          "Pickling is not merely preservation; it is the patient craft of transforming raw fruit into liquid gold using only time, sun, and pure cold-pressed oil.",
      },
      {
        sectionHeading: "Cold-Pressed Mustard Oil & Stone-Ground Spices",
        body: "The secret behind the distinct pungent kick of our authentic Mango and Lime Pickles lies in using wood-pressed Kacchi Ghani mustard oil combined with crushed fenugreek seeds, nigella (kalonji), fennel, and whole red chillies. The natural antimicrobial properties of pure mustard oil seal in the aroma while allowing the spices to mature and deepen in character over weeks.",
      },
      {
        sectionHeading: "Bringing the Authentic Table Back to Life",
        body: "At Flavours of India, we stay true to this unhurried process. No synthetic vinegar, no artificial colours. Just genuine ingredients, slow sun-curing, and recipes that honour the regional warmth of our homeland.",
      },
    ],
  },
  {
    id: "blog-2",
    slug: "crispy-heritage-south-indian-murukku",
    title: "Crispy Heritage: Why Hand-Rolled Murukkus and Ribbon Pakoda Define Chai Time",
    subtitle: "The geometry of crunch and the nostalgia of afternoon tea.",
    excerpt:
      "From roasted gram flour to the exact temperature of pure groundnut oil, explore how the artisanal crunch of traditional savouries transforms every Indian household's evening ritual.",
    coverImage: "/manus-storage/product-papad_ca672ac8.jpg",
    category: "Snack Culture",
    readTime: "4 min read",
    publishedDate: "August 24, 2026",
    author: {
      name: "Pooja Mohanty",
      role: "Pantry Curator",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80",
    },
    tags: ["Murukku", "Chai Time", "Crispy", "Artisanal", "Tea Time"],
    relatedCategory: "Savoury Snacks",
    content: [
      {
        sectionHeading: "The Revered 4 PM Chai Ritual",
        body: "In every Indian home, 4:00 PM is sacred. The kettle begins to whistle with ginger and cardamom, and someone opens the brass tin filled with fresh, spiral-shaped Murukku and golden Ribbon Pakoda. That single resonant 'snap' when you take a bite is the universal sound of unwinding from the day.",
        highlight:
          "A great savoury snack requires two non-negotiable qualities: a clean, golden crunch that never tastes greasy, and a fragrant burst of cumin and asafoetida.",
      },
      {
        sectionHeading: "Crafted with Hand-Selected Lentils",
        body: "Our traditional Murukkus are prepared using finely milled rice flour blended with roasted urad dal flour and a hint of white sesame seeds and ajwain. Hand-pressed through traditional brass moulds and fried to a gentle crisp in small batches, they deliver that signature wholesome taste you remember from childhood.",
      },
    ],
  },
  {
    id: "blog-3",
    slug: "superfood-roasted-lotus-makhana",
    title: "Roasted Lotus Seeds & Spiced Peanuts: The Guilt-Free Snacking Revolution",
    subtitle: "Slow-roasted, nutrient-packed, and full of wholesome flavour.",
    excerpt:
      "Slow-roasted without deep-frying and seasoned with pink Himalayan salt and hand-pounded spices. Discover why traditional roasted snacks are nature's premier everyday fuel.",
    coverImage: "/manus-storage/hero-pantry_47065533.jpg",
    category: "Health & Ingredients",
    readTime: "4 min read",
    publishedDate: "August 15, 2026",
    author: {
      name: "Durga Prasad Patro",
      role: "Founder, Flavours of India",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
    },
    tags: ["Roasted Snacks", "Makhana", "Healthy", "Superfoods", "Protein"],
    relatedCategory: "Roasted Snacks",
    content: [
      {
        sectionHeading: "Rediscovering Ancient Indian Superfoods",
        body: "Fox nuts (Phool Makhana) and slow-roasted peanuts have been staples of mindful Indian eating for centuries. Rich in protein, magnesium, potassium, and natural antioxidants, they satisfy cravings without the heavy calories or cholesterol of ultra-processed snacks.",
        highlight:
          "Snacking shouldn't feel like a compromise between health and taste. When you roast wholesome seeds with natural spices, every handful is pure vitality.",
      },
      {
        sectionHeading: "Zero Artificial Flavours, Pure Roasted Goodness",
        body: "Our roasted range is dry-roasted in traditional ovens, tossed in a touch of cold-pressed oil only to adhere to our custom blend of roasted cumin, dry mango powder (amchur), and black salt. Crisp, airy, and deeply satisfying.",
      },
    ],
  },
  {
    id: "blog-4",
    slug: "flavours-of-ganjam-odisha-culinary-legacy",
    title: "Flavours of Ganjam: Exploring the Distinctive Aromas & Snack Traditions of Coastal Odisha",
    subtitle: "From Berhampur to the Chilika shores, uncovering a rich regional food culture.",
    excerpt:
      "Nestled between the Eastern Ghats and the Bay of Bengal, Ganjam district holds centuries of culinary secrets — from sun-dried Badi to spiced papads and heirloom sweetmeats.",
    coverImage: "/manus-storage/product-roasted_1a2dd2a6.jpg",
    category: "Regional Stories",
    readTime: "6 min read",
    publishedDate: "July 29, 2026",
    author: {
      name: "Durga Prasad Patro",
      role: "Founder, Flavours of India",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
    },
    tags: ["Ganjam", "Odisha", "Berhampur", "Coastal Odisha", "Pantry Story"],
    relatedCategory: "Papad",
    content: [
      {
        sectionHeading: "The Silk & Snack Capital of South Odisha",
        body: "Berhampur in Ganjam district is renowned across India not only for its intricate silk sarees but for its vibrant, unapologetic street food and artisanal snack heritage. The unique coastal climate, combined with generations of master halwais and namkeen makers, created flavours you simply cannot find anywhere else.",
        highlight:
          "Every pack we curate at Flavours of India carries the genuine pride of Ganjam — packaged with care and shipped straight to your doorstep across India.",
      },
      {
        sectionHeading: "Sun-Dried Phula Badi and Hand-Pounded Spices",
        body: "A signature delicacy of Ganjam is the delicate 'Phula Badi' made with black gram paste beaten until light as air and sun-dried on cotton sheets. When flash-fried, it melts on the tongue. We are proud to bring these authentic treasures directly from Ganjam, Odisha to food lovers across the country.",
      },
    ],
  },
];

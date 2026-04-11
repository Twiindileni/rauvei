export type Product = {
  id: string;
  name: string;
  category: string;
  collection: "women" | "men" | "accessories" | "limited-edition";
  price: string;
  priceValue: number;
  image: string;
  alt: string;
};

export const products: Product[] = [
  // Women's Collection
  {
    id: "w1",
    name: "Elegant Silk Dress",
    category: "Evening Wear",
    collection: "women",
    price: "N$200.99",
    priceValue: 200.99,
    image: "/lau3.jpg",
    alt: "Woman Dress",
  },
  {
    id: "w2",
    name: "Summer Chic Set",
    category: "Coordinates",
    collection: "women",
    price: "N$325.99",
    priceValue: 325.99,
    image: "/lau2.jpg",
    alt: "Woman Short & Top",
  },
  {
    id: "w3",
    name: "Classic Evening Gown",
    category: "Luxury",
    collection: "women",
    price: "N$250.00",
    priceValue: 250.00,
    image: "/lau3.jpg",
    alt: "Woman Dress",
  },

  // Men's Collection
  {
    id: "m1",
    name: "Bespoke Navy Suit",
    category: "Formal",
    collection: "men",
    price: "N$1200.00",
    priceValue: 1200.00,
    image: "/lau1.jpg",
    alt: "Men's Suit",
  },
  {
    id: "m2",
    name: "Urban Explorer Shirt",
    category: "Casual",
    collection: "men",
    price: "N$450.00",
    priceValue: 450.00,
    image: "/lau1.jpg",
    alt: "Men's Shirt",
  },

  // Accessories
  {
    id: "a1",
    name: "Vintage Leather Bag",
    category: "Bags",
    collection: "accessories",
    price: "N$850.00",
    priceValue: 850.00,
    image: "/lauvei.png",
    alt: "Leather Bag",
  },
  {
    id: "a2",
    name: "Gold Leaf Necklace",
    category: "Jewelry",
    collection: "accessories",
    price: "N$500.00",
    priceValue: 500.00,
    image: "/lauvei.png",
    alt: "Gold Necklace",
  },

  // Limited Edition
  {
    id: "l1",
    name: "The RauVei Heritage Coat",
    category: "Outerwear",
    collection: "limited-edition",
    price: "N$3500.00",
    priceValue: 3500.00,
    image: "/lau3.jpg",
    alt: "Heritage Coat",
  }
];

/** `page_content` key for the hero image on `/collections/[slug]` (slug uses hyphens; key uses underscores). */
export function pageContentKeyForCollectionHero(slug: string): string {
  return `collection_hero_${slug.replace(/-/g, "_")}`;
}

export const collectionMeta = {
  women: {
    title: "Women's Collection",
    subtitle: "Embrace Your Inner Elegance",
    description: "Discover our meticulously crafted selection of dresses, coordinates, and evening wear designed to empower the modern woman.",
    heroImage: "/lau3.jpg"
  },
  men: {
    title: "Men's Collection",
    subtitle: "Refining Masculine Sophistication",
    description: "From bespoke formal wear to refined casual essentials, explore the collection that defines modern masculinity.",
    heroImage: "/lau1.jpg"
  },
  accessories: {
    title: "The Accessories Studio",
    subtitle: "The Finishing Touch",
    description: "Curated accents to elevate every look. Discover handcrafted leather goods and signature jewelry pieces.",
    heroImage: "/lauvei.png"
  },
  "limited-edition": {
    title: "Limited Edition",
    subtitle: "Beyond Fashion, Art.",
    description: "Exclusive pieces created for the avant-garde. Only a few exist world-wide.",
    heroImage: "/lau3.jpg"
  }
};

export const founder = {
  name: "Rauna Amutenya",
  role: "CEO & Founder",
  phoneHref: "tel:+264812860088",
  phoneLabel: "+264 81 286 0088",
  bio: "RauVei Fashion Boutique was born from a passion for timeless elegance and modern trends. Our mission is to empower individuals to express their unique identity through fashion.",
  image: "/CEO.jpg",
  imageAlt: "Rauna Amutenya - CEO",
};

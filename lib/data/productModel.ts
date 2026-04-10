export type Product = {
  id: string;
  name: string;
  category: string;
  collection: "women" | "men" | "accessories" | "limited-edition";
  price: number;
  image_url: string;
  alt_text: string;
  featured: boolean;
  active: boolean;
  sort_order: number;
  /** Denormalized total likes; maintained by DB triggers */
  likes_count?: number;
};

export function formatPrice(price: number): string {
  return `N$${Number(price).toFixed(2)}`;
}

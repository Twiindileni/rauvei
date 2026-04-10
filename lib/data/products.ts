import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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
};

export function formatPrice(price: number): string {
  return `N$${Number(price).toFixed(2)}`;
}

// Featured products for the home page "New Arrivals" section
export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const db = createSupabaseAdminClient();
    const { data } = await db
      .from("products")
      .select("*")
      .eq("active", true)
      .eq("featured", true)
      .order("sort_order");
    return (data as Product[]) ?? [];
  } catch {
    return [];
  }
}

// All active products for a given collection
export async function getProductsByCollection(collection: string): Promise<Product[]> {
  try {
    const db = createSupabaseAdminClient();
    const { data } = await db
      .from("products")
      .select("*")
      .eq("active", true)
      .eq("collection", collection)
      .order("sort_order");
    return (data as Product[]) ?? [];
  } catch {
    return [];
  }
}

// All products for admin management (including inactive)
export async function getAllProducts(): Promise<Product[]> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("products")
    .select("*")
    .order("sort_order");
  return (data as Product[]) ?? [];
}

export async function getProductById(id: string): Promise<Product | null> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Product) ?? null;
}

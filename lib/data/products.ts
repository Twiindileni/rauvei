import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Product } from "@/lib/data/productModel";

export type { Product } from "@/lib/data/productModel";
export { formatPrice } from "@/lib/data/productModel";

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

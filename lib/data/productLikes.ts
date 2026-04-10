import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Product IDs the current user has liked (for storefront hearts). Server-only. */
export async function getLikedProductIdsForUser(productIds: string[]): Promise<string[]> {
  if (productIds.length === 0) return [];
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from("product_likes")
      .select("product_id")
      .eq("user_id", user.id)
      .in("product_id", productIds);

    return (data ?? []).map((r: { product_id: string }) => r.product_id);
  } catch {
    return [];
  }
}

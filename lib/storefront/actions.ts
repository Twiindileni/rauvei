"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function revalidateStorefront() {
  revalidatePath("/");
  revalidatePath("/collections/women");
  revalidatePath("/collections/men");
  revalidatePath("/collections/accessories");
  revalidatePath("/collections/limited-edition");
}

export async function toggleProductLikeAction(productId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please sign in to like products.", liked: false as const };
  }

  const { data: existing } = await supabase
    .from("product_likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("product_likes").delete().eq("id", existing.id);
    if (error) return { error: error.message, liked: true as const };
    revalidateStorefront();
    revalidatePath("/admin/products");
    return { success: true as const, liked: false as const };
  }

  const { error } = await supabase.from("product_likes").insert({
    user_id: user.id,
    product_id: productId,
  });

  if (error) return { error: error.message, liked: false as const };

  revalidateStorefront();
  revalidatePath("/admin/products");
  return { success: true as const, liked: true as const };
}

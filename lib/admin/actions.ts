"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/auth/admin";

async function assertAdmin() {
  const check = await requireAdminUser();
  if (!check.allowed) throw new Error("Unauthorized");
  return check;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function updateOrderStatusAction(orderId: string, status: string) {
  await assertAdmin();
  const db = createSupabaseAdminClient();
  const { error } = await db
    .from("orders")
    .update({ status })
    .eq("id", orderId);
  if (error) return { error: error.message };
  revalidatePath("/admin/orders");
  return { success: true };
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function updateUserRoleAction(userId: string, role: string) {
  await assertAdmin();
  const db = createSupabaseAdminClient();
  const { error } = await db
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUserAction(userId: string) {
  await assertAdmin();
  const db = createSupabaseAdminClient();
  // Deleting from auth.users cascades to profiles
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { success: true };
}

// ─── Contact Messages ─────────────────────────────────────────────────────────

export async function deleteMessageAction(messageId: string) {
  await assertAdmin();
  const db = createSupabaseAdminClient();
  const { error } = await db
    .from("contact_messages")
    .delete()
    .eq("id", messageId);
  if (error) return { error: error.message };
  revalidatePath("/admin/messages");
  return { success: true };
}

// ─── Blog Posts ───────────────────────────────────────────────────────────────

export async function savePostAction(formData: FormData) {
  const check = await assertAdmin();
  const db = createSupabaseAdminClient();

  const id = formData.get("id") as string | null;
  const title = (formData.get("title") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim();
  const excerpt = (formData.get("excerpt") as string)?.trim() ?? "";
  const content = (formData.get("content") as string)?.trim() ?? "";
  const cover_image_url = (formData.get("cover_image_url") as string)?.trim() || null;
  const publish = formData.get("publish") === "true";

  if (!title || !slug) return { error: "Title and slug are required." };

  const payload = {
    title,
    slug,
    excerpt,
    content,
    cover_image_url,
    published: publish,
    published_at: publish ? new Date().toISOString() : null,
    created_by: check.userId,
  };

  if (id) {
    const { error } = await db.from("blog_posts").update(payload).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await db.from("blog_posts").insert(payload);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  return { success: true };
}

export async function deletePostAction(postId: string) {
  await assertAdmin();
  const db = createSupabaseAdminClient();
  const { error } = await db.from("blog_posts").delete().eq("id", postId);
  if (error) return { error: error.message };
  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  return { success: true };
}

export async function togglePostPublishedAction(postId: string, published: boolean) {
  await assertAdmin();
  const db = createSupabaseAdminClient();
  const { error } = await db
    .from("blog_posts")
    .update({ published, published_at: published ? new Date().toISOString() : null })
    .eq("id", postId);
  if (error) return { error: error.message };
  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  return { success: true };
}

// ─── Products ────────────────────────────────────────────────────────────────

export async function saveProductAction(formData: FormData) {
  await assertAdmin();
  const db = createSupabaseAdminClient();

  const id = formData.get("id") as string | null;
  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim();
  const collection = (formData.get("collection") as string)?.trim();
  const priceRaw = formData.get("price") as string;
  const alt_text = (formData.get("alt_text") as string)?.trim() ?? "";
  const featured = formData.get("featured") === "true";
  const active = formData.get("active") !== "false";
  const sort_order = parseInt(formData.get("sort_order") as string) || 0;

  if (!name || !category || !collection || !priceRaw) {
    return { error: "Name, category, collection, and price are required." };
  }
  const price = parseFloat(priceRaw);
  if (isNaN(price) || price <= 0) return { error: "Price must be a positive number." };

  // Handle image — file upload takes priority, then URL field
  let image_url = (formData.get("image_url") as string)?.trim() ?? "";
  const imageFile = formData.get("image_file") as File | null;

  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split(".").pop() ?? "jpg";
    const path = `products/${Date.now()}.${ext}`;
    const arrayBuffer = await imageFile.arrayBuffer();
    const { data: uploadData, error: uploadError } = await db.storage
      .from("products")
      .upload(path, arrayBuffer, { contentType: imageFile.type, upsert: true });

    if (uploadError) return { error: `Image upload failed: ${uploadError.message}` };

    const { data: urlData } = db.storage.from("products").getPublicUrl(uploadData.path);
    image_url = urlData.publicUrl;
  }

  const payload = { name, category, collection, price, image_url, alt_text, featured, active, sort_order };

  if (id) {
    const { error } = await db.from("products").update(payload).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await db.from("products").insert(payload);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/collections/women");
  revalidatePath("/collections/men");
  revalidatePath("/collections/accessories");
  revalidatePath("/collections/limited-edition");
  return { success: true };
}

export async function deleteProductAction(productId: string) {
  await assertAdmin();
  const db = createSupabaseAdminClient();
  const { error } = await db.from("products").delete().eq("id", productId);
  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  revalidatePath("/");
  return { success: true };
}

export async function toggleProductActiveAction(productId: string, active: boolean) {
  await assertAdmin();
  const db = createSupabaseAdminClient();
  const { error } = await db.from("products").update({ active }).eq("id", productId);
  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  revalidatePath("/");
  return { success: true };
}

export async function toggleProductFeaturedAction(productId: string, featured: boolean) {
  await assertAdmin();
  const db = createSupabaseAdminClient();
  const { error } = await db.from("products").update({ featured }).eq("id", productId);
  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  revalidatePath("/");
  return { success: true };
}

// ─── Page Content ─────────────────────────────────────────────────────────────

export async function savePageContentAction(formData: FormData) {
  await assertAdmin();
  const supabase = await createSupabaseServerClient();

  const updates: { key: string; value: string }[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("content_")) {
      updates.push({ key: key.replace("content_", ""), value: value as string });
    }
  }

  for (const { key, value } of updates) {
    await supabase
      .from("page_content")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", key);
  }

  revalidatePath("/");
  revalidatePath("/admin/pages");
  return { success: true };
}

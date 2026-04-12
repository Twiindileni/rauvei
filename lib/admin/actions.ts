"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

const PAGE_CONTENT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export async function savePageContentAction(
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  await assertAdmin();
  const db = createSupabaseAdminClient();

  const { data: metaRows, error: metaErr } = await db.from("page_content").select("key, type");
  if (metaErr) return { error: metaErr.message };

  const imageKeys = new Set(
    (metaRows ?? []).filter((r) => r.type === "image_url").map((r) => r.key as string),
  );

  const values = new Map<string, string>();
  for (const [k, v] of formData.entries()) {
    if (k.startsWith("content_") && typeof v === "string") {
      values.set(k.replace("content_", ""), v);
    }
  }

  for (const key of imageKeys) {
    const raw = formData.get(`upload_${key}`);
    if (raw instanceof File && raw.size > 0) {
      if (!raw.type.startsWith("image/")) {
        return { error: "Please choose a normal image file (photo), not another file type." };
      }
      if (raw.size > PAGE_CONTENT_IMAGE_MAX_BYTES) {
        return { error: "Each photo must be 5 MB or smaller. Try resizing the image and upload again." };
      }
      const extRaw = raw.name.split(".").pop() ?? "jpg";
      const ext = extRaw.replace(/[^a-z0-9]/gi, "").slice(0, 5) || "jpg";
      const safeKey = key.replace(/[^a-z0-9_-]/gi, "_");
      const path = `${safeKey}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
      const buf = await raw.arrayBuffer();
      const { data: uploaded, error: upErr } = await db.storage.from("page-content").upload(path, buf, {
        contentType: raw.type || "image/jpeg",
        upsert: false,
      });
      if (upErr) {
        return {
          error: `Upload failed (${upErr.message}). If this keeps happening, ask your developer to confirm the "page-content" storage bucket exists in Supabase.`,
        };
      }
      const { data: pub } = db.storage.from("page-content").getPublicUrl(uploaded.path);
      values.set(key, pub.publicUrl);
    }
  }

  for (const [key, value] of values) {
    const { error } = await db
      .from("page_content")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", key);
    if (error) return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/collections/women");
  revalidatePath("/collections/men");
  revalidatePath("/collections/accessories");
  revalidatePath("/collections/limited-edition");
  revalidatePath("/admin/pages");
  return { success: true };
}

// ─── Boutique services ───────────────────────────────────────────────────────

const BOUTIQUE_ICON_KEYS = new Set([
  "star",
  "ruler",
  "scissors",
  "shopping-bag",
  "gift",
  "sparkles",
]);

const SERVICE_REQUEST_STATUSES = new Set(["pending", "contacted", "completed", "cancelled"]);

function normalizeServiceSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function saveBoutiqueServiceAction(formData: FormData) {
  await assertAdmin();
  const db = createSupabaseAdminClient();

  const id = (formData.get("id") as string | null)?.trim() || null;
  const slugRaw = (formData.get("slug") as string)?.trim() ?? "";
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() ?? "";
  const price_label = (formData.get("price_label") as string)?.trim();
  const duration_label = (formData.get("duration_label") as string)?.trim();
  const tagRaw = (formData.get("tag") as string)?.trim();
  const icon_key = (formData.get("icon_key") as string)?.trim() ?? "star";
  const sort_order = parseInt(formData.get("sort_order") as string, 10);
  const active = formData.get("active") === "true";

  const slug = normalizeServiceSlug(slugRaw);
  if (!slug) return { error: "URL slug is required (letters, numbers, and hyphens only)." };
  if (!title || !price_label || !duration_label) {
    return { error: "Title, price label, and duration are required." };
  }
  if (!BOUTIQUE_ICON_KEYS.has(icon_key)) return { error: "Invalid icon selection." };
  if (Number.isNaN(sort_order)) return { error: "Sort order must be a number." };

  const tag = tagRaw || null;

  if (id) {
    const { data: taken } = await db
      .from("boutique_services")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .maybeSingle();
    if (taken) return { error: "Another service already uses that slug." };

    const { error } = await db
      .from("boutique_services")
      .update({
        slug,
        title,
        description,
        price_label,
        duration_label,
        tag,
        icon_key,
        sort_order,
        active,
      })
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { data: taken } = await db.from("boutique_services").select("id").eq("slug", slug).maybeSingle();
    if (taken) return { error: "That slug is already in use." };

    const { error } = await db.from("boutique_services").insert({
      slug,
      title,
      description,
      price_label,
      duration_label,
      tag,
      icon_key,
      sort_order,
      active,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/services");
  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function deleteBoutiqueServiceAction(serviceId: string) {
  await assertAdmin();
  const db = createSupabaseAdminClient();
  const { error } = await db.from("boutique_services").delete().eq("id", serviceId);
  if (error) return { error: error.message };
  revalidatePath("/admin/services");
  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function toggleBoutiqueServiceActiveAction(serviceId: string, active: boolean) {
  await assertAdmin();
  const db = createSupabaseAdminClient();
  const { error } = await db.from("boutique_services").update({ active }).eq("id", serviceId);
  if (error) return { error: error.message };
  revalidatePath("/admin/services");
  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function updateServiceRequestStatusAction(requestId: string, status: string) {
  await assertAdmin();
  if (!SERVICE_REQUEST_STATUSES.has(status)) return { error: "Invalid status." };
  const db = createSupabaseAdminClient();
  const { error } = await db.from("service_requests").update({ status }).eq("id", requestId);
  if (error) return { error: error.message };
  revalidatePath("/admin/services");
  return { success: true };
}

export async function deleteServiceRequestAction(requestId: string) {
  await assertAdmin();
  const db = createSupabaseAdminClient();
  const { error } = await db.from("service_requests").delete().eq("id", requestId);
  if (error) return { error: error.message };
  revalidatePath("/admin/services");
  return { success: true };
}

// ─── Deliveries (shipment tracking & live location) ─────────────────────────

const DELIVERY_ROW_STATUSES = new Set([
  "preparing",
  "dispatched",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "failed",
  "returned",
]);

type DeliveryFormState = { error?: string } | null;

export async function createDeliveryForOrderAction(
  _prev: DeliveryFormState,
  formData: FormData,
): Promise<DeliveryFormState> {
  await assertAdmin();
  const orderId = (formData.get("order_id") as string)?.trim();
  if (!orderId) return { error: "Missing order." };

  const db = createSupabaseAdminClient();
  const { data: order, error: oErr } = await db
    .from("orders")
    .select("user_id, shipping_address")
    .eq("id", orderId)
    .single();

  if (oErr || !order?.shipping_address) {
    return { error: "Could not load this order or its shipping address." };
  }

  const { error } = await db.from("deliveries").insert({
    order_id: orderId,
    user_id: order.user_id,
    shipping_address: order.shipping_address,
    status: "preparing",
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "This order already has shipment tracking." };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/dashboard/deliveries");
  return null;
}

export async function saveDeliveryAction(
  _prev: DeliveryFormState,
  formData: FormData,
): Promise<DeliveryFormState> {
  await assertAdmin();
  const deliveryId = (formData.get("delivery_id") as string)?.trim();
  if (!deliveryId) return { error: "Missing delivery." };

  const status = (formData.get("delivery_status") as string)?.trim();
  if (!DELIVERY_ROW_STATUSES.has(status)) return { error: "Invalid delivery status." };

  const tracking_number = (formData.get("tracking_number") as string)?.trim() || null;
  const courier = (formData.get("courier") as string)?.trim() || null;
  const notes = (formData.get("delivery_notes") as string)?.trim() || null;
  const estRaw = (formData.get("estimated_delivery_date") as string)?.trim();
  const estimated_delivery_date = estRaw || null;

  const latRaw = (formData.get("current_latitude") as string)?.trim() ?? "";
  const lngRaw = (formData.get("current_longitude") as string)?.trim() ?? "";

  const payload: Record<string, unknown> = {
    status,
    tracking_number,
    courier,
    notes,
    estimated_delivery_date,
  };

  if (!latRaw && !lngRaw) {
    payload.current_latitude = null;
    payload.current_longitude = null;
    payload.location_updated_at = null;
  } else {
    const lat = parseFloat(latRaw);
    const lng = parseFloat(lngRaw);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return { error: "Latitude and longitude must be valid numbers." };
    }
    if (lat < -90 || lat > 90) return { error: "Latitude must be between -90 and 90." };
    if (lng < -180 || lng > 180) return { error: "Longitude must be between -180 and 180." };
    payload.current_latitude = lat;
    payload.current_longitude = lng;
    payload.location_updated_at = new Date().toISOString();
  }

  if (status === "delivered") {
    payload.delivered_at = new Date().toISOString();
  }

  const db = createSupabaseAdminClient();
  const { error } = await db.from("deliveries").update(payload).eq("id", deliveryId);
  if (error) return { error: error.message };

  revalidatePath("/admin/orders");
  revalidatePath("/dashboard/deliveries");
  return null;
}

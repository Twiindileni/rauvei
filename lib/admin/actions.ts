"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/auth/admin";
import { Resend } from "resend";
import { renderCampaignHtml } from "@/lib/email/campaignTemplates";

async function assertAdmin() {
  const check = await requireAdminUser();
  if (!check.allowed) throw new Error("Unauthorized");
  return check;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

/** Keeps `deliveries.status` in sync with `orders.status` so the customer timeline updates. */
function deliveryStatusForOrderStatus(orderStatus: string): string | null {
  switch (orderStatus) {
    case "pending":
    case "confirmed":
    case "processing":
      return "preparing";
    case "shipped":
      return "dispatched";
    case "delivered":
      return "delivered";
    case "cancelled":
    case "refunded":
      return "returned";
    default:
      return null;
  }
}

export async function updateOrderStatusAction(orderId: string, status: string) {
  await assertAdmin();
  const db = createSupabaseAdminClient();
  const { error } = await db.from("orders").update({ status }).eq("id", orderId);
  if (error) return { error: error.message };

  const deliveryStatus = deliveryStatusForOrderStatus(status);
  if (deliveryStatus) {
    const payload: Record<string, unknown> = { status: deliveryStatus };
    if (deliveryStatus === "delivered") {
      payload.delivered_at = new Date().toISOString();
    }
    const { data: updatedRows, error: updateDeliveryErr } = await db
      .from("deliveries")
      .update(payload)
      .eq("order_id", orderId)
      .select("id");
    if (updateDeliveryErr) return { error: updateDeliveryErr.message };

    // Some historical orders may not have a delivery row yet.
    // Create one so user dashboard always reflects admin status changes.
    if (!updatedRows || updatedRows.length === 0) {
      const { data: orderRow, error: orderErr } = await db
        .from("orders")
        .select("user_id, shipping_address")
        .eq("id", orderId)
        .maybeSingle();
      if (orderErr || !orderRow?.user_id || !orderRow?.shipping_address) {
        return { error: "Order updated, but shipment record could not be created." };
      }

      const { error: insertDeliveryErr } = await db.from("deliveries").insert({
        order_id: orderId,
        user_id: orderRow.user_id,
        shipping_address: orderRow.shipping_address,
        status: deliveryStatus,
        delivered_at: deliveryStatus === "delivered" ? new Date().toISOString() : null,
      });
      if (insertDeliveryErr) return { error: insertDeliveryErr.message };
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath("/dashboard/deliveries");
  revalidatePath("/dashboard/orders");
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

// ─── Admin Email Campaigns ────────────────────────────────────────────────────

type Recipient = { email: string; userId: string | null; fullName: string | null };
type CampaignFormState = { error?: string; success?: string } | null;

function randomCouponCode(): string {
  return `RAUVEI-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

function makeInvoiceNumber(): string {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const seq = Math.floor(Math.random() * 9000 + 1000);
  return `INV-${stamp}-${seq}`;
}

function dedupeRecipients(rows: Recipient[]): Recipient[] {
  const seen = new Set<string>();
  const unique: Recipient[] = [];
  for (const row of rows) {
    const key = row.email.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push({ ...row, email: key });
  }
  return unique;
}

export async function sendAdminEmailCampaignAction(formData: FormData): Promise<CampaignFormState> {
  const check = await assertAdmin();
  const db = createSupabaseAdminClient();

  const kindRaw = (formData.get("kind") as string)?.trim();
  const audienceRaw = (formData.get("audience") as string)?.trim();
  const subject = (formData.get("subject") as string)?.trim();
  const previewText = (formData.get("preview_text") as string)?.trim() ?? "";
  const message = (formData.get("message") as string)?.trim();
  const selectedCouponId = (formData.get("coupon_id") as string)?.trim() || "";
  const ctaLabel = (formData.get("cta_label") as string)?.trim() || undefined;
  const ctaUrl = (formData.get("cta_url") as string)?.trim() || undefined;
  const recipientEmail = (formData.get("recipient_email") as string)?.trim() || "";
  const orderId = (formData.get("order_id") as string)?.trim() || "";
  const invoiceDueRaw = (formData.get("invoice_due_at") as string)?.trim();

  const kind = (kindRaw ?? "") as "promotion" | "coupon" | "invoice" | "announcement";
  const audience = (audienceRaw ?? "") as "all_users" | "single" | "order_user";

  if (!["promotion", "coupon", "invoice", "announcement"].includes(kind)) {
    return { error: "Invalid email type." };
  }
  if (!["all_users", "single", "order_user"].includes(audience)) {
    return { error: "Invalid audience." };
  }
  if (!subject || !message) return { error: "Subject and message are required." };
  if (audience === "single" && !recipientEmail) return { error: "Recipient email is required for single-send." };
  if (audience === "order_user" && !orderId) return { error: "Select an order for order user audience." };
  if (kind === "invoice" && !orderId) return { error: "Invoice email requires an order." };
  if (kind === "coupon" && !selectedCouponId) return { error: "Please select a saved coupon." };

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return { error: "Missing RESEND_API_KEY. Add it in environment variables first." };
  }
  const fromEmail = process.env.ADMIN_FROM_EMAIL || "RauVei Boutique <sales@rauvei.com>";

  let orderCtx: {
    id: string;
    created_at: string;
    total_amount: number;
    user_id: string;
    items: { product_name: string; quantity: number; unit_price: number }[];
  } | null = null;
  if (orderId) {
    const { data: order, error: orderErr } = await db
      .from("orders")
      .select("id, created_at, total_amount, user_id")
      .eq("id", orderId)
      .maybeSingle();
    if (orderErr || !order) return { error: "Order not found for selected order ID." };
    const { data: items } = await db
      .from("order_items")
      .select("product_name, quantity, unit_price")
      .eq("order_id", orderId);
    orderCtx = {
      id: order.id,
      created_at: order.created_at,
      total_amount: Number(order.total_amount),
      user_id: order.user_id,
      items: (items as { product_name: string; quantity: number; unit_price: number }[] | null) ?? [],
    };
  }

  const recipients: Recipient[] = [];
  if (audience === "single") {
    recipients.push({ email: recipientEmail, userId: null, fullName: null });
  } else if (audience === "order_user") {
    if (!orderCtx) return { error: "Order context missing for recipient lookup." };
    const { data } = await db.auth.admin.getUserById(orderCtx.user_id);
    const email = data.user?.email ?? "";
    if (!email) return { error: "No email found for that order user." };
    const { data: profile } = await db
      .from("profiles")
      .select("full_name")
      .eq("id", orderCtx.user_id)
      .maybeSingle();
    recipients.push({ email, userId: orderCtx.user_id, fullName: profile?.full_name ?? null });
  } else {
    const { data: profiles } = await db.from("profiles").select("id, full_name");
    for (const profile of profiles ?? []) {
      const { data } = await db.auth.admin.getUserById(profile.id as string);
      const email = data.user?.email ?? "";
      if (!email) continue;
      recipients.push({
        email,
        userId: profile.id as string,
        fullName: (profile.full_name as string | null) ?? null,
      });
    }
  }

  const uniqueRecipients = dedupeRecipients(recipients);
  if (uniqueRecipients.length === 0) return { error: "No recipient emails found for this campaign." };

  let effectiveCouponCode: string | undefined;
  let couponId: string | null = null;
  let couponDiscountLabel: string | undefined;
  let couponExpiresLabel: string | undefined;
  if (kind === "coupon") {
    const { data: coupon, error: couponErr } = await db
      .from("coupon_codes")
      .select("id, code, discount_type, discount_value, expires_at, active")
      .eq("id", selectedCouponId)
      .maybeSingle();
    if (couponErr || !coupon) return { error: "Selected coupon was not found." };
    if (!coupon.active) return { error: "Selected coupon is inactive." };
    couponId = coupon.id as string;
    effectiveCouponCode = coupon.code as string;
    couponDiscountLabel =
      coupon.discount_type === "percent"
        ? `${Number(coupon.discount_value).toFixed(0)}% OFF`
        : `Save N$${Number(coupon.discount_value).toFixed(2)}`;
    couponExpiresLabel = coupon.expires_at
      ? new Date(coupon.expires_at as string).toLocaleDateString("en-GB")
      : undefined;
  }

  let invoiceId: string | null = null;
  let invoiceNumber: string | null = null;
  if (kind === "invoice" && orderCtx) {
    invoiceNumber = makeInvoiceNumber();
    const dueAt = invoiceDueRaw ? new Date(invoiceDueRaw).toISOString() : null;
    const { data: invoiceRow, error: invErr } = await db
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        order_id: orderCtx.id,
        user_id: orderCtx.user_id,
        subtotal_amount: orderCtx.total_amount,
        total_amount: orderCtx.total_amount,
        due_at: dueAt,
        status: "issued",
        metadata: { item_count: orderCtx.items.length },
        created_by: check.userId,
      })
      .select("id")
      .single();
    if (invErr || !invoiceRow) {
      return { error: invErr?.message ?? "Could not create invoice record." };
    }
    invoiceId = invoiceRow.id;
  }

  const baseHtml = renderCampaignHtml({
    kind,
    subject,
    previewText,
    message,
    couponCode: effectiveCouponCode,
    couponDiscountLabel,
    expiresLabel: couponExpiresLabel,
    ctaLabel,
    ctaUrl,
    orderId: orderCtx?.id,
    orderTotal: orderCtx?.total_amount,
    orderDate: orderCtx
      ? new Date(orderCtx.created_at).toLocaleDateString("en-NA", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : undefined,
    orderItems: orderCtx?.items,
    invoiceNumber: invoiceNumber ?? undefined,
  });

  const { data: campaign, error: campErr } = await db
    .from("email_campaigns")
    .insert({
      kind,
      audience,
      subject,
      preview_text: previewText,
      body_html: baseHtml,
      from_email: fromEmail,
      status: "draft",
      metadata: {
        coupon_code: effectiveCouponCode ?? null,
        cta_label: ctaLabel ?? null,
        cta_url: ctaUrl ?? null,
        order_id: orderCtx?.id ?? null,
        coupon_id: couponId,
        invoice_id: invoiceId,
        invoice_number: invoiceNumber,
      },
      created_by: check.userId,
    })
    .select("id")
    .single();
  if (campErr || !campaign) return { error: campErr?.message ?? "Failed to create campaign record." };

  const resend = new Resend(resendKey);
  let sentCount = 0;
  let failedCount = 0;
  let firstFailure: string | null = null;
  const recipientRows: Array<Record<string, unknown>> = [];

  for (const recipient of uniqueRecipients) {
    const personalizedHtml = renderCampaignHtml({
      kind,
      subject,
      previewText,
      message,
      couponCode: effectiveCouponCode,
      couponDiscountLabel,
      expiresLabel: couponExpiresLabel,
      ctaLabel,
      ctaUrl,
      recipientName: recipient.fullName,
      orderId: orderCtx?.id,
      orderTotal: orderCtx?.total_amount,
      orderDate: orderCtx
        ? new Date(orderCtx.created_at).toLocaleDateString("en-NA", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : undefined,
      orderItems: orderCtx?.items,
      invoiceNumber: invoiceNumber ?? undefined,
    });

    const result = await resend.emails.send({
      from: fromEmail,
      to: recipient.email,
      subject,
      html: personalizedHtml,
    });

    if (result.error) {
      failedCount += 1;
      if (!firstFailure) firstFailure = result.error.message;
      recipientRows.push({
        campaign_id: campaign.id,
        user_id: recipient.userId,
        email: recipient.email,
        full_name: recipient.fullName,
        status: "failed",
        error: result.error.message,
      });
      continue;
    }

    sentCount += 1;
    recipientRows.push({
      campaign_id: campaign.id,
      user_id: recipient.userId,
      email: recipient.email,
      full_name: recipient.fullName,
      status: "sent",
      provider_message_id: result.data?.id ?? null,
      sent_at: new Date().toISOString(),
    });
  }

  if (recipientRows.length > 0) {
    await db.from("email_campaign_recipients").insert(recipientRows);
  }

  await db
    .from("email_campaigns")
    .update({
      status: failedCount > 0 && sentCount === 0 ? "failed" : "sent",
      sent_count: sentCount,
      failed_count: failedCount,
      sent_at: new Date().toISOString(),
    })
    .eq("id", campaign.id);

  if (couponId) await db.from("coupon_codes").update({ campaign_id: campaign.id }).eq("id", couponId);
  if (invoiceId) {
    await db.from("invoices").update({ campaign_id: campaign.id }).eq("id", invoiceId);
  }

  revalidatePath("/admin/emails");
  if (sentCount === 0 && failedCount > 0) {
    return { error: firstFailure ?? "Email delivery failed. Check your sender domain and API key." };
  }
  return {
    success: `Campaign sent: ${sentCount} delivered, ${failedCount} failed.${effectiveCouponCode ? ` Coupon: ${effectiveCouponCode}.` : ""}${invoiceNumber ? ` Invoice: ${invoiceNumber}.` : ""}`,
  };
}

export async function deleteEmailCampaignAction(campaignId: string) {
  await assertAdmin();
  const db = createSupabaseAdminClient();
  const { error } = await db.from("email_campaigns").delete().eq("id", campaignId);
  if (error) return { error: error.message };
  revalidatePath("/admin/emails");
  return { success: true };
}

// ─── Coupon management ────────────────────────────────────────────────────────

export async function saveCouponAction(formData: FormData) {
  const check = await assertAdmin();
  const db = createSupabaseAdminClient();

  const id = (formData.get("id") as string | null)?.trim() || null;
  const codeRaw = (formData.get("code") as string)?.trim() ?? "";
  const description = (formData.get("description") as string)?.trim() ?? "";
  const discountType = (formData.get("discount_type") as string)?.trim() as "percent" | "fixed_amount";
  const discountValueRaw = (formData.get("discount_value") as string)?.trim();
  const startsAtRaw = (formData.get("starts_at") as string)?.trim();
  const expiresAtRaw = (formData.get("expires_at") as string)?.trim();
  const usageLimitRaw = (formData.get("usage_limit") as string)?.trim();
  const active = formData.get("active") === "true";
  const scopeType = (formData.get("scope_type") as string)?.trim() as "all" | "collection" | "product";
  const scopeCollection = (formData.get("scope_collection") as string)?.trim() || null;
  const scopeProductId = (formData.get("scope_product_id") as string)?.trim() || null;

  if (!codeRaw) return { error: "Coupon code is required." };
  const code = codeRaw.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  if (!code) return { error: "Coupon code must contain letters/numbers only." };

  if (!["percent", "fixed_amount"].includes(discountType)) {
    return { error: "Invalid discount type." };
  }
  const discountValue = parseFloat(discountValueRaw ?? "");
  if (Number.isNaN(discountValue) || discountValue <= 0) {
    return { error: "Discount value must be a positive number." };
  }
  if (discountType === "percent" && discountValue > 100) {
    return { error: "Percent discount cannot exceed 100." };
  }

  if (!["all", "collection", "product"].includes(scopeType)) {
    return { error: "Invalid coupon scope." };
  }
  if (scopeType === "collection" && !scopeCollection) {
    return { error: "Choose a collection for collection scope." };
  }
  if (scopeType === "product" && !scopeProductId) {
    return { error: "Choose a product for product scope." };
  }

  const startsAt = startsAtRaw ? new Date(startsAtRaw).toISOString() : new Date().toISOString();
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw).toISOString() : null;
  if (expiresAt && new Date(expiresAt) <= new Date(startsAt)) {
    return { error: "Expiry must be later than the start date." };
  }
  const usageLimit = usageLimitRaw ? parseInt(usageLimitRaw, 10) : null;
  if (usageLimit !== null && (Number.isNaN(usageLimit) || usageLimit <= 0)) {
    return { error: "Usage limit must be a positive whole number." };
  }

  if (id) {
    const { data: dupe } = await db.from("coupon_codes").select("id").eq("code", code).neq("id", id).maybeSingle();
    if (dupe) return { error: "Another coupon already uses this code." };

    const { error } = await db
      .from("coupon_codes")
      .update({
        code,
        description,
        discount_type: discountType,
        discount_value: discountValue,
        starts_at: startsAt,
        expires_at: expiresAt,
        usage_limit: usageLimit,
        active,
      })
      .eq("id", id);
    if (error) return { error: error.message };

    await db.from("coupon_targets").delete().eq("coupon_id", id);
    const { error: targetErr } = await db.from("coupon_targets").insert({
      coupon_id: id,
      target_type: scopeType,
      collection: scopeType === "collection" ? scopeCollection : null,
      product_id: scopeType === "product" ? scopeProductId : null,
    });
    if (targetErr) return { error: targetErr.message };
  } else {
    const { data: dupe } = await db.from("coupon_codes").select("id").eq("code", code).maybeSingle();
    if (dupe) return { error: "That coupon code already exists." };

    const { data: created, error } = await db
      .from("coupon_codes")
      .insert({
        code,
        description,
        discount_type: discountType,
        discount_value: discountValue,
        starts_at: startsAt,
        expires_at: expiresAt,
        usage_limit: usageLimit,
        active,
        created_by: check.userId,
      })
      .select("id")
      .single();
    if (error || !created) return { error: error?.message ?? "Failed to create coupon." };

    const { error: targetErr } = await db.from("coupon_targets").insert({
      coupon_id: created.id,
      target_type: scopeType,
      collection: scopeType === "collection" ? scopeCollection : null,
      product_id: scopeType === "product" ? scopeProductId : null,
    });
    if (targetErr) return { error: targetErr.message };
  }

  revalidatePath("/admin/coupons");
  revalidatePath("/admin/emails");
  return { success: true };
}

export async function toggleCouponActiveAction(couponId: string, active: boolean) {
  await assertAdmin();
  const db = createSupabaseAdminClient();
  const { error } = await db.from("coupon_codes").update({ active }).eq("id", couponId);
  if (error) return { error: error.message };
  revalidatePath("/admin/coupons");
  return { success: true };
}

export async function deleteCouponAction(couponId: string) {
  await assertAdmin();
  const db = createSupabaseAdminClient();
  const { error } = await db.from("coupon_codes").delete().eq("id", couponId);
  if (error) return { error: error.message };
  revalidatePath("/admin/coupons");
  revalidatePath("/admin/emails");
  return { success: true };
}

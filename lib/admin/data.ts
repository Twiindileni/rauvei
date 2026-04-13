import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const db = createSupabaseAdminClient();
  const [usersRes, ordersRes, messagesRes, postsRes, serviceReqRes, pendingServiceReqRes, emailCampaignRes] =
    await Promise.all([
      db.from("profiles").select("*", { count: "exact", head: true }),
      db.from("orders").select("*", { count: "exact", head: true }),
      db.from("contact_messages").select("*", { count: "exact", head: true }),
      db.from("blog_posts").select("*", { count: "exact", head: true }),
      db.from("service_requests").select("*", { count: "exact", head: true }),
      db.from("service_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      db.from("email_campaigns").select("*", { count: "exact", head: true }),
    ]);
  const pendingOrders = await db
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { data: likeRows, error: likesErr } = await db.from("products").select("likes_count");
  const productLikes = likesErr
    ? 0
    : (likeRows ?? []).reduce(
        (s, r: { likes_count: number | null }) => s + (r.likes_count ?? 0),
        0,
      );

  return {
    users: usersRes.count ?? 0,
    orders: ordersRes.count ?? 0,
    pendingOrders: pendingOrders.count ?? 0,
    messages: messagesRes.count ?? 0,
    posts: postsRes.count ?? 0,
    productLikes,
    serviceRequests: serviceReqRes.count ?? 0,
    pendingServiceRequests: pendingServiceReqRes.count ?? 0,
    emailCampaigns: emailCampaignRes.count ?? 0,
  };
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export type AdminDeliveryRow = {
  id: string;
  order_id: string;
  status: string;
  tracking_number: string | null;
  courier: string | null;
  shipping_address: string;
  estimated_delivery_date: string | null;
  notes: string | null;
  current_latitude: number | null;
  current_longitude: number | null;
  location_updated_at: string | null;
  delivered_at: string | null;
};

export type AdminOrder = {
  id: string;
  status: string;
  total_amount: number;
  shipping_address: string | null;
  notes: string | null;
  created_at: string;
  profiles: { full_name: string | null; phone: string | null } | null;
  user_email: string | null;
  order_items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }[];
  deliveries: AdminDeliveryRow[] | null;
};

export async function getAllOrders(): Promise<AdminOrder[]> {
  const db = createSupabaseAdminClient();
  const { data: orders } = await db
    .from("orders")
    .select(`
      id, status, total_amount, shipping_address, notes, created_at, user_id,
      profiles!inner(full_name, phone),
      order_items(id, product_name, quantity, unit_price),
      deliveries(
        id, order_id, status, tracking_number, courier, shipping_address,
        estimated_delivery_date, notes, current_latitude, current_longitude,
        location_updated_at, delivered_at
      )
    `)
    .order("created_at", { ascending: false });

  if (!orders) return [];

  // Fetch emails from auth.users via admin API
  const userIds = [...new Set(orders.map((o: any) => o.user_id))];
  const emailMap: Record<string, string> = {};
  for (const uid of userIds) {
    const { data } = await db.auth.admin.getUserById(uid as string);
    if (data?.user?.email) emailMap[uid as string] = data.user.email;
  }

  return orders.map((o: any) => ({
    ...o,
    user_email: emailMap[o.user_id] ?? null,
    deliveries: o.deliveries ?? [],
  }));
}

// ─── Users ────────────────────────────────────────────────────────────────────

export type AdminUser = {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
};

export async function getAllUsers(): Promise<AdminUser[]> {
  const db = createSupabaseAdminClient();
  const { data: profiles } = await db
    .from("profiles")
    .select("id, role, full_name, phone, created_at")
    .order("created_at", { ascending: false });

  if (!profiles) return [];

  const users: AdminUser[] = [];
  for (const profile of profiles) {
    const { data } = await db.auth.admin.getUserById(profile.id);
    users.push({
      id: profile.id,
      email: data?.user?.email ?? "unknown",
      role: profile.role,
      full_name: profile.full_name ?? null,
      phone: profile.phone ?? null,
      created_at: profile.created_at,
    });
  }
  return users;
}

// ─── Contact Messages ─────────────────────────────────────────────────────────

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
};

export async function getContactMessages(): Promise<ContactMessage[]> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

// ─── Blog Posts ───────────────────────────────────────────────────────────────

export type AdminPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_image_url: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
};

export async function getAllPosts(): Promise<AdminPost[]> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("blog_posts")
    .select("id, slug, title, excerpt, cover_image_url, published, published_at, created_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getPostById(id: string) {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
}

// ─── Page Content ─────────────────────────────────────────────────────────────

export type PageContentItem = {
  key: string;
  label: string;
  value: string;
  type: "text" | "textarea" | "image_url" | "url";
  section: string;
};

export async function getPageContent(): Promise<PageContentItem[]> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("page_content")
    .select("key, label, value, type, section")
    .order("section", { ascending: true })
    .order("key", { ascending: true });
  return (data as PageContentItem[]) ?? [];
}

// Returns a simple key → value map for use in server components
export async function getPageContentMap(): Promise<Record<string, string>> {
  try {
    const items = await getPageContent();
    return Object.fromEntries(items.map((i) => [i.key, i.value]));
  } catch {
    return {};
  }
}

// ─── Boutique services & service requests ─────────────────────────────────────

export type AdminServiceRequest = {
  id: string;
  user_id: string;
  service_id: string | null;
  service_title: string;
  customer_name: string;
  customer_email: string;
  message: string;
  status: string;
  created_at: string;
};

export async function getServiceRequests(): Promise<AdminServiceRequest[]> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("service_requests")
    .select(
      "id, user_id, service_id, service_title, customer_name, customer_email, message, status, created_at",
    )
    .order("created_at", { ascending: false });
  return (data as AdminServiceRequest[]) ?? [];
}

export type AdminEmailCampaign = {
  id: string;
  kind: "promotion" | "coupon" | "invoice" | "announcement";
  audience: "all_users" | "single" | "order_user";
  subject: string;
  preview_text: string;
  status: "draft" | "sent" | "failed";
  sent_count: number;
  failed_count: number;
  created_by: string | null;
  created_at: string;
  sent_at: string | null;
};

export async function getAdminEmailCampaigns(limit = 20): Promise<AdminEmailCampaign[]> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("email_campaigns")
    .select("id, kind, audience, subject, preview_text, status, sent_count, failed_count, created_by, created_at, sent_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as AdminEmailCampaign[]) ?? [];
}

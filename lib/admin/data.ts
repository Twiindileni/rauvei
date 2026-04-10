import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const db = createSupabaseAdminClient();
  const [usersRes, ordersRes, messagesRes, postsRes] = await Promise.all([
    db.from("profiles").select("*", { count: "exact", head: true }),
    db.from("orders").select("*", { count: "exact", head: true }),
    db.from("contact_messages").select("*", { count: "exact", head: true }),
    db.from("blog_posts").select("*", { count: "exact", head: true }),
  ]);
  const pendingOrders = await db
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  return {
    users: usersRes.count ?? 0,
    orders: ordersRes.count ?? 0,
    pendingOrders: pendingOrders.count ?? 0,
    messages: messagesRes.count ?? 0,
    posts: postsRes.count ?? 0,
  };
}

// ─── Orders ──────────────────────────────────────────────────────────────────

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
};

export async function getAllOrders(): Promise<AdminOrder[]> {
  const db = createSupabaseAdminClient();
  const { data: orders } = await db
    .from("orders")
    .select(`
      id, status, total_amount, shipping_address, notes, created_at, user_id,
      profiles!inner(full_name, phone),
      order_items(id, product_name, quantity, unit_price)
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
    .order("section");
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

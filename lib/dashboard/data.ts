import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { UserProfile, CartItem, Order, Delivery } from "@/lib/dashboard/types";

export type { UserProfile, CartItem, Order, Delivery } from "@/lib/dashboard/types";
export { cartTotal, formatCurrency } from "@/lib/dashboard/types";

// ─── Auth Helper ─────────────────────────────────────────────────────────────

export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?next=/dashboard");
  }

  return { user, supabase };
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function getUserProfile(): Promise<UserProfile> {
  const { user, supabase } = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("profiles")
    .select("id,role,full_name,phone,address_line1,address_line2,city,country,avatar_url,created_at")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    return {
      id: user.id,
      role: "viewer",
      full_name: user.user_metadata?.full_name ?? null,
      phone: null,
      address_line1: null,
      address_line2: null,
      city: null,
      country: "Namibia",
      avatar_url: null,
      created_at: user.created_at,
    };
  }

  return data as UserProfile;
}

export async function getUserEmail(): Promise<string | null> {
  const { user } = await getAuthenticatedUser();
  return user.email ?? null;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export async function getCartItems(): Promise<CartItem[]> {
  const { user, supabase } = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("cart_items")
    .select("id,product_id,product_name,product_image,product_category,quantity,unit_price,added_at")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  if (error) return [];
  return data as CartItem[];
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function getOrders(): Promise<Order[]> {
  const { user, supabase } = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, status, total_amount, shipping_address, notes, created_at,
      order_items (
        id, product_id, product_name, product_image, product_category,
        quantity, unit_price, subtotal
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as Order[];
}

// ─── Deliveries ───────────────────────────────────────────────────────────────

export async function getDeliveries(): Promise<Delivery[]> {
  const { user, supabase } = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("deliveries")
    .select(`
      id, order_id, tracking_number, courier, status,
      shipping_address, estimated_delivery_date, delivered_at, notes, created_at,
      current_latitude, current_longitude, location_updated_at, user_confirmed_at,
      orders (total_amount, created_at)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as unknown as Delivery[];
}


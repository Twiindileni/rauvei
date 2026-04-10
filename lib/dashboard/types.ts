// Shared types and pure utilities — safe to import from both server and client code.

export type UserProfile = {
  id: string;
  role: string;
  full_name: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type CartItem = {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  product_category: string | null;
  quantity: number;
  unit_price: number;
  added_at: string;
};

export type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  product_category: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

export type Order = {
  id: string;
  status: string;
  total_amount: number;
  shipping_address: string | null;
  notes: string | null;
  created_at: string;
  order_items: OrderItem[];
};

export type Delivery = {
  id: string;
  order_id: string;
  tracking_number: string | null;
  courier: string | null;
  status: string;
  shipping_address: string;
  estimated_delivery_date: string | null;
  delivered_at: string | null;
  notes: string | null;
  created_at: string;
  orders: { total_amount: number; created_at: string } | null;
};

// ─── Pure utilities (no server dependencies) ─────────────────────────────────

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
}

export function formatCurrency(amount: number): string {
  return `N$${amount.toFixed(2)}`;
}

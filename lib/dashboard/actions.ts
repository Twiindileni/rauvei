"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCartItems } from "@/lib/dashboard/data";

// ─── Profile Update ───────────────────────────────────────────────────────────

export async function updateProfileAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { error: "Not authenticated." };

  const updates = {
    full_name: (formData.get("full_name") as string)?.trim() || null,
    phone: (formData.get("phone") as string)?.trim() || null,
    address_line1: (formData.get("address_line1") as string)?.trim() || null,
    address_line2: (formData.get("address_line2") as string)?.trim() || null,
    city: (formData.get("city") as string)?.trim() || null,
    country: (formData.get("country") as string)?.trim() || "Namibia",
  };

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Sync display name in Supabase Auth metadata as well
  await supabase.auth.updateUser({
    data: { full_name: updates.full_name },
  });

  revalidatePath("/dashboard/profile");
  return { success: "Profile updated successfully." };
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export async function addToCartAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { error: "Please sign in to add items to your cart." };

  const product = {
    user_id: user.id,
    product_id: formData.get("product_id") as string,
    product_name: formData.get("product_name") as string,
    product_image: (formData.get("product_image") as string) || null,
    product_category: (formData.get("product_category") as string) || null,
    quantity: 1,
    unit_price: parseFloat(formData.get("unit_price") as string),
  };

  if (!product.product_id || !product.product_name || isNaN(product.unit_price)) {
    return { error: "Invalid product data." };
  }

  const { error } = await supabase
    .from("cart_items")
    .upsert(product, { onConflict: "user_id,product_id", ignoreDuplicates: false });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/cart");
  return { success: "Item added to cart." };
}

export async function updateCartQuantityAction(itemId: string, delta: number) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { error: "Not authenticated." };

  const { data: existing } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .single();

  if (!existing) return { error: "Item not found." };

  const newQty = existing.quantity + delta;

  if (newQty <= 0) {
    await supabase.from("cart_items").delete().eq("id", itemId).eq("user_id", user.id);
  } else {
    await supabase
      .from("cart_items")
      .update({ quantity: newQty })
      .eq("id", itemId)
      .eq("user_id", user.id);
  }

  revalidatePath("/dashboard/cart");
  return { success: true };
}

export async function removeCartItemAction(itemId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { error: "Not authenticated." };

  await supabase.from("cart_items").delete().eq("id", itemId).eq("user_id", user.id);

  revalidatePath("/dashboard/cart");
  return { success: true };
}

export async function clearCartAction() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { error: "Not authenticated." };

  await supabase.from("cart_items").delete().eq("user_id", user.id);
  revalidatePath("/dashboard/cart");
  return { success: true };
}

// ─── Checkout (create order from cart) ───────────────────────────────────────

export async function checkoutAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { error: "Not authenticated." };

  const shippingAddress = (formData.get("shipping_address") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!shippingAddress) return { error: "Shipping address is required." };

  const cartItems = await getCartItems();
  if (cartItems.length === 0) return { error: "Your cart is empty." };

  const totalAmount = cartItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      status: "pending",
      total_amount: totalAmount,
      shipping_address: shippingAddress,
      notes,
    })
    .select("id")
    .single();

  if (orderError || !order) return { error: orderError?.message ?? "Failed to create order." };

  // Insert order items
  const orderItems = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    product_image: item.product_image,
    product_category: item.product_category,
    quantity: item.quantity,
    unit_price: item.unit_price,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
  if (itemsError) return { error: itemsError.message };

  // Clear cart
  await supabase.from("cart_items").delete().eq("user_id", user.id);

  revalidatePath("/dashboard/cart");
  revalidatePath("/dashboard/orders");
  return { success: "Order placed successfully!", orderId: order.id };
}

// ─── Service Booking Request ──────────────────────────────────────────────────

export async function requestServiceAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { error: "Not authenticated." };

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const service = (formData.get("service") as string)?.trim();
  const message = (formData.get("message") as string)?.trim();

  if (!name || !email || !service || !message) {
    return { error: "All fields are required." };
  }

  const { error } = await supabase.from("contact_messages").insert({
    name,
    email,
    message: `[Service Request: ${service}]\n\n${message}`,
  });

  if (error) return { error: error.message };
  return { success: "Your service request has been sent. We will contact you within 24 hours." };
}

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BoutiqueService = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price_label: string;
  duration_label: string;
  tag: string | null;
  icon_key: string;
  sort_order: number;
  active: boolean;
};

/** Active catalog for the signed-in user dashboard (RLS: active rows only). */
export async function getActiveBoutiqueServicesForUser(): Promise<BoutiqueService[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("boutique_services")
    .select("id, slug, title, description, price_label, duration_label, tag, icon_key, sort_order, active")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (data as BoutiqueService[]) ?? [];
}

/** Full catalog for admin (includes inactive). */
export async function getAllBoutiqueServices(): Promise<BoutiqueService[]> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("boutique_services")
    .select("id, slug, title, description, price_label, duration_label, tag, icon_key, sort_order, active")
    .order("sort_order", { ascending: true });
  return (data as BoutiqueService[]) ?? [];
}

export const BOUTIQUE_SERVICE_ICON_KEYS = [
  "star",
  "ruler",
  "scissors",
  "shopping-bag",
  "gift",
  "sparkles",
] as const;

export type BoutiqueServiceIconKey = (typeof BOUTIQUE_SERVICE_ICON_KEYS)[number];

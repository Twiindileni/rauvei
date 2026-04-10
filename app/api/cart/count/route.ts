import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ count: 0 });
    }

    // Sum all quantities so the badge reflects total items, not distinct rows
    const { data } = await supabase
      .from("cart_items")
      .select("quantity")
      .eq("user_id", user.id);

    const total = (data ?? []).reduce((sum, row) => sum + (row.quantity ?? 0), 0);
    return NextResponse.json({ count: total });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}

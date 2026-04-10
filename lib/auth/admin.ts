import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdminUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { allowed: false, reason: "unauthenticated" as const };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { allowed: false, reason: "unauthenticated" as const };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { allowed: false, reason: "unauthorized" as const };
  }

  return { allowed: true, userId: user.id as string };
}

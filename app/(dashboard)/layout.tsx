import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/dashboard/DashboardNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?next=/dashboard");
  }

  // Fetch profile for display name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName: string | null =
    profile?.full_name ?? user.user_metadata?.full_name ?? null;

  return (
    <div className="dash-layout">
      <DashboardNav userName={userName} email={user.email ?? null} />
      <div className="dash-content">
        <main className="dash-main">{children}</main>
      </div>
    </div>
  );
}

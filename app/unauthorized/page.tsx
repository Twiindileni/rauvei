import Link from "next/link";
import { ShieldX } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function UnauthorizedPage() {
  let email: string | null = null;
  let role: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      email = user.email ?? null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      role = profile?.role ?? "unknown";
    }
  } catch {
    // ignore
  }

  return (
    <main style={{
      minHeight: "80vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
    }}>
      <div style={{
        textAlign: "center",
        maxWidth: "480px",
      }}>
        <ShieldX size={64} style={{ color: "var(--primary)", marginBottom: "24px" }} />
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "2rem", marginBottom: "12px" }}>
          Access Denied
        </h1>
        <p style={{ color: "#666", marginBottom: "32px", lineHeight: 1.7 }}>
          You do not have permission to view this page. Admin access is required.
        </p>

        {email && (
          <div style={{
            background: "#f9f5f0",
            border: "1px solid #e8ddd0",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "32px",
            textAlign: "left",
            fontSize: "0.9rem",
          }}>
            <p style={{ marginBottom: "8px" }}>
              <strong>Logged in as:</strong> {email}
            </p>
            <p style={{ marginBottom: "0" }}>
              <strong>Current role:</strong>{" "}
              <span style={{
                background: role === "admin" ? "#d4f0dc" : "#fde8d8",
                color: role === "admin" ? "#1a5c2a" : "#8a3a10",
                padding: "2px 10px",
                borderRadius: "999px",
                fontWeight: 600,
              }}>
                {role ?? "none"}
              </span>
            </p>
            {role !== "admin" && (
              <p style={{ marginTop: "12px", color: "#8a6030", fontSize: "0.85rem" }}>
                To grant admin access, run this SQL in your Supabase dashboard:
              </p>
            )}
            {role !== "admin" && (
              <code style={{
                display: "block",
                marginTop: "8px",
                background: "#1e1e1e",
                color: "#d4d4d4",
                padding: "12px",
                borderRadius: "6px",
                fontSize: "0.78rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}>
                {`update public.profiles\nset role = 'admin'\nwhere id = (\n  select id from auth.users\n  where email = '${email}'\n);`}
              </code>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
          <Link href="/" className="btn btn-secondary">Go Home</Link>
          <Link href="/dashboard" className="btn btn-primary">My Dashboard</Link>
        </div>
      </div>
    </main>
  );
}

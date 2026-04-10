"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ─── Login ───────────────────────────────────────────────────────────────────

export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string | null)?.trim();
  const password = formData.get("password") as string | null;
  const next = (formData.get("next") as string | null)?.trim() || null;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  // Check the user's role so admins land on /admin, everyone else on /dashboard
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let destination = "/dashboard";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "admin") {
      destination = "/admin";
    }
  }

  // Allow explicit ?next= override (e.g. deep-link back after auto-logout)
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    destination = next;
  }

  revalidatePath("/", "layout");
  redirect(destination);
}

// ─── Register ─────────────────────────────────────────────────────────────────

export async function registerAction(formData: FormData) {
  const name = (formData.get("name") as string | null)?.trim();
  const email = (formData.get("email") as string | null)?.trim();
  const password = formData.get("password") as string | null;

  if (!name || !email || !password) {
    return { error: "All fields are required." };
  }

  if ((password as string).length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success:
      "Account created! Check your email for a confirmation link before signing in.",
  };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

// ─── Forgot Password ─────────────────────────────────────────────────────────

export async function forgotPasswordAction(formData: FormData) {
  const email = (formData.get("email") as string | null)?.trim();

  if (!email) {
    return { error: "Please enter your email address." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success: "Password reset link sent. Please check your email.",
  };
}

// ─── Update Password (used after clicking email link) ─────────────────────────

export async function updatePasswordAction(formData: FormData) {
  const password = formData.get("password") as string | null;
  const confirm = formData.get("confirm") as string | null;

  if (!password || !confirm) {
    return { error: "Both fields are required." };
  }

  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/admin");
}

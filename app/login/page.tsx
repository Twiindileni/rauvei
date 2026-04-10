"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { User, Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { loginAction, registerAction } from "@/lib/auth/actions";

type ActionResult = { error?: string; success?: string } | null;

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";

  const [loginState, loginDispatch, loginPending] = useActionState(
    async (_prev: ActionResult, formData: FormData): Promise<ActionResult> =>
      loginAction(formData),
    null,
  );

  const [signupState, signupDispatch, signupPending] = useActionState(
    async (_prev: ActionResult, formData: FormData): Promise<ActionResult> =>
      registerAction(formData),
    null,
  );

  const state = mode === "login" ? loginState : signupState;
  const dispatch = mode === "login" ? loginDispatch : signupDispatch;
  const pending = mode === "login" ? loginPending : signupPending;

  return (
    <main className="auth-page">
      {/* Editorial side panel */}
      <section className="auth-side-panel">
        <div style={{ position: "absolute", inset: "0", opacity: "0.45" }}>
          <img
            src="/auth_bg.jpg"
            alt="LauVei High Fashion"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", color: "#fff" }}>
          <h2 className="hero-subtitle fadeIn" style={{ color: "var(--accent)" }}>
            The LauVei Circle
          </h2>
          <h1
            className="hero-title fadeIn"
            style={{ fontSize: "4rem", marginBottom: "32px", animationDelay: "0.2s" }}
          >
            {mode === "login" ? "Welcome Back" : "Join the Elite"}
          </h1>
          <p
            className="fadeIn"
            style={{
              fontSize: "1.1rem",
              color: "rgba(255,255,255,0.7)",
              maxWidth: "400px",
              margin: "0 auto",
              lineHeight: "1.8",
              animationDelay: "0.4s",
            }}
          >
            {mode === "login"
              ? "Sign in to access your curated collections and personalized style consultations."
              : "Create an account to experience the pinnacle of Namibian elegance and exclusive member benefits."}
          </p>
        </div>
      </section>

      {/* Form side */}
      <section className="auth-form-side">
        <div className="container" style={{ maxWidth: "450px" }}>
          <div className="fadeIn">
            <div style={{ marginBottom: "48px" }}>
              <Link href="/" style={{ fontSize: "0.8rem", color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                ← Back to boutique
              </Link>
              <h2 style={{ fontSize: "2.5rem", marginBottom: "8px", marginTop: "24px" }}>
                {mode === "login" ? "Sign In" : "Create Account"}
              </h2>
              <p style={{ color: "var(--text-muted)" }}>Please enter your details below.</p>
            </div>

            {/* Global feedback banner */}
            {state?.error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "#fff1f1",
                  border: "1px solid #ffcccc",
                  color: "#cc0000",
                  padding: "14px 18px",
                  marginBottom: "24px",
                  fontSize: "0.9rem",
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                {state.error}
              </div>
            )}

            {state?.success && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "#f0fff4",
                  border: "1px solid #b2f0ca",
                  color: "#2f6a3e",
                  padding: "14px 18px",
                  marginBottom: "24px",
                  fontSize: "0.9rem",
                }}
              >
                <CheckCircle size={18} style={{ flexShrink: 0 }} />
                {state.success}
              </div>
            )}

            <form action={dispatch} style={{ display: "grid", gap: "24px" }}>
              {/* carry the ?next= redirect through the form */}
              {next && <input type="hidden" name="next" value={next} />}
              {mode === "signup" && (
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <div style={{ position: "relative" }}>
                    <input type="text" id="name" name="name" placeholder="E.g. John Doe" required />
                    <User
                      size={18}
                      style={{ position: "absolute", right: "0", top: "18px", color: "#ccc", pointerEvents: "none" }}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div style={{ position: "relative" }}>
                  <input type="email" id="email" name="email" placeholder="john@example.com" required />
                  <Mail
                    size={18}
                    style={{ position: "absolute", right: "0", top: "18px", color: "#ccc", pointerEvents: "none" }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: "absolute",
                      right: "0",
                      top: "18px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#ccc",
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {mode === "login" && (
                <div style={{ textAlign: "right", marginTop: "-8px" }}>
                  <Link
                    href="/forgot-password"
                    style={{ fontSize: "0.8rem", color: "var(--text-muted)", textDecoration: "underline" }}
                  >
                    Forgot Password?
                  </Link>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={pending}
                style={{ width: "100%", height: "64px", fontSize: "0.8rem", marginTop: "8px" }}
              >
                {pending ? (
                  "Processing..."
                ) : (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      letterSpacing: "0.2em",
                      justifyContent: "center",
                    }}
                  >
                    {mode === "login" ? "Sign In" : "Create Account"} <ArrowRight size={18} />
                  </span>
                )}
              </button>
            </form>

            <div
              style={{
                marginTop: "40px",
                textAlign: "center",
                paddingTop: "32px",
                borderTop: "1px solid var(--bg-offset)",
              }}
            >
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "0",
                    cursor: "pointer",
                    color: "var(--primary)",
                    fontWeight: "700",
                    textDecoration: "underline",
                  }}
                >
                  {mode === "login" ? "Create one now" : "Sign in here"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

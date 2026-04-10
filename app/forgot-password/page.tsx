"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { forgotPasswordAction } from "@/lib/auth/actions";

type ActionResult = { error?: string; success?: string } | null;

export default function ForgotPasswordPage() {
  const [state, dispatch, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData): Promise<ActionResult> =>
      forgotPasswordAction(formData),
    null,
  );

  return (
    <main className="auth-page">
      <section className="auth-side-panel">
        <div style={{ position: "absolute", inset: "0", opacity: "0.45" }}>
          <img
            src="/auth_bg.jpg"
            alt="LauVei Fashion"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", color: "#fff" }}>
          <h2 className="hero-subtitle fadeIn" style={{ color: "var(--accent)" }}>
            Account Recovery
          </h2>
          <h1
            className="hero-title fadeIn"
            style={{ fontSize: "4rem", marginBottom: "32px", animationDelay: "0.2s" }}
          >
            Reset Password
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
            Enter your email address and we will send you a secure link to reset your password.
          </p>
        </div>
      </section>

      <section className="auth-form-side">
        <div className="container" style={{ maxWidth: "450px" }}>
          <div className="fadeIn">
            <div style={{ marginBottom: "48px" }}>
              <Link href="/login" style={{ fontSize: "0.8rem", color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                ← Back to sign in
              </Link>
              <h2 style={{ fontSize: "2.5rem", marginBottom: "8px", marginTop: "24px" }}>Forgot Password</h2>
              <p style={{ color: "var(--text-muted)" }}>
                We&apos;ll send a reset link to your registered email.
              </p>
            </div>

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

            {state?.success ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "16px",
                  textAlign: "center",
                }}
              >
                <CheckCircle size={56} style={{ color: "var(--primary)" }} />
                <p style={{ color: "var(--text-muted)", lineHeight: "1.8" }}>{state.success}</p>
                <Link href="/login" className="btn btn-primary" style={{ marginTop: "16px" }}>
                  Back to Sign In
                </Link>
              </div>
            ) : (
              <form action={dispatch} style={{ display: "grid", gap: "24px" }}>
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

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={pending}
                  style={{ width: "100%", height: "64px", fontSize: "0.8rem" }}
                >
                  {pending ? (
                    "Sending..."
                  ) : (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        justifyContent: "center",
                        letterSpacing: "0.2em",
                      }}
                    >
                      Send Reset Link <ArrowRight size={18} />
                    </span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

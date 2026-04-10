"use client";

import { useActionState } from "react";
import { Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { useState } from "react";
import { updatePasswordAction } from "@/lib/auth/actions";

type ActionResult = { error?: string } | null;

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [state, dispatch, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData): Promise<ActionResult> =>
      updatePasswordAction(formData),
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
            Secure Access
          </h2>
          <h1
            className="hero-title fadeIn"
            style={{ fontSize: "4rem", marginBottom: "32px", animationDelay: "0.2s" }}
          >
            New Password
          </h1>
        </div>
      </section>

      <section className="auth-form-side">
        <div className="container" style={{ maxWidth: "450px" }}>
          <div className="fadeIn">
            <div style={{ marginBottom: "48px" }}>
              <h2 style={{ fontSize: "2.5rem", marginBottom: "8px" }}>Set New Password</h2>
              <p style={{ color: "var(--text-muted)" }}>Choose a strong password of at least 8 characters.</p>
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

            <form action={dispatch} style={{ display: "grid", gap: "24px" }}>
              <div className="form-group">
                <label htmlFor="password">New Password</label>
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

              <div className="form-group">
                <label htmlFor="confirm">Confirm New Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    id="confirm"
                    name="confirm"
                    placeholder="••••••••"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    style={{
                      position: "absolute",
                      right: "0",
                      top: "18px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#ccc",
                    }}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Lock size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Minimum 8 characters required
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={pending}
                style={{ width: "100%", height: "64px", fontSize: "0.8rem" }}
              >
                {pending ? (
                  "Updating..."
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
                    Update Password <ArrowRight size={18} />
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

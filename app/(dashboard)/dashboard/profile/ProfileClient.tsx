"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/lib/dashboard/actions";
import { CheckCircle, AlertCircle, User, Phone, MapPin, Globe } from "lucide-react";
import type { UserProfile } from "@/lib/dashboard/types";

type ActionResult = { error?: string; success?: string } | null;

type Props = { profile: UserProfile; email: string | null };

export default function ProfileClient({ profile, email }: Props) {
  const [state, dispatch, pending] = useActionState(
    async (_prev: ActionResult, fd: FormData): Promise<ActionResult> => updateProfileAction(fd),
    null,
  );

  return (
    <div>
      <div className="dash-page-header">
        <h1 className="dash-page-title">My Profile</h1>
        <p className="dash-page-subtitle">Manage your personal information and shipping address</p>
      </div>

      {state?.success && (
        <div className="dash-alert dash-alert-success">
          <CheckCircle size={18} /> {state.success}
        </div>
      )}
      {state?.error && (
        <div className="dash-alert dash-alert-error">
          <AlertCircle size={18} /> {state.error}
        </div>
      )}

      <div className="dash-card-grid">
        <div className="dash-card">
          <div className="dash-card-header">
            <User size={18} strokeWidth={1.8} />
            <h2>Personal Information</h2>
          </div>
          <form action={dispatch}>
            <div className="dash-form-grid">
              <div className="dash-form-group dash-span-2">
                <label>Full Name</label>
                <input type="text" name="full_name" defaultValue={profile.full_name ?? ""} placeholder="Your full name" />
              </div>
              <div className="dash-form-group">
                <label>Email Address</label>
                <input type="email" value={email ?? ""} readOnly className="dash-input-readonly" />
                <span className="dash-field-hint">Email cannot be changed here</span>
              </div>
              <div className="dash-form-group">
                <label><Phone size={14} /> Phone Number</label>
                <input type="tel" name="phone" defaultValue={profile.phone ?? ""} placeholder="+264 81 000 0000" />
              </div>

              <div className="dash-card-subheader dash-span-2">
                <MapPin size={16} strokeWidth={1.8} />
                <h3>Shipping Address</h3>
              </div>

              <div className="dash-form-group dash-span-2">
                <label>Address Line 1</label>
                <input type="text" name="address_line1" defaultValue={profile.address_line1 ?? ""} placeholder="Street address, P.O. box" />
              </div>
              <div className="dash-form-group dash-span-2">
                <label>Address Line 2</label>
                <input type="text" name="address_line2" defaultValue={profile.address_line2 ?? ""} placeholder="Apartment, suite, unit (optional)" />
              </div>
              <div className="dash-form-group">
                <label>City</label>
                <input type="text" name="city" defaultValue={profile.city ?? ""} placeholder="Windhoek" />
              </div>
              <div className="dash-form-group">
                <label><Globe size={14} /> Country</label>
                <input type="text" name="country" defaultValue={profile.country ?? "Namibia"} placeholder="Namibia" />
              </div>
            </div>
            <div className="dash-form-actions">
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        <div className="dash-card">
          <div className="dash-card-header"><h2>Account Summary</h2></div>
          <div className="dash-info-rows">
            <div className="dash-info-row">
              <span className="dash-info-label">Account Type</span>
              <span className="dash-badge dash-badge-gold">
                {profile.role === "admin" ? "Administrator" : "LauVei Member"}
              </span>
            </div>
            <div className="dash-info-row">
              <span className="dash-info-label">Member Since</span>
              <span className="dash-info-value">
                {new Date(profile.created_at).toLocaleDateString("en-NA", { month: "long", year: "numeric" })}
              </span>
            </div>
            <div className="dash-info-row">
              <span className="dash-info-label">Email Verified</span>
              <span className="dash-badge dash-badge-green">Confirmed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

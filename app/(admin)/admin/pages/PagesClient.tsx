"use client";

import { useActionState } from "react";
import { savePageContentAction } from "@/lib/admin/actions";
import { CheckCircle, AlertCircle, Image } from "lucide-react";
import type { PageContentItem } from "@/lib/admin/data";

type Result = { error?: string; success?: boolean } | null;

const SECTION_LABELS: Record<string, string> = {
  hero:  "Hero Section",
  about: "About / Founder Section",
  general: "General",
};

export default function PagesClient({ items }: { items: PageContentItem[] }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: Result, fd: FormData): Promise<Result> => savePageContentAction(fd),
    null,
  );

  const sections = [...new Set(items.map((i) => i.section))];

  return (
    <div>
      {state?.error && (
        <div className="admin-alert admin-alert--error" style={{ marginBottom: "24px" }}>
          <AlertCircle size={16} /> {state.error}
        </div>
      )}
      {state?.success && (
        <div className="admin-alert admin-alert--success" style={{ marginBottom: "24px" }}>
          <CheckCircle size={16} /> Page content saved successfully.
        </div>
      )}

      <form action={formAction}>
        {sections.map((section) => {
          const sectionItems = items.filter((i) => i.section === section);
          return (
            <div key={section} className="admin-form-card" style={{ marginBottom: "24px" }}>
              <h2 className="admin-section-title">{SECTION_LABELS[section] ?? section}</h2>
              <div style={{ display: "grid", gap: "20px" }}>
                {sectionItems.map((item) => (
                  <div key={item.key} className="admin-form-group">
                    <label>
                      {item.label}
                      {(item.type === "image_url" || item.type === "url") && (
                        <span style={{ marginLeft: "6px", fontSize: "0.75rem", color: "#999" }}>(URL)</span>
                      )}
                    </label>

                    {item.type === "textarea" ? (
                      <textarea
                        name={`content_${item.key}`}
                        defaultValue={item.value}
                        rows={4}
                        style={{ resize: "vertical" }}
                      />
                    ) : (
                      <input
                        type="text"
                        name={`content_${item.key}`}
                        defaultValue={item.value}
                        placeholder={item.type === "image_url" ? "https://... or /filename.jpg" : ""}
                      />
                    )}

                    {item.type === "image_url" && item.value && (
                      <div style={{ marginTop: "10px" }}>
                        <p style={{ fontSize: "0.78rem", color: "#999", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Image size={12} /> Current image preview:
                        </p>
                        <img
                          src={item.value}
                          alt={item.label}
                          style={{ maxHeight: "120px", maxWidth: "260px", borderRadius: "8px", border: "1px solid #e8ddd0", objectFit: "cover" }}
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
          <button type="submit" className="admin-btn admin-btn--primary" disabled={pending} style={{ minWidth: "160px" }}>
            {pending ? "Saving…" : "Save All Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

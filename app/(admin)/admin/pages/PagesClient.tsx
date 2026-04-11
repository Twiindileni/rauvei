"use client";

import { useActionState, useRef, useState } from "react";
import { savePageContentAction } from "@/lib/admin/actions";
import { CheckCircle, AlertCircle, Image, Upload } from "lucide-react";
import type { PageContentItem } from "@/lib/admin/data";

type Result = { error?: string; success?: boolean } | null;

const SECTION_LABELS: Record<string, string> = {
  hero: "Home page — hero",
  about: "Home page — about / founder",
  about_page: "About page — hero image",
  contact_page: "Contact page — hero image",
  collections: "Collection pages — hero images",
  general: "General",
};

function friendlyImageLabel(label: string) {
  return label
    .replace(/\s*—?\s*image\s*URL\s*$/i, "")
    .replace(/\s*image\s*URL\s*$/i, "")
    .replace(/\s*URL\s*$/i, "")
    .trim() || label;
}

function PageImageRow({ item }: { item: PageContentItem }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const displaySrc = localPreview ?? (item.value?.trim() || "");

  return (
    <div className="admin-form-group">
      <label>{friendlyImageLabel(item.label)}</label>
      <p style={{ fontSize: "0.85rem", color: "#777", margin: "0 0 12px", lineHeight: 1.5 }}>
        Tap the box below to pick a photo from your computer. When you are done, scroll down and press{" "}
        <strong>Save all changes</strong>. Photos can be JPG, PNG, or WebP — up to 5 MB each.
      </p>

      <div className="product-image-upload-wrap">
        <div
          className="product-upload-drop"
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileRef.current?.click();
            }
          }}
        >
          <Upload size={22} style={{ color: "#c8956c" }} />
          <span style={{ fontWeight: 600, color: "#444" }}>Upload a photo</span>
          <span style={{ fontSize: "0.78rem", textAlign: "center", maxWidth: "280px" }}>
            This is the easy way — no links to copy.
          </span>
          <input
            ref={fileRef}
            type="file"
            name={`upload_${item.key}`}
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              setLocalPreview(f ? URL.createObjectURL(f) : null);
            }}
          />
        </div>

        <details style={{ marginTop: "4px" }}>
          <summary
            style={{
              cursor: "pointer",
              fontSize: "0.82rem",
              color: "#999",
              userSelect: "none",
              listStyle: "none",
            }}
          >
            Advanced: paste an image link instead
          </summary>
          <input
            type="text"
            name={`content_${item.key}`}
            defaultValue={item.value}
            placeholder="Only if someone sent you a direct link to a picture"
            style={{
              marginTop: "10px",
              width: "100%",
              padding: "10px 14px",
              border: "1px solid #e8ddd0",
              borderRadius: "8px",
              fontSize: "0.9rem",
            }}
          />
        </details>
      </div>

      {displaySrc ? (
        <div style={{ marginTop: "12px" }}>
          <p
            style={{
              fontSize: "0.78rem",
              color: "#999",
              marginBottom: "6px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Image size={12} /> How it will look (after saving, if you uploaded a new photo):
          </p>
          <img
            src={displaySrc}
            alt=""
            style={{
              maxHeight: "140px",
              maxWidth: "min(320px, 100%)",
              borderRadius: "8px",
              border: "1px solid #e8ddd0",
              objectFit: "cover",
            }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

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
          <CheckCircle size={16} /> Saved. Your website is updated.
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
                  <div key={item.key}>
                    {item.type === "image_url" ? (
                      <PageImageRow item={item} />
                    ) : (
                      <div className="admin-form-group">
                        <label>
                          {item.label}
                          {item.type === "url" && (
                            <span style={{ marginLeft: "6px", fontSize: "0.75rem", color: "#999" }}>(link)</span>
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
                            placeholder={item.type === "url" ? "https://..." : ""}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
          <button type="submit" className="admin-btn admin-btn--primary" disabled={pending} style={{ minWidth: "200px" }}>
            {pending ? "Saving…" : "Save all changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState, useTransition, useActionState } from "react";
import { savePostAction, deletePostAction, togglePostPublishedAction } from "@/lib/admin/actions";
import { Plus, Edit2, Trash2, Eye, EyeOff, X, CheckCircle, AlertCircle } from "lucide-react";
import type { AdminPost } from "@/lib/admin/data";

type FormResult = { error?: string; success?: boolean } | null;

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function PostsClient({ posts: initialPosts }: { posts: AdminPost[] }) {
  const [editing, setEditing] = useState<AdminPost | null>(null);
  const [creating, setCreating] = useState(false);
  const [, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [formState, formAction, formPending] = useActionState(
    async (_prev: FormResult, fd: FormData): Promise<FormResult> => {
      const result = await savePostAction(fd);
      if (result?.success) { setEditing(null); setCreating(false); }
      return result;
    },
    null,
  );

  const handleToggle = (post: AdminPost) => {
    setTogglingId(post.id);
    startTransition(async () => {
      await togglePostPublishedAction(post.id, !post.published);
      setTogglingId(null);
    });
  };

  const handleDelete = (postId: string) => {
    startTransition(async () => {
      await deletePostAction(postId);
      setConfirmDelete(null);
    });
  };

  const showForm = editing || creating;
  const formPost = editing;

  return (
    <div>
      {!showForm && (
        <button className="admin-btn admin-btn--primary" onClick={() => setCreating(true)} style={{ marginBottom: "24px" }}>
          <Plus size={16} /> New Post
        </button>
      )}

      {showForm && (
        <div className="admin-form-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h2 className="admin-section-title" style={{ margin: 0 }}>
              {formPost ? "Edit Post" : "New Post"}
            </h2>
            <button className="admin-btn admin-btn--icon" onClick={() => { setEditing(null); setCreating(false); }}>
              <X size={18} />
            </button>
          </div>

          {formState?.error && (
            <div className="admin-alert admin-alert--error"><AlertCircle size={16} /> {formState.error}</div>
          )}

          <form action={formAction} style={{ display: "grid", gap: "18px" }}>
            {formPost && <input type="hidden" name="id" value={formPost.id} />}
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Title *</label>
                <input name="title" required defaultValue={formPost?.title} placeholder="Post title"
                  onChange={(e) => {
                    const slugInput = document.querySelector<HTMLInputElement>('input[name="slug"]');
                    if (slugInput && !formPost) slugInput.value = slugify(e.target.value);
                  }}
                />
              </div>
              <div className="admin-form-group">
                <label>Slug *</label>
                <input name="slug" required defaultValue={formPost?.slug} placeholder="post-url-slug" />
              </div>
            </div>
            <div className="admin-form-group">
              <label>Excerpt</label>
              <input name="excerpt" defaultValue={formPost?.excerpt} placeholder="Short summary shown in listings" />
            </div>
            <div className="admin-form-group">
              <label>Cover Image URL</label>
              <input name="cover_image_url" defaultValue={formPost?.cover_image_url ?? ""} placeholder="https://... or /image.jpg" />
            </div>
            <div className="admin-form-group">
              <label>Content</label>
              <textarea name="content" rows={10} defaultValue={(formPost as any)?.content ?? ""}
                placeholder="Write your post content here (markdown supported)..."
                style={{ fontFamily: "monospace", fontSize: "0.875rem" }}
              />
            </div>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.9rem" }}>
                <input type="checkbox" name="publish" value="true" defaultChecked={formPost?.published} />
                Publish immediately
              </label>
              <button type="submit" className="admin-btn admin-btn--primary" disabled={formPending} style={{ marginLeft: "auto" }}>
                {formPending ? "Saving…" : "Save Post"}
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="admin-table-wrap">
          {initialPosts.length === 0 ? (
            <div className="admin-empty"><p>No posts yet. Create your first one!</p></div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {initialPosts.map((post) => (
                  <tr key={post.id}>
                    <td><strong>{post.title}</strong></td>
                    <td className="admin-td-muted">{post.slug}</td>
                    <td>
                      <span className="admin-badge" style={{
                        background: post.published ? "#10b98122" : "#6b728022",
                        color: post.published ? "#10b981" : "#6b7280",
                      }}>
                        {post.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="admin-td-muted">{new Date(post.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <button className="admin-btn admin-btn--icon" title={post.published ? "Unpublish" : "Publish"}
                          disabled={togglingId === post.id}
                          onClick={() => handleToggle(post)}>
                          {post.published ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button className="admin-btn admin-btn--icon" title="Edit" onClick={() => setEditing(post)}>
                          <Edit2 size={15} />
                        </button>
                        {confirmDelete === post.id ? (
                          <>
                            <button className="admin-btn admin-btn--danger" onClick={() => handleDelete(post.id)}>Delete</button>
                            <button className="admin-btn admin-btn--ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
                          </>
                        ) : (
                          <button className="admin-btn admin-btn--icon" title="Delete" onClick={() => setConfirmDelete(post.id)}>
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

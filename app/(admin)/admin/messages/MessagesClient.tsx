"use client";

import { useTransition, useState } from "react";
import { deleteMessageAction } from "@/lib/admin/actions";
import { Trash2, Mail, ChevronDown, ChevronUp } from "lucide-react";
import type { ContactMessage } from "@/lib/admin/data";

export default function MessagesClient({ messages }: { messages: ContactMessage[] }) {
  const [, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteMessageAction(id);
      setConfirmDelete(null);
    });
  };

  if (messages.length === 0) {
    return (
      <div className="admin-empty">
        <Mail size={48} />
        <p>No messages yet.</p>
      </div>
    );
  }

  return (
    <div className="admin-table-wrap">
      {messages.map((msg) => (
        <div key={msg.id} className="admin-message-card">
          <div className="admin-message-card__head" onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}>
            <div className="admin-message-card__meta">
              <span className="admin-message-card__name">{msg.name}</span>
              <span className="admin-message-card__email">{msg.email}</span>
            </div>
            <div className="admin-message-card__actions">
              <span className="admin-td-muted" style={{ fontSize: "0.8rem" }}>
                {new Date(msg.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              {confirmDelete === msg.id ? (
                <div style={{ display: "flex", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
                  <button className="admin-btn admin-btn--danger" onClick={() => handleDelete(msg.id)}>Delete</button>
                  <button className="admin-btn admin-btn--ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
                </div>
              ) : (
                <button
                  className="admin-btn admin-btn--icon"
                  title="Delete"
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(msg.id); }}
                >
                  <Trash2 size={15} />
                </button>
              )}
              {expanded === msg.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          {expanded === msg.id && (
            <div className="admin-message-card__body">
              <a href={`mailto:${msg.email}`} className="admin-reply-link">
                Reply to {msg.email}
              </a>
              <p className="admin-message-card__text">{msg.message}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

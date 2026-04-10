"use client";

import { useTransition, useState } from "react";
import { updateUserRoleAction, deleteUserAction } from "@/lib/admin/actions";
import { Trash2, Shield, User } from "lucide-react";
import type { AdminUser } from "@/lib/admin/data";

export default function UsersClient({ users, currentUserId }: { users: AdminUser[]; currentUserId: string }) {
  const [, startTransition] = useTransition();
  const [updating, setUpdating] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleRoleChange = (userId: string, role: string) => {
    setUpdating(userId);
    startTransition(async () => {
      await updateUserRoleAction(userId, role);
      setUpdating(null);
    });
  };

  const handleDelete = (userId: string) => {
    startTransition(async () => {
      await deleteUserAction(userId);
      setConfirmDelete(null);
    });
  };

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Joined</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div className="admin-user-avatar">
                    {user.role === "admin" ? <Shield size={14} /> : <User size={14} />}
                  </div>
                  <span>{user.full_name ?? "—"}</span>
                </div>
              </td>
              <td className="admin-td-muted">{user.email}</td>
              <td className="admin-td-muted">{user.phone ?? "—"}</td>
              <td className="admin-td-muted">{new Date(user.created_at).toLocaleDateString()}</td>
              <td>
                <select
                  className="admin-select"
                  value={user.role}
                  disabled={updating === user.id || user.id === currentUserId}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                >
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>
                {user.id !== currentUserId && (
                  confirmDelete === user.id ? (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button className="admin-btn admin-btn--danger" onClick={() => handleDelete(user.id)}>
                        Confirm
                      </button>
                      <button className="admin-btn admin-btn--ghost" onClick={() => setConfirmDelete(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button className="admin-btn admin-btn--icon" onClick={() => setConfirmDelete(user.id)} title="Delete user">
                      <Trash2 size={15} />
                    </button>
                  )
                )}
                {user.id === currentUserId && (
                  <span className="admin-badge" style={{ background: "#c8956c22", color: "#c8956c" }}>You</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

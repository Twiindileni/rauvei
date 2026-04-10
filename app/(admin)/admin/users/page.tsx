import { getAllUsers } from "@/lib/admin/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import UsersClient from "./UsersClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const users = await getAllUsers();

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">User Management</h1>
        <p className="admin-page-subtitle">{users.length} registered users</p>
      </div>
      <UsersClient users={users} currentUserId={user?.id ?? ""} />
    </div>
  );
}

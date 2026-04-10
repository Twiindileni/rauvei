import { getContactMessages } from "@/lib/admin/data";
import MessagesClient from "./MessagesClient";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const messages = await getContactMessages();

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Contact Messages</h1>
        <p className="admin-page-subtitle">{messages.length} messages received</p>
      </div>
      <MessagesClient messages={messages} />
    </div>
  );
}

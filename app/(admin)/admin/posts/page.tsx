import { getAllPosts } from "@/lib/admin/data";
import PostsClient from "./PostsClient";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const posts = await getAllPosts();

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Blog Posts</h1>
        <p className="admin-page-subtitle">{posts.length} posts · {posts.filter(p => p.published).length} published</p>
      </div>
      <PostsClient posts={posts} />
    </div>
  );
}

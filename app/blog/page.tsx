import Link from "next/link";
import { getPublishedPosts } from "@/lib/blog";

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <main className="blog-container">
      <h1>Blog</h1>
      <p>Latest published updates from RauVei.</p>

      <div className="blog-grid">
        {posts.length === 0 ? (
          <div className="blog-card">
            <h3>No posts yet</h3>
            <p>Your admin dashboard will publish blog posts here.</p>
          </div>
        ) : (
          posts.map((post) => (
            <article className="blog-card" key={post.id}>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <Link href={`/blog/${post.slug}`}>Read more</Link>
            </article>
          ))
        )}
      </div>
    </main>
  );
}

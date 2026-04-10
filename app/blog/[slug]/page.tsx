import { notFound } from "next/navigation";
import { getPublishedPostBySlug } from "@/lib/blog";

type BlogDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="blog-container">
      <article>
        <h1>{post.title}</h1>
        <p>{post.excerpt}</p>
        <p>
          Published{" "}
          {post.published_at ? new Date(post.published_at).toLocaleDateString() : "Recently"}
        </p>
        <hr />
        <p>{post.content}</p>
      </article>
    </main>
  );
}

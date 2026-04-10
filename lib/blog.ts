import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  published: boolean;
  published_at: string | null;
};

export async function getPublishedPosts() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return [] as BlogPost[];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id,slug,title,excerpt,content,cover_image_url,published,published_at")
    .eq("published", true)
    .order("published_at", { ascending: false });

  if (error) {
    return [] as BlogPost[];
  }

  return data as BlogPost[];
}

export async function getPublishedPostBySlug(slug: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id,slug,title,excerpt,content,cover_image_url,published,published_at")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error) {
    return null;
  }

  return data as BlogPost;
}

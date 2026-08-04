import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPostDetail } from "@/lib/notion";

export const revalidate = 60;

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default async function PostPage({
  params
}: {
  params: { id: string };
}) {
  const post = await getPostDetail(params.id);

  if (!post) {
    notFound();
  }

  return (
    <article>
      <Link
        href="/"
        className="text-sm text-neutral-500 hover:text-ink transition-colors"
      >
        ← 목록으로
      </Link>

      <h1 className="text-2xl font-semibold mt-5 mb-2 leading-snug">
        {post.title}
      </h1>
      <p className="text-sm text-muted mb-6">{formatDate(post.date)}</p>

      {post.cover && (
        <div className="relative w-full h-64 rounded-xl overflow-hidden mb-8 border border-line">
          <Image
            src={post.cover}
            alt={post.title}
            fill
            sizes="800px"
            className="object-cover"
          />
        </div>
      )}

      <div
        className="prose-post"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
    </article>
  );
}

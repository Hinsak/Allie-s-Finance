import Image from "next/image";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/notion";

export const revalidate = 60;

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default async function HomePage() {
  const posts = await getPublishedPosts();

  return (
    <div>
      <h2 className="text-base font-medium mb-4">포스트</h2>

      {posts.length === 0 ? (
        <p className="text-sm text-muted py-10 text-center">
          아직 게시된 글이 없어요. Notion에서 글을 작성하고 상태를 게시로
          바꿔보세요.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="border border-line rounded-xl overflow-hidden bg-white hover:border-neutral-400 transition-colors"
            >
              <div className="relative h-56 bg-neutral-100">
                {post.cover ? (
                  <Image
                    src={post.cover}
                    alt={post.title}
                    fill
                    sizes="400px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-300 text-xs">
                    이미지 없음
                  </div>
                )}
              </div>
              <div className="p-3.5">
                <p className="text-xs text-muted mb-1.5">
                  {formatDate(post.date)}
                </p>
                <p className="text-lg font-medium leading-snug line-clamp-2">
                  {post.title}
                </p>
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] px-2 py-0.5 border border-line rounded text-neutral-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

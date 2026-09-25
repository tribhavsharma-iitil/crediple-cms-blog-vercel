"use client";

import { useMemo } from "react";
import DOMPurify from "isomorphic-dompurify";
import { extractHeadings, withHeadingIds } from "@/lib/toc";

export interface BlogPreviewPost {
  title: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string[];
  tags?: string[];
  categoryLabel?: string;
  status?: string;
  publishedAt?: string;
}

function formatDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function scrollToHeading(id: string) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Self-contained approximation of the live site's blog template, rendered
 * entirely from the in-progress editor state — no network calls, no shared
 * styling with the live-site repo. See BlogForm's "note" in the PR/task
 * description for which design tokens (fonts, colors, spacing) to confirm
 * against the real site for a closer match.
 */
export function BlogPreview({
  post,
  contentCharacterCount,
}: {
  post: BlogPreviewPost;
  contentCharacterCount: number;
}) {
  const headings = useMemo(
    () => extractHeadings(post.content || ""),
    [post.content],
  );
  const contentWithIds = useMemo(
    () => withHeadingIds(post.content || ""),
    [post.content],
  );
  const safeContent = useMemo(
    () => DOMPurify.sanitize(contentWithIds),
    [contentWithIds],
  );
  const coverImage = post.coverImageUrl?.[0];
  const dateLabel =
    post.status === "published" ? formatDate(post.publishedAt) : null;

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-panel text-ink shadow-2xl dark:border-white/8 dark:bg-[#030d1d] dark:text-[#f4f6fb] dark:shadow-black/20">
      {/* Breadcrumbs Header */}
      <div className="border-b border-line bg-ink/[0.02] px-4 py-3 sm:px-6 dark:border-white/8 dark:bg-white/[0.02]">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-xs text-ink/40 dark:text-white/40"
        >
          <span>Home</span>
          <span aria-hidden="true">/</span>
          <span>About</span>
          <span aria-hidden="true">/</span>
          <span>Blog</span>
          <span aria-hidden="true">/</span>
          <span className="text-ink/85 dark:text-white/85">
            {post.title || "Untitled post"}
          </span>
        </nav>
      </div>

      <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="space-y-5 rounded-2xl border border-line bg-ink/[0.03] p-5 sm:p-7 dark:border-white/8 dark:bg-black/20">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/50 dark:text-white/35">
              {post.categoryLabel ?? "Blog"}
            </p>
            <h1 className="max-w-4xl font-heading text-3xl font-semibold leading-[1.08] tracking-[-0.03em] text-ink sm:text-4xl lg:text-[3.25rem] dark:text-white">
              {post.title || "Untitled post"}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink/60 dark:text-white/45">
              <span>{dateLabel ?? "Not yet published"}</span>
              {post.tags?.length ? <span>{post.tags.join(" / ")}</span> : null}
            </div>

            {post.excerpt && (
              <p className="max-w-4xl text-base leading-8 text-ink/80 sm:text-lg dark:text-white/75">
                {post.excerpt}
              </p>
            )}
          </div>

          {coverImage && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-ink/5 dark:border-white/8 dark:bg-black/30">
              <img
                src={coverImage}
                alt={
                  post.title ? `${post.title} cover image` : "Blog cover image"
                }
                className="h-[22rem] w-full object-cover sm:h-[28rem]"
              />
            </div>
          )}

          <div className="mt-8 grid gap-8 lg:grid-cols-[21rem_minmax(0,1fr)]">
            {headings.length > 0 && (
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <nav
                  aria-label="Table of contents"
                  className="rounded-2xl border border-line bg-ink/[0.02] p-5 dark:border-white/8 dark:bg-black/20"
                >
                  <p className="text-2xl font-medium tracking-[-0.02em] text-ink dark:text-white">
                    Table of contents
                  </p>
                  <ol className="mt-6 space-y-2">
                    {headings.map((item) => (
                      <li
                        key={item.id}
                        className={item.level === 3 ? "pl-4" : undefined}
                      >
                        <button
                          type="button"
                          onClick={() => scrollToHeading(item.id)}
                          className="block text-left text-sm leading-6 text-ink/70 transition-colors hover:text-accent hover:underline dark:text-white/70 dark:hover:text-[#4f80ff]"
                        >
                          {item.text}
                        </button>
                      </li>
                    ))}
                  </ol>
                </nav>
              </aside>
            )}

            <div
              className={`min-w-0 overflow-hidden rounded-2xl border border-line bg-panel p-5 sm:p-7 dark:border-white/8 dark:bg-black/15 ${
                headings.length === 0 ? "lg:col-span-2" : ""
              }`}
            >
              {contentCharacterCount > 0 ? (
                <div
                  className="prose prose-lg max-w-none break-words text-ink/88
                    prose-headings:font-heading prose-headings:text-ink
                    prose-p:text-ink/88 prose-li:text-ink/88 prose-strong:text-ink
                    prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                    dark:prose-invert
                    dark:prose-headings:text-white
                    dark:prose-p:text-white/88 dark:prose-li:text-white/88 dark:prose-strong:text-white
                    dark:prose-a:text-[#4f80ff]"
                  dangerouslySetInnerHTML={{ __html: safeContent }}
                />
              ) : (
                <p className="text-ink/45 dark:text-white/45">
                  Your post preview will appear here as you write.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { RequirePermission } from "@/components/RequirePermission";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/Input";
import { buttonVariants } from "@/components/ui/Button";
import { useAuth } from "@/components/AuthProvider";
import { usePaginatedBlogs } from "@/hooks/useBlogs";
import { BlogStatus } from "@/lib/mock-db";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

const FILTERS: { label: string; value: BlogStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Draft", value: "draft" },
  { label: "In review", value: "submitted_for_review" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Published", value: "published" },
];

function BlogsSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-xl border border-line bg-panel"
      aria-label="Loading blogs"
      aria-busy="true"
    >
      <div className="h-11 animate-pulse border-b border-line bg-ink/5" />
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className="flex h-16 items-center gap-5 border-b border-line px-4 last:border-b-0"
        >
          <div className="h-4 w-2/5 animate-pulse rounded bg-ink/5" />
          <div className="h-4 w-24 animate-pulse rounded bg-ink/5" />
          <div className="h-4 w-20 animate-pulse rounded bg-ink/5" />
        </div>
      ))}
    </div>
  );
}

export default function BlogsPage() {
  return (
    <AuthenticatedShell>
      <Suspense fallback={<BlogsSkeleton />}>
        <BlogsContent />
      </Suspense>
    </AuthenticatedShell>
  );
}

function BlogsContent() {
  const { activeCompanyId, hasPermission } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const status = (searchParams.get("status") ?? "") as BlogStatus | "";
  const { data, isLoading } = usePaginatedBlogs(
    activeCompanyId,
    status,
    page,
    10,
    search,
  );
  const blogs = data?.blogs ?? [];
  const pagination = data?.pagination;
  function changeFilter(value: BlogStatus | "") {
    setPage(1);
    router.push(value ? `/blogs?status=${value}` : "/blogs");
  }
  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Blogs</h1>
          <p className="mt-1 text-sm text-ink/70">
            {hasPermission("blog.create")
              ? "Create, review, and publish your content."
              : "Browse posts that are available for review."}
          </p>
        </div>
        <RequirePermission permission="blog.create">
          <Link
            href="/blogs/new"
            className={buttonVariants({ variant: "primary" })}
          >
            Create Blog
          </Link>
        </RequirePermission>
      </div>
      <div className="sticky top-14 z-10 -mx-4 mb-5 border-y border-line bg-canvas/95 px-4 py-3 backdrop-blur-sm sm:mx-0 sm:px-0">
        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-max gap-1.5">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => changeFilter(filter.value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent/40",
                  status === filter.value
                    ? "bg-ink text-canvas"
                    : "border border-line bg-panel text-ink/70 hover:border-accent hover:text-ink",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 max-w-md">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search this page"
            aria-label="Search blogs on this page"
          />
        </div>
      </div>
      {isLoading ? (
        <BlogsSkeleton />
      ) : blogs.length === 0 ? (
        <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-line bg-panel px-4 py-8 text-center">
          <FileText className="mb-3 h-7 w-7 text-ink/60" />
          <p className="text-sm font-medium text-ink">No blogs found</p>
          <p className="mt-1 text-sm text-ink/70">
            Try a different search or filter, or create a new post.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-panel">
          <table className="w-full min-w-[860px] table-fixed text-left text-sm">
            <thead className="border-b border-line bg-ink/[0.03] text-xs font-medium uppercase tracking-wide text-ink/70">
              <tr>
                <th scope="col" className="w-[48%] px-5 py-3">
                  Title
                </th>
                <th scope="col" className="w-[22%] px-5 py-3">
                  Tags
                </th>
                <th scope="col" className="w-[18%] px-5 py-3">
                  Status
                </th>
                <th scope="col" className="w-[12%] px-5 py-3">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr
                  key={blog.id}
                  className="group border-b border-line last:border-b-0 hover:bg-ink/[0.03]"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/blogs/${blog.id}`}
                      className="block rounded focus-visible:ring-2 focus-visible:ring-accent/40"
                    >
                      <p className="line-clamp-1 font-medium text-ink group-hover:text-accent">
                        {blog.title}
                      </p>
                      {blog.excerpt && (
                        <p className="mt-1 line-clamp-1 text-xs text-ink/70">
                          {blog.excerpt}
                        </p>
                      )}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-ink/70">
                    <span className="block truncate">
                      {blog.tags.join(", ") || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={blog.status} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-xs text-ink/70">
                    {new Date(blog.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!isLoading && pagination && pagination.totalPages > 1 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink/70">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(
              pagination.page * pagination.limit,
              pagination.totalItems,
            )}{" "}
            of {pagination.totalItems} blogs
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={pagination.page <= 1}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              Previous
            </button>
            <span className="px-2 text-sm text-ink/70">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((current) =>
                  Math.min(pagination.totalPages, current + 1),
                )
              }
              disabled={pagination.page >= pagination.totalPages}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}

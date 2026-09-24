"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { RequirePermission } from "@/components/RequirePermission";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { buttonVariants } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/components/AuthProvider";
import { usePaginatedBlogs } from "@/hooks/useBlogs";
import { useDebounce } from "@/hooks/useDebounce";
import { BlogStatus } from "@/lib/mock-db";
import type { Blog } from "@/lib/mock-db";
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

const COLUMNS: TableColumn<Blog>[] = [
  {
    key: "title",
    header: "Title",
    headerClassName: "w-[48%]",
    cellClassName: "w-[48%]",
    render: (blog) => (
      <Link
        href={`/blogs/${blog.id}`}
        className="block rounded focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <p className="line-clamp-1 font-medium text-ink group-hover:text-accent">
          {blog.title}
        </p>
        {blog.excerpt && (
          <p className="mt-1 line-clamp-1 text-xs text-ink/70">{blog.excerpt}</p>
        )}
      </Link>
    ),
  },
  {
    key: "tags",
    header: "Tags",
    headerClassName: "w-[22%]",
    cellClassName: "w-[22%] text-xs text-ink/70",
    render: (blog) => <span className="block truncate">{blog.tags.join(", ") || "—"}</span>,
  },
  {
    key: "status",
    header: "Status",
    headerClassName: "w-[18%]",
    cellClassName: "w-[18%]",
    render: (blog) => <StatusBadge status={blog.status} />,
  },
  {
    key: "updated",
    header: "Updated",
    headerClassName: "w-[12%]",
    cellClassName: "w-[12%] whitespace-nowrap text-xs text-ink/70",
    render: (blog) => new Date(blog.updatedAt).toLocaleDateString(),
  },
];

export default function BlogsPage() {
  return (
    <AuthenticatedShell>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl border border-line bg-panel" />}>
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
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(1);
  const status = (searchParams.get("status") ?? "") as BlogStatus | "";
  const { data, isLoading } = usePaginatedBlogs(
    activeCompanyId,
    status,
    page,
    10,
    debouncedSearch,
  );
  const blogs = data?.blogs ?? [];
  const pagination = data?.pagination;
  function changeFilter(value: BlogStatus | "") {
    setPage(1);
    router.push(value ? `/blogs?status=${value}` : "/blogs");
  }
  const [prevSearch, setPrevSearch] = useState(debouncedSearch);
  if (debouncedSearch !== prevSearch) {
    setPrevSearch(debouncedSearch);
    setPage(1);
  }
  return (
    <>
      <PageHeader
        title="Blogs"
        description={
          hasPermission("blog.create")
            ? "Create, review, and publish your content."
            : "Browse posts that are available for review."
        }
        actions={
          <RequirePermission permission="blog.create">
            <Link
              href="/blogs/new"
              className={buttonVariants({ variant: "primary" })}
            >
              Create Blog
            </Link>
          </RequirePermission>
        }
      />
      <div className="sticky top-14 z-10 -mx-4 mb-5 border-y border-line bg-gray-50 dark:bg-transparent px-4 py-3 backdrop-blur-sm sm:mx-0 sm:px-0">
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
            placeholder="Search all blogs"
            aria-label="Search all blogs"
          />
        </div>
      </div>
      <Table
        columns={COLUMNS}
        data={blogs}
        getRowKey={(blog) => blog.id}
        isLoading={isLoading}
        minWidth="860px"
        tableFixed
        emptyMessage={
          <EmptyState
            icon={FileText}
            title="No blogs found"
            description="Try a different search or filter, or create a new post."
          />
        }
      />
      {!isLoading && pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          limit={pagination.limit}
          onPageChange={setPage}
          itemLabel="blogs"
        />
      )}
    </>
  );
}

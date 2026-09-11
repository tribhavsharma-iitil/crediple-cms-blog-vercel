"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { useClientPagination } from "@/hooks/useClientPagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useBlogs } from "@/hooks/useBlogs";
import type { Blog } from "@/lib/mock-db";

const COLUMNS: TableColumn<Blog>[] = [
  {
    key: "title",
    header: "Title",
    render: (blog) => (
      <Link
        href={`/blogs/${blog.id}`}
        className="block rounded focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <p className="truncate text-sm font-medium text-ink group-hover:text-accent">
          {blog.title}
        </p>
      </Link>
    ),
  },
  {
    key: "approved",
    header: "Approved",
    cellClassName: "whitespace-nowrap text-xs text-ink/50",
    render: (blog) => new Date(blog.updatedAt).toLocaleDateString(),
  },
  {
    key: "action",
    header: "",
    cellClassName: "text-right",
    render: (blog) => (
      <Link href={`/blogs/${blog.id}`} className="text-xs font-medium text-accent">
        Publish →
      </Link>
    ),
  },
];

export default function PublishQueuePage() {
  const { activeCompanyId } = useAuth();
  const { data: blogs = [], isLoading } = useBlogs(
    activeCompanyId,
    "approved",
  );
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const filteredBlogs = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return blogs;
    return blogs.filter((blog) =>
      `${blog.title} ${blog.excerpt} ${blog.tags.join(" ")}`.toLowerCase().includes(term),
    );
  }, [blogs, debouncedSearch]);

  const { page, setPage, totalPages, totalItems, limit, pageItems } = useClientPagination(
    filteredBlogs,
    10,
    debouncedSearch,
  );

  return (
    <AuthenticatedShell>
      <PageHeader title="Publish queue" description="Approved posts ready to go live." />

      <div className="mb-5 max-w-md">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search all posts ready to publish"
          aria-label="Search all posts ready to publish"
        />
      </div>

      <Table
        columns={COLUMNS}
        data={pageItems}
        getRowKey={(blog) => blog.id}
        isLoading={isLoading}
        emptyMessage={
          <EmptyState
            icon={Send}
            title="Nothing ready to publish"
            description="Approved posts will appear here when they are ready."
          />
        }
      />

      {!isLoading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={limit}
          onPageChange={setPage}
          itemLabel="posts"
        />
      )}
    </AuthenticatedShell>
  );
}

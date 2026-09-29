"use client";

import { useMemo, useState } from "react";
import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { useAuth } from "@/components/AuthProvider";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { useAuditLogs, type AuditLogRow } from "@/hooks/useAuditLogs";
import { useBlogs } from "@/hooks/useBlogs";
import { useDebounce } from "@/hooks/useDebounce";

const PAGE_SIZE = 10;

function formatAction(action: string) {
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AuditLogsPage() {
  const { activeCompanyId, user } = useAuth();
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const canFilterByCompany = user?.role?.key === "super_admin";

  const queryCompanyId = canFilterByCompany
    ? activeCompanyId
    : (user?.companyIds[0] ?? activeCompanyId);
  const { data, isLoading, error } = useAuditLogs(queryCompanyId, {
    page,
    limit: PAGE_SIZE,
    entityType,
    action,
    search: debouncedSearch,
  });

  const [prevSearch, setPrevSearch] = useState(debouncedSearch);
  if (debouncedSearch !== prevSearch) {
    setPrevSearch(debouncedSearch);
    setPage(1);
  }
  // The audit-log API only returns entity ids, not titles — cross-reference
  // against the company's blogs so "blog" rows can show a name.
  const { data: blogs } = useBlogs(queryCompanyId, "");
  const blogTitleById = useMemo(
    () => new Map((blogs ?? []).map((blog) => [blog.id, blog.title])),
    [blogs],
  );

  const logs = data?.logs ?? [];
  const pagination = data?.pagination ?? {
    page,
    limit: PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
  };

  const actions = useMemo(
    () => [
      "create",
      "edit",
      "submit_review",
      "approve_review",
      "reject_review",
      "publish",
      "unpublish",
    ],
    [],
  );

  const columns: TableColumn<AuditLogRow>[] = useMemo(
    () => [
      {
        key: "action",
        header: "Action",
        render: (log) => (
          <span className="font-medium text-ink">
            {formatAction(log.action)}
          </span>
        ),
        sortable: true,
        sortValue: (log) => log.action,
      },
      {
        key: "entity",
        header: "Entity",
        cellClassName: "text-ink/70",
        render: (log) => (
          <div className="flex flex-col gap-0.5">
            <span className="capitalize">{log.entityType}</span>
            <span className="font-mono text-xs text-ink/50">
              {log.entityId}
            </span>
          </div>
        ),
      },
      {
        key: "blog",
        header: "Blog",
        cellClassName: "text-ink/70",
        render: (log) =>
          log.entityType === "blog" ? (
            (log.entityName ??
            blogTitleById.get(log.entityId) ?? (
              <span className="text-xs text-ink/50">—</span>
            ))
          ) : (
            <span className="text-xs text-ink/50">—</span>
          ),
        sortable: true,
        sortValue: (log) =>
          log.entityName ?? blogTitleById.get(log.entityId) ?? "",
      },
      {
        key: "user",
        header: "User",
        cellClassName: "text-ink/70",
        render: (log) => (
          <div className="flex flex-col gap-0.5">
            <span>
              {[log.user?.firstName, log.user?.lastName]
                .filter(Boolean)
                .join(" ") ||
                log.user?.email ||
                log.userId}
            </span>
            <span className="font-mono text-xs text-ink/50">
              {log.user?.role ?? "User"}
            </span>
          </div>
        ),
        sortable: true,
        sortValue: (log) =>
          [log.user?.firstName, log.user?.lastName].filter(Boolean).join(" ") ||
          log.user?.email ||
          log.userId,
      },
      {
        key: "status",
        header: "Status",
        cellClassName: "text-ink/70",
        render: (log) =>
          log.fromStatus && log.toStatus ? (
            <span className="font-mono text-xs">
              {log.fromStatus} → {log.toStatus}
            </span>
          ) : (
            <span className="text-xs text-ink/50">—</span>
          ),
        sortable: true,
        sortValue: (log) => log.toStatus,
      },
      {
        key: "comment",
        header: "Comment",
        cellClassName: "text-ink/70",
        render: (log) => (
          <span className="line-clamp-2">{log.comment || "—"}</span>
        ),
      },
      {
        key: "created",
        header: "Created",
        cellClassName: "whitespace-nowrap text-xs text-ink/70",
        render: (log) => new Date(log.createdAt).toLocaleString(),
        sortable: true,
        sortValue: (log) => new Date(log.createdAt)?.getTime(),
      },
    ],
    [blogTitleById],
  );

  return (
    <AuthenticatedShell>
      <PageHeader
        title="Audit log"
        description="Every workflow action, in order."
        actions={
          <div className="text-sm text-ink/50">
            {pagination.totalItems} total entries
          </div>
        }
      />

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-status-rejected/20 bg-status-rejected/10 px-3 py-2 text-sm text-status-rejected"
        >
          {error instanceof Error
            ? error.message
            : "Could not load audit logs."}
        </p>
      )}

      <div className="sticky top-14 z-10 mb-5 -mx-4 border-y border-line bg-canvas/95 px-4 py-3 backdrop-blur-sm sm:mx-0 sm:px-0">
        <div className="flex flex-wrap gap-3">
          <select
            value={entityType}
            onChange={(event) => {
              setEntityType(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          >
            <option value="">All entities</option>
            <option value="blog">Blog</option>
            <option value="user">User</option>
            <option value="company">Company</option>
          </select>
          <select
            value={action}
            onChange={(event) => {
              setAction(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          >
            <option value="">All actions</option>
            {actions.map((item) => (
              <option key={item} value={item}>
                {formatAction(item)}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 max-w-md">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search all audit log entries"
            aria-label="Search all audit log entries"
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={logs}
        getRowKey={(log) => log.id}
        isLoading={isLoading}
        skeletonRows={PAGE_SIZE}
        minWidth="960px"
        emptyMessage="No audit activity found."
      />

      {!isLoading && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          limit={pagination.limit}
          onPageChange={setPage}
          itemLabel="entries"
        />
      )}
    </AuthenticatedShell>
  );
}

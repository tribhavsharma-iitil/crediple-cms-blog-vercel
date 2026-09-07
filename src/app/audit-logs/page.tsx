"use client";

import { useMemo, useState } from "react";
import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { useAuth } from "@/components/AuthProvider";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { useBlogs } from "@/hooks/useBlogs";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

function formatAction(action: string) {
  return action.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AuditLogsPage() {
  const { activeCompanyId, user } = useAuth();
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const canFilterByCompany = user?.role?.key === "super_admin";

  const queryCompanyId = canFilterByCompany
    ? activeCompanyId
    : (user?.companyIds[0] ?? activeCompanyId);
  const { data, isLoading, error } = useAuditLogs(queryCompanyId, {
    page,
    limit: PAGE_SIZE,
    entityType,
    action,
  });
  // The audit-log API only returns entity ids, not titles — cross-reference
  // against the company's blogs so "blog" rows can show a name.
  const { data: blogs } = useBlogs(queryCompanyId, "");
  const blogTitleById = useMemo(() => new Map((blogs ?? []).map((blog) => [blog.id, blog.title])), [blogs]);

  const logs = data?.logs ?? [];
  const pagination = data?.pagination ?? { page, limit: PAGE_SIZE, totalItems: 0, totalPages: 1 };
  const displayTotalPages = Math.max(1, pagination.totalPages);

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
    []
  );

  return (
    <AuthenticatedShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Audit log</h1>
          <p className="mt-1 text-sm text-ink/60">Every workflow action, in order.</p>
        </div>
        <div className="text-sm text-ink/50">
          {pagination.totalItems} total entries
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-status-rejected/20 bg-status-rejected/10 px-3 py-2 text-sm text-status-rejected">
          {error instanceof Error ? error.message : "Could not load audit logs."}
        </p>
      )}

      <div className="sticky top-14 z-10 mb-5 -mx-4 border-y border-line bg-canvas/95 px-4 py-3 backdrop-blur-sm sm:mx-0 sm:px-0">
        <div className="flex flex-wrap gap-3">
          <select value={entityType} onChange={(event) => { setEntityType(event.target.value); setPage(1); }} className="rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-accent">
            <option value="">All entities</option>
            <option value="blog">Blog</option>
            <option value="user">User</option>
            <option value="company">Company</option>
          </select>
          <select value={action} onChange={(event) => { setAction(event.target.value); setPage(1); }} className="rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-accent">
            <option value="">All actions</option>
            {actions.map((item) => (
              <option key={item} value={item}>
                {formatAction(item)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-panel">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full text-left text-sm">
            <thead className="border-b border-line bg-ink/[0.03] text-xs font-medium uppercase tracking-wide text-ink/70">
              <tr>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Entity</th>
                <th className="px-5 py-3">Blog</th>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Comment</th>
                <th className="px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, index) => (
                  <tr key={index} className="border-b border-line last:border-b-0">
                    <td className="px-5 py-4" colSpan={7}>
                      <div className="h-4 w-full animate-pulse rounded bg-ink/5" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-ink/50">
                    No audit activity found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className={cn("border-b border-line last:border-b-0", "hover:bg-ink/[0.02]")}>
                    <td className="px-5 py-4">
                      <span className="font-medium text-ink">{formatAction(log.action)}</span>
                    </td>
                    <td className="px-5 py-4 text-ink/70">
                      <div className="flex flex-col gap-0.5">
                        <span className="capitalize">{log.entityType}</span>
                        <span className="font-mono text-xs text-ink/45">{log.entityId}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-ink/70">
                      {log.entityType === "blog"
                        ? log.entityName ??
                          blogTitleById.get(log.entityId) ?? (
                            <span className="text-xs text-ink/45">—</span>
                          )
                        : <span className="text-xs text-ink/45">—</span>}
                    </td>
                    <td className="px-5 py-4 text-ink/70">
                      <div className="flex flex-col gap-0.5">
                        <span>{[log.user?.firstName, log.user?.lastName].filter(Boolean).join(" ") || log.user?.email || log.userId}</span>
                        <span className="font-mono text-xs text-ink/45">{log.user?.role ?? "User"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-ink/70">
                      {log.fromStatus && log.toStatus ? (
                        <span className="font-mono text-xs">
                          {log.fromStatus} → {log.toStatus}
                        </span>
                      ) : (
                        <span className="text-xs text-ink/45">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-ink/70">
                      <span className="line-clamp-2">{log.comment || "—"}</span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-ink/60">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
          <p className="text-sm text-ink/55">
            Page {pagination.page} of {displayTotalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || isLoading}
              className="rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={page >= pagination.totalPages || isLoading}
              className="rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </AuthenticatedShell>
  );
}

"use client";

import Link from "next/link";
import { ClipboardCheck, FileText, Send } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { activeCompanyId, user, hasPermission } = useAuth();
  const {
    data: summary,
    isLoading,
    error,
  } = useDashboardSummary(activeCompanyId);

  return (
    <AuthenticatedShell>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.name.split(" ")[0] ?? ""}.`}
      />
      {error && (
        <p
          role="alert"
          className="mb-6 rounded-lg border border-status-rejected/20 bg-status-rejected/10 px-3 py-2 text-sm text-status-rejected"
        >
          {error instanceof Error
            ? error.message
            : "Could not load the dashboard summary."}
        </p>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={FileText}
          iconClassName="bg-status-draft/10 text-status-draft"
          label="Drafts"
          value={summary?.draftCount}
          href="/blogs?status=draft"
          loading={isLoading}
        />
        <StatCard
          icon={ClipboardCheck}
          iconClassName="bg-status-review/10 text-status-review"
          label="Awaiting review"
          value={summary?.pendingReviewCount}
          href="/review"
          loading={isLoading}
        />
        <StatCard
          icon={Send}
          iconClassName="bg-status-approved/10 text-status-approved"
          label="Awaiting publish"
          value={summary?.pendingPublishCount}
          href="/publish"
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-ink/70">Recently published</h2>
            <Link href="/blogs?status=published" className="text-xs font-medium text-accent hover:underline">
              View all
            </Link>
          </div>
          <Card className="divide-y divide-line overflow-hidden">
            {summary?.recentlyPublished.length ? (
              summary.recentlyPublished.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-ink/[0.02]"
                >
                  <Link
                    href={`/blogs/${b.id}`}
                    title={b.title}
                    className="min-w-0 flex-1 truncate hover:text-accent"
                  >
                    {b.title}
                  </Link>
                  <span className="font-mono text-xs text-ink/50">
                    {b.publishedAt
                      ? new Date(b.publishedAt).toLocaleDateString()
                      : ""}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-5 py-10 text-center text-sm text-ink/50">
                Nothing published yet.
              </div>
            )}
          </Card>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-ink/70">Recent activity</h2>
            {hasPermission("audit.view_company") && (
              <Link href="/audit-logs" className="text-xs font-medium text-accent hover:underline">
                View all
              </Link>
            )}
          </div>
          <Card className="divide-y divide-line overflow-hidden">
            {summary?.recentActivity.length ? (
              summary.recentActivity.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-ink/[0.02]"
                >
                  <span
                    className="min-w-0 flex-1 truncate capitalize"
                    title={l.blogTitle}
                  >
                    {l.action.replace(/_/g, " ")}
                    {l.blogTitle ? `: ${l.blogTitle}` : ""}
                  </span>
                  <span className="font-mono text-xs text-ink/50">
                    {new Date(l.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-5 py-10 text-center text-sm text-ink/50">
                No activity yet.
              </div>
            )}
          </Card>
        </section>
      </div>
    </AuthenticatedShell>
  );
}

function StatCard({
  icon: Icon,
  iconClassName,
  label,
  value,
  href,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  label: string;
  value?: number;
  href: string;
  loading?: boolean;
}) {
  return (
    <Card hover className="overflow-hidden p-0">
      <Link href={href} className="flex items-center gap-4 px-5 py-4">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconClassName)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          {loading ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <p className="font-mono text-2xl font-semibold text-ink">{value ?? "—"}</p>
          )}
          <p className="mt-0.5 truncate text-sm text-ink/70">{label}</p>
        </div>
      </Link>
    </Card>
  );
}

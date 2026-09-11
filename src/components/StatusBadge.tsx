import { Badge } from "@/components/ui/Badge";
import { BlogStatus } from "@/lib/mock-db";

const CONFIG: Record<BlogStatus, { label: string; dot: string }> = {
  draft: { label: "Draft", dot: "bg-status-draft" },
  submitted_for_review: { label: "In review", dot: "bg-status-review" },
  approved: { label: "Approved", dot: "bg-status-approved" },
  rejected: { label: "Rejected", dot: "bg-status-rejected" },
  published: { label: "Published", dot: "bg-status-published" },
};

export function StatusBadge({ status }: { status: BlogStatus }) {
  const config = CONFIG[status];
  return (
    <Badge className="min-w-[6.75rem] justify-center font-mono" dotClassName={config.dot}>
      {config.label}
    </Badge>
  );
}

import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center px-4 py-8 text-center">
      {Icon && <Icon className="mb-3 h-7 w-7 text-ink/35" aria-hidden="true" />}
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="mt-1 text-sm text-ink/50">{description}</p>}
    </div>
  );
}

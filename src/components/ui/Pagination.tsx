"use client";

import { buttonVariants } from "@/components/ui/Button";

export interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  isLoading?: boolean;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  itemLabel = "items",
  isLoading = false,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalItems);

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-ink/70">
        Showing {start}–{end} of {totalItems} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1 || isLoading}
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          Previous
        </button>
        <span className="px-2 text-sm text-ink/70">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages || isLoading}
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          Next
        </button>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";

export function useClientPagination<T>(items: T[], pageSize = 10, resetKey?: unknown) {
  const [page, setPage] = useState(1);
  const [prevResetKey, setPrevResetKey] = useState(resetKey);

  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setPage(1);
  }

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pageItems = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize],
  );

  return {
    page: currentPage,
    setPage,
    totalPages,
    totalItems,
    limit: pageSize,
    pageItems,
  };
}

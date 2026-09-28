"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface TableColumn<T> {
  key: string;
  header: React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  render: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number | Date | null | undefined;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  getRowKey: (row: T, index: number) => string;
  isLoading?: boolean;
  skeletonRows?: number;
  emptyMessage?: React.ReactNode;
  minWidth?: string;
  tableFixed?: boolean;
}

type SortDirection = "asc" | "desc" | null;

export function Table<T>({
  columns,
  data,
  getRowKey,
  isLoading = false,
  skeletonRows = 8,
  emptyMessage = "No results found.",
  minWidth,
  tableFixed = false,
}: TableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);

  function handleSort(column: TableColumn<T>) {
    if (!column.sortable || !column.sortValue) return;

    if (sortKey !== column.key) {
      setSortKey(column.key);
      setSortDirection("asc");
      return;
    }

    if (sortDirection === "asc") {
      setSortDirection("desc");
      return;
    }

    setSortKey(null);
    setSortDirection(null);
  }

  const sortedData = React.useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    const column = columns.find((item) => item.key === sortKey);

    if (!column?.sortValue) return data;

    return [...data].sort((a, b) => {
      const aValue = column.sortValue!(a);
      const bValue = column.sortValue!(b);

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      const aComparable = aValue instanceof Date ? aValue.getTime() : aValue;
      const bComparable = bValue instanceof Date ? bValue.getTime() : bValue;

      if (typeof aComparable === "number" && typeof bComparable === "number") {
        return sortDirection === "asc"
          ? aComparable - bComparable
          : bComparable - aComparable;
      }

      const comparison = String(aComparable).localeCompare(
        String(bComparable),
        undefined,
        { numeric: true, sensitivity: "base" },
      );

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, columns, sortKey, sortDirection]);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel">
      <div className="overflow-x-auto">
        <table
          className={cn(
            "w-full text-left text-sm",
            tableFixed && "table-fixed",
          )}
          style={minWidth ? { minWidth } : undefined}
        >
          <thead className="border-b border-line bg-ink/[0.03] text-xs font-medium uppercase tracking-wide text-ink/70">
            <tr>
              {columns.map((column) => {
                const isSorted = sortKey === column.key;

                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn("px-5 py-3", column.headerClassName)}
                  >
                    {column.sortable ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort(column)}
                        className="h-auto px-0 py-0 text-xs font-medium uppercase tracking-wide"
                        aria-label={`Sort by ${String(column.header)}`}
                      >
                        {column.header}

                        {isSorted && sortDirection === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : isSorted && sortDirection === "desc" ? (
                          <ArrowDown
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        ) : (
                          <ChevronsUpDown
                            className="h-3.5 w-3.5 opacity-50"
                            aria-hidden="true"
                          />
                        )}
                      </Button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, index) => (
                <tr
                  key={index}
                  className="border-b border-line last:border-b-0"
                >
                  <td className="px-5 py-4" colSpan={columns.length}>
                    <div className="h-4 w-full animate-pulse rounded bg-ink/5" />
                  </td>
                </tr>
              ))
            ) : sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-10 text-center text-sm text-ink/50"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <tr
                  key={getRowKey(row, index)}
                  className="group border-b border-line last:border-b-0 hover:bg-ink/[0.03]"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn("px-5 py-3.5", column.cellClassName)}
                    >
                      {column.render(row, index)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TableColumn<T> {
  key: string;
  header: React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  render: (row: T, index: number) => React.ReactNode;
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
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel">
      <div className="overflow-x-auto">
        <table
          className={cn("w-full text-left text-sm", tableFixed && "table-fixed")}
          style={minWidth ? { minWidth } : undefined}
        >
          <thead className="border-b border-line bg-ink/[0.03] text-xs font-medium uppercase tracking-wide text-ink/70">
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={cn("px-5 py-3", column.headerClassName)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, index) => (
                <tr key={index} className="border-b border-line last:border-b-0">
                  <td className="px-5 py-4" colSpan={columns.length}>
                    <div className="h-4 w-full animate-pulse rounded bg-ink/5" />
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-sm text-ink/50">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={getRowKey(row, index)}
                  className="group border-b border-line last:border-b-0 hover:bg-ink/[0.03]"
                >
                  {columns.map((column) => (
                    <td key={column.key} className={cn("px-5 py-3.5", column.cellClassName)}>
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

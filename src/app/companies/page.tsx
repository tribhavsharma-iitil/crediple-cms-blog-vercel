"use client";

import { useMemo, useState } from "react";
import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { useAuth } from "@/components/AuthProvider";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { useClientPagination } from "@/hooks/useClientPagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useCompanies, type CompanyRow } from "@/hooks/useCompanies";

const COLUMNS: TableColumn<CompanyRow>[] = [
  {
    key: "name",
    header: "Name",
    cellClassName: "font-medium text-ink",
    render: (company) => company.name,
  },
  {
    key: "id",
    header: "ID",
    cellClassName: "font-mono text-xs text-ink/60",
    render: (company) => company.id,
  },
  {
    key: "created",
    header: "Created",
    cellClassName: "text-xs text-ink/70",
    render: (company) => (company.createdAt ? new Date(company.createdAt).toLocaleString() : "—"),
  },
  {
    key: "updated",
    header: "Updated",
    cellClassName: "text-xs text-ink/70",
    render: (company) => (company.updatedAt ? new Date(company.updatedAt).toLocaleString() : "—"),
  },
];

export default function CompaniesPage() {
  const { hasPermission } = useAuth();
  const { data: companies = [], isLoading, error } = useCompanies();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const filteredCompanies = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter(
      (company) =>
        company.name.toLowerCase().includes(term) || company.id.toLowerCase().includes(term),
    );
  }, [companies, debouncedSearch]);

  const { page, setPage, totalPages, totalItems, limit, pageItems } = useClientPagination(
    filteredCompanies,
    10,
    debouncedSearch,
  );

  if (!hasPermission("company.manage")) {
    return (
      <AuthenticatedShell>
        <p className="text-sm text-status-rejected">You do not have access to this page.</p>
      </AuthenticatedShell>
    );
  }

  return (
    <AuthenticatedShell>
      <PageHeader title="Companies" description="All companies available to the workspace." />

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-status-rejected/20 bg-status-rejected/10 px-3 py-2 text-sm text-status-rejected">
          {error instanceof Error ? error.message : "Could not load companies."}
        </p>
      )}

      <div className="mb-5 max-w-md">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search all companies"
          aria-label="Search all companies"
        />
      </div>

      <Table
        columns={COLUMNS}
        data={pageItems}
        getRowKey={(company) => company.id}
        isLoading={isLoading}
        emptyMessage="No companies found."
      />

      {!isLoading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={limit}
          onPageChange={setPage}
          itemLabel="companies"
        />
      )}
    </AuthenticatedShell>
  );
}

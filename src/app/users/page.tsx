"use client";

import { useMemo, useState } from "react";
import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { useClientPagination } from "@/hooks/useClientPagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useUsers, type UserRow } from "@/hooks/useUsers";

function renderRole(role: unknown) {
  if (typeof role === "string") return role;
  if (role && typeof role === "object" && "label" in role) {
    const label = (role as { label?: string }).label;
    return label || "—";
  }
  return "—";
}

const COLUMNS: TableColumn<UserRow>[] = [
  {
    key: "name",
    header: "Name",
    render: (user) => (
      <div>
        <p className="text-sm font-medium text-ink">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-xs text-ink/50">{user.email}</p>
      </div>
    ),
    sortable: true,
    sortValue: (user) => user?.firstName?.toLowerCase(),
  },
  {
    key: "role",
    header: "Role",
    render: (user) => (
      <Badge variant="outline" className="font-mono">
        {renderRole(user.role)}
      </Badge>
    ),
    sortable: true,
    sortValue: (user) => renderRole(user.role)?.toLowerCase(),
  },
];

export default function UsersPage() {
  const { data: users = [], isLoading } = useUsers();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const filteredUsers = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      `${user.name} ${user.email} ${renderRole(user.role)}`.toLowerCase().includes(term),
    );
  }, [users, debouncedSearch]);

  const { page, setPage, totalPages, totalItems, limit, pageItems } = useClientPagination(
    filteredUsers,
    10,
    debouncedSearch,
  );

  return (
    <AuthenticatedShell>
      <PageHeader title="Users" description="People with access to this workspace." />

      <div className="mb-5 max-w-md">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search all users"
          aria-label="Search all users"
        />
      </div>

      <Table
        columns={COLUMNS}
        data={pageItems}
        getRowKey={(user) => user.id}
        isLoading={isLoading}
        emptyMessage="No users found."
      />

      {!isLoading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={limit}
          onPageChange={setPage}
          itemLabel="users"
        />
      )}
    </AuthenticatedShell>
  );
}

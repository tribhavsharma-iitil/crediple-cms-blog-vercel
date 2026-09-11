"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: { id?: string; key?: string; label: string } | string | null;
}

type UsersResponse =
  | {
      status?: number;
      message?: string;
      data?: UserRow[] | { users?: UserRow[]; data?: UserRow[] };
      users?: UserRow[];
    }
  | UserRow[];

function normalizeUsersResponse(response: UsersResponse) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (response.data && !Array.isArray(response.data)) {
    return response.data.users ?? response.data.data ?? [];
  }
  if (Array.isArray(response.users)) return response.users;
  return [];
}

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: async () =>
      normalizeUsersResponse(await api.get<UsersResponse>("/api/v1/users")),
  });
}

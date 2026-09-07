"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export interface DashboardSummary {
  draftCount: number;
  pendingReviewCount: number;
  pendingPublishCount: number;
  recentlyPublished: { id: string; title: string; publishedAt?: string }[];
  recentActivity: {
    id: string;
    action: string;
    createdAt: string;
    entityId: string;
    blogTitle?: string;
  }[];
}

type DashboardSummaryResponse =
  | DashboardSummary
  | { status: number; message: string; data: DashboardSummary };

function normalizeDashboardSummary(
  response: DashboardSummaryResponse,
): DashboardSummary {
  const summary = "data" in response ? response.data : response;
  return {
    draftCount: summary.draftCount ?? 0,
    pendingReviewCount: summary.pendingReviewCount ?? 0,
    pendingPublishCount: summary.pendingPublishCount ?? 0,
    recentlyPublished: summary.recentlyPublished ?? [],
    recentActivity: summary.recentActivity ?? [],
  };
}

export function useDashboardSummary(
  companyId: string | null,
) {
  return useQuery({
    queryKey: queryKeys.dashboardSummary(companyId),
    queryFn: () => {
      const params = new URLSearchParams();
      if (companyId) params.set("companyId", companyId);
      const query = params.toString();
      return api
        .get<DashboardSummaryResponse>(
          `/api/v1/dashboard/summary${query ? `?${query}` : ""}`,
        )
        .then(normalizeDashboardSummary);
    },
    enabled: Boolean(companyId),
  });
}

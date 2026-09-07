export const queryKeys = {
  me: ["me"] as const,
  blogs: (companyId?: string | null, status?: string) =>
    ["blogs", companyId, status] as const,
  paginatedBlogs: (
    companyId?: string | null,
    status?: string,
    page = 1,
    limit = 10,
    search?: string,
  ) => ["blogs", "paginated", companyId, status, page, limit, search] as const,
  blog: (id: string) => ["blog", id] as const,
  dashboardSummary: (companyId?: string | null) =>
    ["dashboard-summary", companyId] as const,
  users: ["users"] as const,
  auditLogs: (companyId?: string | null, page = 1, limit = 10, entityType?: string, entityId?: string, userId?: string, action?: string) =>
    ["audit-logs", companyId, page, limit, entityType, entityId, userId, action] as const,
  companies: ["companies"] as const,
};

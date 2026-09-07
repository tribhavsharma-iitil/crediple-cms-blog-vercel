import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/session";
import {
  auditLogs,
  hasPermission,
  userCanAccessCompany,
  users,
} from "@/lib/mock-db";

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const companyId = req.nextUrl.searchParams.get("companyId");
  if (!companyId || !userCanAccessCompany(user, companyId)) {
    return NextResponse.json(
      { error: "Forbidden for this company." },
      { status: 403 },
    );
  }

  if (
    !hasPermission(user, "audit.view_all") &&
    !hasPermission(user, "audit.view_company")
  ) {
    return NextResponse.json(
      { error: "You don't have permission to view audit logs." },
      { status: 403 },
    );
  }

  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page")) || 1);
  const limit = Math.max(
    1,
    Number(req.nextUrl.searchParams.get("limit")) || 10,
  );
  const entityType = req.nextUrl.searchParams.get("entityType");
  const action = req.nextUrl.searchParams.get("action");
  const filteredLogs = auditLogs.filter(
    (log) =>
      log.companyId === companyId &&
      (!entityType || log.entityType === entityType) &&
      (!action || log.action === action),
  );
  const start = (page - 1) * limit;
  const logs = filteredLogs.slice(start, start + limit).map((log) => {
    const auditUser = users.find((candidate) => candidate.id === log.userId);
    const [firstName, ...lastName] = auditUser?.name.split(" ") ?? [];
    return {
      ...log,
      user: auditUser
        ? { firstName, lastName: lastName.join(" "), email: auditUser.email }
        : undefined,
    };
  });
  return NextResponse.json({
    logs,
    pagination: {
      page,
      limit,
      totalItems: filteredLogs.length,
      totalPages: Math.max(1, Math.ceil(filteredLogs.length / limit)),
    },
  });
}

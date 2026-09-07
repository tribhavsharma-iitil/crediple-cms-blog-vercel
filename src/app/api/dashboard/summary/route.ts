import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/session";
import { blogs, auditLogs, userCanAccessCompany } from "@/lib/mock-db";

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

  const scoped = blogs.filter((b) => b.companyId === companyId);

  const draftCount = scoped.filter((b) => b.status === "draft").length;
  const pendingReviewCount = scoped.filter(
    (b) => b.status === "submitted_for_review",
  ).length;
  const pendingPublishCount = scoped.filter(
    (b) => b.status === "approved",
  ).length;
  const recentlyPublished = scoped
    .filter((b) => b.status === "published")
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .slice(0, 5);

  const recentActivity = auditLogs
    .filter((l) => l.companyId === companyId)
    .slice(0, 8)
    .map((entry) => ({
      ...entry,
      blogTitle:
        entry.entityType === "blog"
          ? blogs.find((blog) => blog.id === entry.entityId)?.title
          : undefined,
    }));

  return NextResponse.json({
    draftCount,
    pendingReviewCount,
    pendingPublishCount,
    recentlyPublished,
    recentActivity,
  });
}

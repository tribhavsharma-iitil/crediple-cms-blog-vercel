import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getUserFromRequest } from "@/lib/session";
import {
  blogs,
  hasPermission,
  userCanAccessCompany,
  logAudit,
  Blog,
} from "@/lib/mock-db";
import { createBlogSchema } from "@/lib/schemas/blog";
import { firstZodError } from "@/lib/schemas/zodError";

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const companyId = req.nextUrl.searchParams.get("companyId");
  const status = req.nextUrl.searchParams.get("status");
  const authorId = req.nextUrl.searchParams.get("authorId");
  const search = req.nextUrl.searchParams.get("search")?.trim().toLowerCase();
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page")) || 1);
  const limit = Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 10);

  if (!companyId || !userCanAccessCompany(user, companyId)) {
    return NextResponse.json(
      { error: "Forbidden for this company." },
      { status: 403 },
    );
  }

  let results = blogs.filter((b) => b.companyId === companyId);
  if (status) results = results.filter((b) => b.status === status);
  if (authorId) results = results.filter((b) => b.authorId === authorId);
  if (search) {
    results = results.filter((blog) =>
      `${blog.title} ${blog.excerpt} ${blog.tags.join(" ")}`
        .toLowerCase()
        .includes(search),
    );
  }

  results = [...results].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const totalItems = results.length;
  const start = (page - 1) * limit;
  return NextResponse.json({
    blogs: results.slice(start, start + limit),
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / limit)),
    },
  });
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!hasPermission(user, "blog.create")) {
    return NextResponse.json(
      { error: "You don't have permission to create blogs." },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createBlogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: firstZodError(parsed.error) },
      { status: 400 },
    );
  }
  const data = parsed.data;

  if (!userCanAccessCompany(user, data.companyId)) {
    return NextResponse.json(
      { error: "Forbidden for this company." },
      { status: 403 },
    );
  }

  const now = new Date().toISOString();
  const blog: Blog = {
    id: `blog_${uuid()}`,
    companyId: data.companyId,
    title: data.title,
    slug: data.slug || slugify(data.title),
    excerpt: data.excerpt ?? "",
    content: data.content ?? "",
    coverImageUrls: data.coverImageKey,
    coverImageUrl: data.coverImageKey?.[0],
    categoryId: data.categoryId,
    tags: data.tags ?? [],
    metaTitle: data.metaTitle,
    metaDescription: data.metaDescription,
    status: "draft",
    authorId: user.id,
    reviews: [],
    createdAt: now,
    updatedAt: now,
  };

  blogs.unshift(blog);
  logAudit({
    userId: user.id,
    companyId: blog.companyId,
    entityType: "blog",
    entityId: blog.id,
    action: "create",
    toStatus: "draft",
  });

  return NextResponse.json({ blog }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/session";
import {
  blogs,
  hasPermission,
  userCanAccessCompany,
  logAudit,
} from "@/lib/mock-db";
import { updateBlogSchema } from "@/lib/schemas/blog";
import { firstZodError } from "@/lib/schemas/zodError";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const blog = blogs.find((b) => b.id === id);
  if (!blog)
    return NextResponse.json({ error: "Blog not found." }, { status: 404 });
  if (!userCanAccessCompany(user, blog.companyId)) {
    return NextResponse.json(
      { error: "Forbidden for this company." },
      { status: 403 },
    );
  }

  return NextResponse.json({ blog });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const blog = blogs.find((b) => b.id === id);
  if (!blog)
    return NextResponse.json({ error: "Blog not found." }, { status: 404 });
  if (!userCanAccessCompany(user, blog.companyId)) {
    return NextResponse.json(
      { error: "Forbidden for this company." },
      { status: 403 },
    );
  }

  const isOwner = blog.authorId === user.id;
  const canEdit =
    (isOwner &&
      hasPermission(user, "blog.edit_own") &&
      ["draft", "rejected"].includes(blog.status)) ||
    hasPermission(user, "blog.edit_any");

  if (!canEdit) {
    return NextResponse.json(
      {
        error:
          "This blog can't be edited in its current state, or you lack permission.",
      },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = updateBlogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: firstZodError(parsed.error) },
      { status: 400 },
    );
  }

  Object.assign(blog, parsed.data);
  if (parsed.data.coverImageKey) {
    blog.coverImageUrls = parsed.data.coverImageKey;
    blog.coverImageUrl = parsed.data.coverImageKey[0];
  }
  blog.updatedAt = new Date().toISOString();

  logAudit({
    userId: user.id,
    companyId: blog.companyId,
    entityType: "blog",
    entityId: blog.id,
    action: "edit",
  });

  return NextResponse.json({ blog });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const index = blogs.findIndex((b) => b.id === id);
  if (index === -1)
    return NextResponse.json({ error: "Blog not found." }, { status: 404 });
  const blog = blogs[index];

  if (!userCanAccessCompany(user, blog.companyId)) {
    return NextResponse.json(
      { error: "Forbidden for this company." },
      { status: 403 },
    );
  }
  if (!hasPermission(user, "blog.delete")) {
    return NextResponse.json(
      { error: "You don't have permission to delete blogs." },
      { status: 403 },
    );
  }

  blogs.splice(index, 1);
  logAudit({
    userId: user.id,
    companyId: blog.companyId,
    entityType: "blog",
    entityId: blog.id,
    entityName: blog.title,
    action: "delete",
  });

  return NextResponse.json({ ok: true });
}

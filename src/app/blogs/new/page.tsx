"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { BlogForm, BlogFormValues } from "@/components/BlogForm";
import { Button } from "@/components/ui/Button";
import { useCreateBlog } from "@/hooks/useBlogs";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

export default function NewBlogPage() {
  const { activeCompanyId } = useAuth();
  const router = useRouter();
  const createBlog = useCreateBlog();
  const { showToast } = useToast();

  async function handleSave(values: BlogFormValues) {
    if (!activeCompanyId) return;
    try {
      const blog = await createBlog.mutateAsync({
        companyId: activeCompanyId,
        ...values,
      });
      showToast("Draft saved.");
      router.push(`/blogs/${blog.id}`);
    } catch {
      // The header next to the save action renders the request error.
    }
  }

  const error =
    createBlog.error instanceof ApiError
      ? createBlog.error.message
      : createBlog.error
        ? "Couldn't save the post."
        : null;

  return (
    <AuthenticatedShell>
      <div className="w-full">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-ink">Create Blog</h1>
          <div className="flex items-center gap-3">
            {error && (
              <p className="text-sm text-status-rejected">{error}</p>
            )}
            <Button
              type="submit"
              form="new-blog-form"
              variant="primary"
              disabled={createBlog.isPending}
            >
              {createBlog.isPending ? "Saving..." : "Save draft"}
            </Button>
          </div>
        </div>
        <BlogForm
          formId="new-blog-form"
          hideSubmit
          onSave={handleSave}
          saving={createBlog.isPending}
        />
      </div>
    </AuthenticatedShell>
  );
}

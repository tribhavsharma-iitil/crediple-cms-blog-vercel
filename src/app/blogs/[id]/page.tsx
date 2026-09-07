"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { BlogForm, BlogFormValues } from "@/components/BlogForm";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { StatusBadge } from "@/components/StatusBadge";
import {
  useBlog,
  useBlogStatusActions,
  useDeleteBlog,
  useUpdateBlog,
} from "@/hooks/useBlogs";
import { ApiError } from "@/lib/api";
import type { BlogStatus } from "@/lib/mock-db";
import { useToast } from "@/components/ToastProvider";

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const blogQuery = useBlog(id);
  const updateBlog = useUpdateBlog(id);
  const deleteBlog = useDeleteBlog();
  const blogStatusActions = useBlogStatusActions(id);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewFeedbackError, setReviewFeedbackError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDraftDirty, setIsDraftDirty] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { showToast } = useToast();

  const error =
    blogQuery.error ??
    updateBlog.error ??
    deleteBlog.error ??
    blogStatusActions.error;

  useEffect(() => {
    if (blogQuery.error instanceof ApiError && blogQuery.error.status === 404) {
      router.replace("/blogs");
    }
  }, [blogQuery.error, router]);

  async function save(values: BlogFormValues) {
    try {
      await updateBlog.mutateAsync(values);
      setIsEditing(false);
      setIsDraftDirty(false);
      showToast("Draft saved.");
    } catch {
      // The inline banner below presents the request error in one location.
    }
  }

  async function remove() {
    try { await deleteBlog.mutateAsync(id); showToast("Post deleted."); router.replace("/blogs"); } catch (error) { showToast(error instanceof Error ? error.message : "Could not delete the post.", "error"); }
  }

  async function sendForReview() {
    try {
      await blogStatusActions.submitForReview.mutateAsync();
      showToast("Post submitted for review.");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not submit the post.",
        "error",
      );
    }
  }

  async function approveBlog() {
    const comment = reviewComment.trim();
    if (!comment) {
      setReviewFeedbackError("Feedback is required before approving a post.");
      return;
    }
    try {
      await blogStatusActions.review.mutateAsync({
        action: "approve",
        ...(comment ? { comment } : {}),
      });
      setReviewComment("");
      setReviewFeedbackError(null);
      showToast("Post approved.");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not approve the post.",
        "error",
      );
    }
  }

  async function rejectBlog() {
    const comment = reviewComment.trim();
    if (!comment) {
      setReviewFeedbackError("Feedback is required before rejecting a post.");
      return;
    }
    try {
      await blogStatusActions.review.mutateAsync({ action: "reject", comment });
      setReviewComment("");
      setReviewFeedbackError(null);
      showToast("Post sent back with feedback.");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not reject the post.",
        "error",
      );
    }
  }

  async function publish() {
    try {
      await blogStatusActions.publish.mutateAsync();
      showToast("Post published.");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not publish the post.",
        "error",
      );
    }
  }

  async function unpublish() {
    try {
      await blogStatusActions.unpublish.mutateAsync();
      showToast("Post unpublished.");
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Could not unpublish the post.",
        "error",
      );
    }
  }

  if (blogQuery.isLoading) {
    return (
      <AuthenticatedShell>
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-ink/5" />
          <div className="h-80 animate-pulse rounded-xl border border-line bg-panel" />
        </div>
      </AuthenticatedShell>
    );
  }

  const blog = blogQuery.data;
  if (!blog) {
    return (
      <AuthenticatedShell>
        <p className="text-sm text-status-rejected">
          {blogQuery.error instanceof ApiError && blogQuery.error.status === 404
            ? "Redirecting to blogs..."
            : error instanceof ApiError || error instanceof Error
              ? error.message
              : "Blog not found."}
        </p>
      </AuthenticatedShell>
    );
  }

  const isOwner = user?.id === blog.authorId;
  const canEditOwnDraft =
    isOwner && hasPermission("blog.edit_own") && ["draft", "rejected"].includes(blog.status);
  const canEdit = hasPermission("blog.edit_any") || canEditOwnDraft;
  const canSubmitForReview =
    hasPermission("blog.submit_review") &&
    ["draft", "rejected"].includes(blog.status);
  const canReview =
    hasPermission("blog.review") && blog.status === "submitted_for_review";
  const canPublish =
    hasPermission("blog.publish") && blog.status === "approved";
  const canUnpublish =
    hasPermission("blog.publish") && blog.status === "published";
  const reviewFeedback = Array.isArray(blog.reviews)
    ? blog.reviews.filter((review) => review.comment?.trim())
    : [];

  return (
    <AuthenticatedShell>
      <div className="w-full">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <button onClick={() => router.push("/blogs")} aria-label="Back to blogs" className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink/50 hover:bg-ink/5 hover:text-ink">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-xl font-semibold text-ink">Edit post</h1>
            <p className="mt-1 text-sm text-ink/50">
              Last updated {new Date(blog.updatedAt).toLocaleString()}
            </p>
          </div>
          <StatusBadge status={blog.status} />
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-status-rejected/20 bg-status-rejected/10 px-3 py-2 text-sm text-status-rejected">
            {error instanceof ApiError || error instanceof Error
              ? error.message
              : "Could not save the post."}
          </p>
        )}

        {!canEdit && (
          <p className="mb-4 rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink/60">
            You don&apos;t have permission to edit this post{blog.status === "published" ? " — it's published; only an admin can make changes." : "."}
          </p>
        )}

        {canEdit && !isEditing && (
          <div className="mb-4">
            <Button variant="primary" onClick={() => setIsEditing(true)}>
              Edit draft
            </Button>
          </div>
        )}

        <BlogForm
          blog={blog}
          readOnly={!canEdit || !isEditing}
          onSave={save}
          saving={updateBlog.isPending}
          submitLabel="Save draft"
          onDirtyChange={setIsDraftDirty}
          submitDisabled={!isDraftDirty}
        />

        <section className="mt-8 rounded-xl border border-line bg-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink">
                Workflow actions
              </h2>
              <p className="mt-1 text-sm text-ink/50">
                Move this post through review and publish states.
              </p>
            </div>
            <StatusBadge status={blog.status as BlogStatus} />
          </div>

          {canSubmitForReview && (
            <div className="mt-5">
              <Button
                variant="primary"
                onClick={sendForReview}
                disabled={blogStatusActions.submitForReview.isPending}
              >
                {blogStatusActions.submitForReview.isPending
                  ? "Submitting..."
                  : "Send for review"}
              </Button>
            </div>
          )}

          {canReview && (
            <div className="mt-5 space-y-4">
              <Textarea
                value={reviewComment}
                onChange={(event) => {
                  setReviewComment(event.target.value);
                  setReviewFeedbackError(null);
                }}
                rows={3}
                aria-invalid={Boolean(reviewFeedbackError)}
                aria-describedby={
                  reviewFeedbackError ? "review-feedback-error" : undefined
                }
                placeholder="Add feedback for the author (included with approval or rejection)"
              />
              {reviewFeedbackError && (
                <p
                  id="review-feedback-error"
                  role="alert"
                  className="text-sm text-status-rejected"
                >
                  {reviewFeedbackError}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  onClick={approveBlog}
                  disabled={blogStatusActions.review.isPending}
                >
                  {blogStatusActions.review.isPending ? "Updating..." : "Approved"}
                </Button>
                <Button
                  variant="danger"
                  onClick={rejectBlog}
                  disabled={blogStatusActions.review.isPending}
                >
                  Rejected
                </Button>
              </div>
            </div>
          )}

          {canPublish && (
            <div className="mt-5">
              <Button
                variant="dark"
                onClick={publish}
                disabled={blogStatusActions.publish.isPending}
              >
                {blogStatusActions.publish.isPending ? "Publishing..." : "Publish"}
              </Button>
            </div>
          )}

          {canUnpublish && (
            <div className="mt-5">
              <Button
                variant="secondary"
                onClick={unpublish}
                disabled={blogStatusActions.unpublish.isPending}
              >
                {blogStatusActions.unpublish.isPending
                  ? "Unpublishing..."
                  : "Unpublish"}
              </Button>
            </div>
          )}

          {reviewFeedback.length > 0 && (
            <div className="mt-5 border-t border-line pt-5">
              <h3 className="text-sm font-semibold text-ink">
                Review feedback
              </h3>
              <div className="mt-3 space-y-3">
                {reviewFeedback.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-lg border border-line bg-canvas px-3 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-medium capitalize text-ink">
                        {review.action}
                      </span>
                      <span className="text-xs text-ink/45">
                        {new Date(review.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink/65">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="mt-8 border-t border-line pt-5">
          <Button
            variant="danger"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={deleteBlog.isPending}
          >
            Delete post
          </Button>
        </div>
      </div>

      {isDeleteDialogOpen && (
        <DeleteConfirmDialog
          loading={deleteBlog.isPending}
          onCancel={() => setIsDeleteDialogOpen(false)}
          onConfirm={async () => {
            await remove();
            setIsDeleteDialogOpen(false);
          }}
        />
      )}
    </AuthenticatedShell>
  );
}

function DeleteConfirmDialog({
  loading,
  onCancel,
  onConfirm,
}: {
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-blog-title"
        className="w-full max-w-md rounded-2xl border border-line bg-panel p-5 shadow-xl"
      >
        <h2 id="delete-blog-title" className="text-lg font-semibold text-ink">
          Delete this blog?
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink/60">
          This action will permanently delete this blog. You won’t be able to
          recover it afterward.
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            No
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting..." : "Yes, delete it"}
          </Button>
        </div>
      </div>
    </div>
  );
}

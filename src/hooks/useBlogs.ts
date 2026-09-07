"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { Blog, BlogStatus } from "@/lib/mock-db";
import type {
  CreateBlogInput,
  ReviewActionInput,
  UpdateBlogInput,
} from "@/lib/schemas/blog";

type BackendBlog = Omit<
  Blog,
  "status" | "coverImageUrl" | "coverImageUrls" | "reviews"
> & {
  status: string;
  coverImageUrl?: string[] | string;
  coverImageUrls?: string[];
  publishedAt?: string | null;
};
type BackendListResponse = {
  status: number;
  message: string;
  data: BackendBlog[] | { blogs?: BackendBlog[]; data?: BackendBlog[] };
  pagination?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
};
type BackendItemResponse = {
  status?: number;
  message?: string;
  data?: BackendBlog | { blog?: BackendBlog };
  blog?: BackendBlog;
};
export type BlogPagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};
export type PaginatedBlogs = { blogs: Blog[]; pagination: BlogPagination };
const statusMap: Record<string, BlogStatus> = {
  DRAFT: "draft",
  SUBMITTED_FOR_REVIEW: "submitted_for_review",
  AWAITING_REVIEW: "submitted_for_review",
  APPROVED: "approved",
  AWAITING_PUBLISH: "approved",
  REJECTED: "rejected",
  PUBLISHED: "published",
};
const backendStatusMap: Record<BlogStatus, string> = {
  draft: "DRAFT",
  submitted_for_review: "SUBMITTED_FOR_REVIEW",
  approved: "APPROVED",
  rejected: "REJECTED",
  published: "PUBLISHED",
};

function normalizeImageUrls(blog: BackendBlog) {
  if (!blog) return [];
  if (Array.isArray(blog.coverImageUrl)) return blog.coverImageUrl;
  if (Array.isArray(blog.coverImageUrls)) return blog.coverImageUrls;
  return blog.coverImageUrl ? [blog.coverImageUrl] : [];
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeBlog(
  blog:
    | (Partial<BackendBlog> & { reviews?: Blog["reviews"] } & {
        blog?: Partial<BackendBlog>;
      })
    | null
    | undefined,
): Blog {
  const source = (blog && "blog" in blog && blog.blog ? blog.blog : blog) ?? {};
  const coverImageUrls = normalizeImageUrls(source as BackendBlog);
  const statusKey = String(
    (source as Partial<BackendBlog>).status ?? "draft",
  ).toUpperCase();
  return {
    ...(source as Blog),
    status: statusMap[statusKey] ?? "draft",
    coverImageUrls,
    coverImageUrl: coverImageUrls[0],
    tags: normalizeStringArray((source as Partial<BackendBlog>).tags),
    reviews: Array.isArray((source as Partial<Blog>).reviews)
      ? ((source as Partial<Blog>).reviews as Blog["reviews"])
      : [],
  };
}

function normalizeBlogArray(
  response:
    | BackendListResponse
    | { blogs?: BackendBlog[]; data?: BackendBlog[] }
    | BackendBlog[]
    | null
  | undefined,
): BackendBlog[] {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];
  const nestedData = (response as BackendListResponse).data;
  if (Array.isArray(nestedData)) return nestedData;
  if (nestedData && !Array.isArray(nestedData)) {
    if (Array.isArray(nestedData.blogs)) return nestedData.blogs;
    if (Array.isArray(nestedData.data)) return nestedData.data;
  }
  if (Array.isArray((response as { blogs?: BackendBlog[] }).blogs))
    return (response as { blogs?: BackendBlog[] }).blogs ?? [];
  return [];
}

function getResponseBlog(response: BackendItemResponse) {
  const payload = response.data ?? response.blog;
  if (!payload)
    throw new Error(
      "The review was saved, but the backend did not return the updated blog.",
    );
  return normalizeBlog(payload);
}
function toBackendPayload(input: CreateBlogInput | UpdateBlogInput) {
  const payload = { ...input };
  delete payload.categoryId;
  delete payload.tags;
  // An empty slug means "auto-generate one" — sending "" trips the
  // backend's slug-format validation instead of triggering that default.
  if (!payload.slug?.trim()) delete payload.slug;
  return payload;
}
function useInvalidateBlogLists() { const queryClient = useQueryClient(); return () => { queryClient.invalidateQueries({ queryKey: ["blogs"] }); queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }); queryClient.invalidateQueries({ queryKey: ["audit-logs"] }); }; }
function replaceBlogInLists(queryClient: ReturnType<typeof useQueryClient>, blog: Blog) {
  queryClient.getQueriesData<Blog[]>({ queryKey: ["blogs"] }).forEach(([key, current]) => {
    if (!Array.isArray(current)) return;
    const status = key[2] as BlogStatus | undefined;
    const next = current.map((item) => item.id === blog.id ? blog : item).filter((item) => !status || item.status === status);
    queryClient.setQueryData(key, next);
  });
}

export function useBlogs(companyId: string | null, status?: BlogStatus | "") {
  return useQuery({
    queryKey: queryKeys.blogs(companyId, status || undefined),
    queryFn: async () => {
      const response = await api.get<
        | BackendListResponse
        | { blogs?: BackendBlog[]; data?: BackendBlog[] }
        | BackendBlog[]
      >(`/api/v1/blogs?${new URLSearchParams({
        companyId: companyId ?? "",
        limit: "100",
        ...(status ? { status: backendStatusMap[status] } : {}),
      }).toString()}`);
      return normalizeBlogArray(response)
        .map(normalizeBlog)
        .filter(
          (blog) =>
            (!companyId || blog.companyId === companyId) &&
            (!status || blog.status === status),
        );
    },
    enabled: Boolean(companyId),
  });
}

export function usePaginatedBlogs(
  companyId: string | null,
  status: BlogStatus | "",
  page: number,
  limit = 10,
  search = "",
) {
  return useQuery({
    queryKey: queryKeys.paginatedBlogs(
      companyId,
      status || undefined,
      page,
      limit,
      search || undefined,
    ),
    queryFn: async (): Promise<PaginatedBlogs> => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (companyId) params.set("companyId", companyId);
      if (status) params.set("status", backendStatusMap[status]);
      if (search.trim()) params.set("search", search.trim());
      const response = await api.get<
        | BackendListResponse
        | { blogs?: BackendBlog[]; data?: BackendBlog[] }
        | BackendBlog[]
      >(`/api/v1/blogs?${params.toString()}`);
      const blogs = normalizeBlogArray(response).map(normalizeBlog);
      return {
        blogs,
        pagination:
          !Array.isArray(response) &&
          "pagination" in response &&
          response.pagination
            ? response.pagination
            : { page, limit, totalItems: blogs.length, totalPages: 1 },
      };
    },
    enabled: Boolean(companyId),
  });
}

export function useBlog(id?: string) {
  const blogId = id?.trim() ?? "";
  return useQuery({
    queryKey: queryKeys.blog(blogId),
    queryFn: async () => {
      const response = await api.get<
        BackendItemResponse | BackendBlog | { blog?: BackendBlog }
      >(`/api/v1/blogs/${blogId}`);
      const payload = Array.isArray(response)
        ? response.find((item) => item.id === blogId)
        : "blog" in response && response.blog
          ? response.blog
          : "data" in response && response.data && !Array.isArray(response.data)
            ? response.data
            : (response as BackendBlog);
      if (!payload) throw new Error("Blog not found.");
      return normalizeBlog(payload as BackendBlog);
    },
    enabled: Boolean(blogId),
  });
}

export function useCreateBlog() {
  const queryClient = useQueryClient();
  const invalidateLists = useInvalidateBlogLists();
  return useMutation({
    mutationFn: async (input: CreateBlogInput) =>
      getResponseBlog(
        await api.post<BackendItemResponse>(
          "/api/v1/blogs",
          toBackendPayload(input),
        ),
      ),
    onSuccess: (blog) => {
      queryClient.setQueryData(queryKeys.blog(blog.id), blog);
      invalidateLists();
    },
  });
}

export function useUpdateBlog(id: string) {
  const queryClient = useQueryClient();
  const invalidateLists = useInvalidateBlogLists();
  return useMutation({
    mutationFn: async (input: UpdateBlogInput) =>
      getResponseBlog(
        await api.patch<BackendItemResponse>(
          `/api/v1/blogs/${id}`,
          toBackendPayload(input),
        ),
      ),
    onSuccess: (blog) => {
      queryClient.setQueryData(queryKeys.blog(id), blog);
      invalidateLists();
    },
  });
}

export function useDeleteBlog() {
  const queryClient = useQueryClient(); const invalidateLists = useInvalidateBlogLists();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ status: number; message: string; data: { id: string; deleted: boolean } }>(`/api/v1/blogs/${id}`),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.blog(id) });
      // queryKey: ["blogs"] partial-matches both the flat useBlogs() cache
      // (an array) and the usePaginatedBlogs() cache ({ blogs, pagination }
      // — not an array). Only the former should be filtered here.
      queryClient.setQueriesData<Blog[]>({ queryKey: ["blogs"] }, (current) =>
        Array.isArray(current) ? current.filter((item) => item.id !== id) : current
      );
      invalidateLists();
    },
  });
}

function useBlogTransition(
  id: string,
  action: "submit-review" | "publish" | "unpublish",
) {
  const queryClient = useQueryClient();
  const invalidateLists = useInvalidateBlogLists();

  return useMutation({
    mutationFn: async () =>
      getResponseBlog(
        await api.post<BackendItemResponse>(`/api/v1/blogs/${id}/${action}`),
      ),
    onSuccess: (blog) => {
      queryClient.setQueryData(queryKeys.blog(id), blog);
      replaceBlogInLists(queryClient, blog);
      invalidateLists();
    },
  });
}

export function useSubmitForReview(id: string) {
  return useBlogTransition(id, "submit-review");
}

export function usePublishBlog(id: string) {
  return useBlogTransition(id, "publish");
}

export function useUnpublishBlog(id: string) {
  return useBlogTransition(id, "unpublish");
}

export function useReviewBlog(id: string) {
  const queryClient = useQueryClient();
  const invalidateLists = useInvalidateBlogLists();

  return useMutation({
    mutationFn: async (input: ReviewActionInput) =>
      getResponseBlog(
        await api.post<BackendItemResponse>(
          `/api/v1/blogs/${id}/review`,
          input,
        ),
      ),
    onSuccess: (blog) => {
      queryClient.setQueryData(queryKeys.blog(id), blog);
      replaceBlogInLists(queryClient, blog);
      invalidateLists();
    },
  });
}

/**
 * Groups all workflow status mutations for a single blog so screens do not
 * need to wire each status endpoint and its error state independently.
 */
export function useBlogStatusActions(id: string) {
  const submitForReview = useSubmitForReview(id);
  const review = useReviewBlog(id);
  const publish = usePublishBlog(id);
  const unpublish = useUnpublishBlog(id);

  return {
    submitForReview,
    review,
    publish,
    unpublish,
    error:
      submitForReview.error ??
      review.error ??
      publish.error ??
      unpublish.error,
  };
}

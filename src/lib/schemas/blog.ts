import { z } from "zod";

export const blogEditableFieldsSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  slug: z.string().trim().optional(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  coverImageKey: z.array(z.string().min(1)).optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

export const updateBlogSchema = blogEditableFieldsSchema.partial();

export const createBlogSchema = blogEditableFieldsSchema.partial().extend({
  companyId: z.string().min(1, "companyId is required."),
  title: z.string().trim().min(1, "Title is required."),
});

export const reviewActionSchema = z
  .object({
    action: z.enum(["approve", "reject"]),
    comment: z.string().trim().optional(),
  })
  .refine((data) => !!data.comment, {
    message: "Feedback is required when approving or rejecting.",
    path: ["comment"],
  });

export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;
export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type ReviewActionInput = z.infer<typeof reviewActionSchema>;

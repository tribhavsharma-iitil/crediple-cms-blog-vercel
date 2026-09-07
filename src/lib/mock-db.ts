import { v4 as uuid } from "uuid";

/**
 * MOCK DATA LAYER
 * ----------------
 * This file simulates the backend database described in the technical plan.
 * Everything lives in memory and resets when the dev server restarts.
 *
 * When the real backend is ready, only the route handlers under app/api/**
 * need to be swapped for real HTTP calls to that backend — the shapes
 * returned here match the planned API contract, so components/pages should
 * not need to change.
 */

export type PermissionKey =
  | "blog.create"
  | "blog.edit_own"
  | "blog.edit_any"
  | "blog.submit_review"
  | "blog.review"
  | "blog.publish"
  | "blog.delete"
  | "user.manage"
  | "company.manage"
  | "audit.view_all"
  | "audit.view_company";

export type BlogStatus =
  "draft" | "submitted_for_review" | "approved" | "rejected" | "published";

export interface Company {
  id: string;
  name: string;
  slug: string;
}

export interface Role {
  id: string;
  key: string;
  label: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // plaintext for mock only — never do this in real backend
  roleId: string;
  companyIds: string[];
  isActive: boolean;
}

export interface BlogCategory {
  id: string;
  companyId: string;
  name: string;
  slug: string;
}

export interface ReviewEntry {
  id: string;
  action: "approve" | "reject";
  reviewerId: string;
  comment?: string;
  createdAt: string;
}

export interface Blog {
  id: string;
  companyId: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrls?: string[];
  coverImageUrl?: string;
  categoryId?: string;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  status: BlogStatus;
  authorId: string;
  reviews: ReviewEntry[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  companyId: string;
  entityType: "blog" | "user" | "company";
  entityId: string;
  entityName?: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  comment?: string;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: number;
}

// ---------- Role -> permission map ----------
export const ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  super_admin: [
    "blog.create",
    "blog.edit_own",
    "blog.edit_any",
    "blog.submit_review",
    "blog.review",
    "blog.publish",
    "blog.delete",
    "user.manage",
    "company.manage",
    "audit.view_all",
    "audit.view_company",
  ],
  company_admin: [
    "blog.create",
    "blog.edit_own",
    "blog.edit_any",
    "blog.submit_review",
    "blog.review",
    "blog.publish",
    "blog.delete",
    "user.manage",
    "audit.view_company",
  ],
  content_editor: ["blog.create", "blog.edit_own", "blog.submit_review"],
  content_reviewer: ["blog.review", "audit.view_company"],
};

// ---------- Seed data ----------
export const companies: Company[] = [
  { id: "co_crediple", name: "Crediple", slug: "crediple" },
  { id: "co_brandone", name: "Brand One", slug: "brand-one" },
];

export const roles: Role[] = [
  { id: "role_super_admin", key: "super_admin", label: "Super Admin" },
  { id: "role_company_admin", key: "company_admin", label: "Company Admin" },
  { id: "role_content_editor", key: "content_editor", label: "Content Editor" },
  {
    id: "role_content_reviewer",
    key: "content_reviewer",
    label: "Content Reviewer",
  },
];

export const users: User[] = [
  {
    id: "u_ava",
    name: "Ava Sharma",
    email: "ava.superadmin@crediple.com",
    password: "password123",
    roleId: "role_super_admin",
    companyIds: ["co_crediple", "co_brandone"],
    isActive: true,
  },
  {
    id: "u_liam",
    name: "Liam Chen",
    email: "liam.admin@crediple.com",
    password: "password123",
    roleId: "role_company_admin",
    companyIds: ["co_crediple"],
    isActive: true,
  },
  {
    id: "u_priya",
    name: "Priya Nair",
    email: "priya.editor@crediple.com",
    password: "password123",
    roleId: "role_content_editor",
    companyIds: ["co_crediple"],
    isActive: true,
  },
  {
    id: "u_omar",
    name: "Omar Reyes",
    email: "omar.reviewer@crediple.com",
    password: "password123",
    roleId: "role_content_reviewer",
    companyIds: ["co_crediple"],
    isActive: true,
  },
  {
    id: "u_sofia",
    name: "Sofia Kim",
    email: "sofia.admin@brandone.com",
    password: "password123",
    roleId: "role_company_admin",
    companyIds: ["co_brandone"],
    isActive: true,
  },
];

export const blogCategories: BlogCategory[] = [
  {
    id: "cat_credit",
    companyId: "co_crediple",
    name: "Credit Tips",
    slug: "credit-tips",
  },
  {
    id: "cat_news",
    companyId: "co_crediple",
    name: "Company News",
    slug: "company-news",
  },
  {
    id: "cat_b1_news",
    companyId: "co_brandone",
    name: "Announcements",
    slug: "announcements",
  },
];

const now = () => new Date().toISOString();

export const blogs: Blog[] = [
  {
    id: "blog_1",
    companyId: "co_crediple",
    title: "5 Ways to Improve Your Credit Score This Year",
    slug: "5-ways-to-improve-your-credit-score-this-year",
    excerpt:
      "Practical, no-nonsense steps anyone can take to build a stronger credit profile.",
    content:
      "<p>Building good credit doesn't happen overnight, but a few consistent habits go a long way...</p>",
    categoryId: "cat_credit",
    tags: ["credit-score", "personal-finance"],
    metaTitle: "5 Ways to Improve Your Credit Score",
    metaDescription:
      "Simple, practical steps to build a stronger credit profile this year.",
    status: "published",
    authorId: "u_priya",
    reviews: [
      {
        id: uuid(),
        action: "approve",
        reviewerId: "u_omar",
        comment: "Reads well, approved.",
        createdAt: now(),
      },
    ],
    createdAt: now(),
    updatedAt: now(),
    publishedAt: now(),
  },
  {
    id: "blog_2",
    companyId: "co_crediple",
    title: "Crediple Expands Leadership Team",
    slug: "crediple-expands-leadership-team",
    excerpt: "We're excited to welcome three new leaders to the Crediple team.",
    content:
      "<p>Crediple continues to grow, and today we're announcing three new hires...</p>",
    categoryId: "cat_news",
    tags: ["company-news"],
    status: "submitted_for_review",
    authorId: "u_priya",
    reviews: [],
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "blog_3",
    companyId: "co_crediple",
    title: "Understanding APR: A Plain-English Guide",
    slug: "understanding-apr-a-plain-english-guide",
    excerpt: "What APR actually means and why it matters when you borrow.",
    content:
      "<p>APR shows up on nearly every loan offer, but it's often misunderstood...</p>",
    categoryId: "cat_credit",
    tags: ["apr", "loans"],
    status: "approved",
    authorId: "u_priya",
    reviews: [
      {
        id: uuid(),
        action: "approve",
        reviewerId: "u_omar",
        comment: "Good, ready to publish.",
        createdAt: now(),
      },
    ],
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "blog_4",
    companyId: "co_crediple",
    title: "Draft: Q3 Product Roadmap Teaser",
    slug: "draft-q3-product-roadmap-teaser",
    excerpt: "",
    content: "<p>Draft in progress...</p>",
    status: "draft",
    authorId: "u_priya",
    tags: [],
    reviews: [],
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "blog_5",
    companyId: "co_brandone",
    title: "Brand One Launches New Rewards Program",
    slug: "brand-one-launches-new-rewards-program",
    excerpt: "More ways to earn, starting this month.",
    content: "<p>We're rolling out a refreshed rewards program...</p>",
    categoryId: "cat_b1_news",
    tags: ["rewards"],
    status: "published",
    authorId: "u_sofia",
    reviews: [],
    createdAt: now(),
    updatedAt: now(),
    publishedAt: now(),
  },
];

export const auditLogs: AuditLogEntry[] = [];

export const sessions = new Map<string, Session>();

// ---------- Helpers ----------
export function findUserByEmail(email: string) {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function getRole(roleId: string) {
  return roles.find((r) => r.id === roleId);
}

export function getPermissions(user: User): PermissionKey[] {
  const role = getRole(user.roleId);
  if (!role) return [];
  return ROLE_PERMISSIONS[role.key] ?? [];
}

export function hasPermission(user: User, permission: PermissionKey) {
  return getPermissions(user).includes(permission);
}

export function userCanAccessCompany(user: User, companyId: string) {
  return user.companyIds.includes(companyId);
}

export function logAudit(entry: Omit<AuditLogEntry, "id" | "createdAt">) {
  auditLogs.unshift({ ...entry, id: uuid(), createdAt: now() });
}

export function publicUserView(user: User) {
  const role = getRole(user.roleId);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: role ? { id: role.id, key: role.key, label: role.label } : null,
    permissions: getPermissions(user),
    companyIds: user.companyIds,
    companies: companies.filter((c) => user.companyIds.includes(c.id)),
  };
}

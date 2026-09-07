"use client";

import { ArrowLeft, ArrowRight, ExternalLink, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, inputClassName } from "@/components/ui/Input";
import type { Blog } from "@/lib/mock-db";
import { RichTextEditor } from "@/components/RichTextEditor";
import { uploadBlogImage } from "@/lib/image-upload";

const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const LIMITS = {
  title: 160,
  excerpt: 300,
  content: 50_000,
  metaTitle: 60,
  metaDescription: 160,
};

export interface BlogFormValues {
  title: string; slug: string; excerpt: string; content: string; coverImageKey: string[]; metaTitle: string; metaDescription: string;
}

const FORM_VALUE_KEYS = ["title", "slug", "excerpt", "content", "coverImageKey", "metaTitle", "metaDescription"] as const;

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toValues(blog?: Blog | null): BlogFormValues {
  return { title: blog?.title ?? "", slug: blog?.slug ?? "", excerpt: blog?.excerpt ?? "", content: blog?.content ?? "", coverImageKey: blog?.coverImageUrls ?? (blog?.coverImageUrl ? [blog.coverImageUrl] : []), metaTitle: blog?.metaTitle ?? "", metaDescription: blog?.metaDescription ?? "" };
}

/**
 * Keeps only the fields BlogFormValues currently declares. A localStorage
 * draft saved under an older field name (e.g. before coverImageUrl was
 * renamed to coverImageKey) would otherwise spread stray keys into `values`
 * at runtime — TypeScript can't catch that, since it's parsed JSON — and
 * those stray keys would ride along into the save payload and get rejected
 * by the backend's forbidNonWhitelisted validation.
 */
function pickKnownFormFields(source: unknown): Partial<BlogFormValues> {
  if (!source || typeof source !== "object") return {};
  const result: Partial<BlogFormValues> = {};
  for (const key of FORM_VALUE_KEYS) {
    if (key in (source as Record<string, unknown>)) {
      (result as Record<string, unknown>)[key] = (source as Record<string, unknown>)[key];
    }
  }
  return result;
}

export function BlogForm({ blog, readOnly, onSave, saving, formId, hideSubmit, submitLabel = "Save draft", onDirtyChange, submitDisabled }: { blog?: Blog | null; readOnly?: boolean; onSave: (values: BlogFormValues) => Promise<void>; saving?: boolean; formId?: string; hideSubmit?: boolean; submitLabel?: string; onDirtyChange?: (isDirty: boolean) => void; submitDisabled?: boolean }) {
  const draftKey = `cms-blog-draft:${blog?.id ?? "new"}`;
  const [values, setValues] = useState<BlogFormValues>(() => {
    const initialValues = toValues(blog);
    if (readOnly || typeof window === "undefined") return initialValues;
    try { return { ...initialValues, ...pickKnownFormFields(JSON.parse(window.localStorage.getItem(draftKey) ?? "null")) }; } catch { return initialValues; }
  });
  const initialValuesRef = useRef(toValues(blog));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [contentCharacterCount, setContentCharacterCount] = useState(() => toValues(blog).content.replace(/<[^>]*>/g, "").length);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewHref = `/blogs/${blog?.id ?? "new"}/preview`;
  function openPreview() {
    window.open(previewHref, "_blank", "noopener,noreferrer");
  }
  useEffect(() => {
    if (!readOnly)
      window.localStorage.setItem(draftKey, JSON.stringify(values));
  }, [draftKey, readOnly, values]);
  useEffect(() => {
    onDirtyChange?.(
      !readOnly &&
        JSON.stringify(values) !== JSON.stringify(initialValuesRef.current),
    );
  }, [onDirtyChange, readOnly, values]);
  function update<K extends keyof BlogFormValues>(
    key: K,
    value: BlogFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    const missing = !values.title.trim()
      ? "Add a title before saving."
      : contentCharacterCount === 0
        ? "Add blog content before saving."
        : null;
    if (missing) {
      setFormError(missing);
      return;
    }
    const tooLong = Object.entries(LIMITS).find(([key, limit]) =>
      key === "content"
        ? contentCharacterCount > limit
        : values[key as keyof typeof LIMITS].length > limit,
    );
    if (tooLong) {
      setFormError(
        `${tooLong[0] === "metaTitle" ? "Meta title" : tooLong[0] === "metaDescription" ? "Meta description" : tooLong[0]} exceeds the ${tooLong[1]} character limit.`,
      );
      return;
    }
    setFormError(null);
    const payloadValues = pickKnownFormFields(values) as BlogFormValues;
    await onSave(payloadValues);
    window.localStorage.removeItem(draftKey);
  }
  async function addImages(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (!files.length) return;
    const oversizedFile = files.find(
      (file) => file.size > MAX_IMAGE_SIZE_BYTES,
    );
    if (oversizedFile) {
      setUploadError(
        `${oversizedFile.name} is larger than ${MAX_IMAGE_SIZE_MB}MB.`,
      );
      event.target.value = "";
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const uploaded = await Promise.all(files.map(uploadBlogImage));
      update("coverImageKey", [
        ...values.coverImageKey,
        ...uploaded.map((image) => image.url),
      ]);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Could not upload image.",
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }
  function removeImage(index: number) {
    update("coverImageKey", values.coverImageKey.filter((_, currentIndex) => currentIndex !== index));
  }
  function moveImage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= values.coverImageKey.length) return;
    const images = [...values.coverImageKey];
    [images[index], images[nextIndex]] = [images[nextIndex], images[index]];
    update("coverImageKey", images);
  }

  return <form id={formId} onSubmit={save} className="space-y-6">
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(22rem,0.85fr)]">
    <section className="space-y-4 rounded-xl border border-line bg-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-base font-semibold text-ink">Content</h2>
        <Button type="button" variant="ghost" size="sm" onClick={openPreview}>
          <ExternalLink className="h-3.5 w-3.5" />
          Preview
        </Button>
      </div>
      <Field label="Title" hint={`${values.title.length}/${LIMITS.title} characters`}><Input disabled={readOnly} required maxLength={LIMITS.title} value={values.title} onChange={(event) => { const title = event.target.value; setValues((current) => ({ ...current, title, slug: current.slug || slugify(title) })); }} placeholder="A clear, specific headline" /></Field>
      <Field label="URL slug" hint="Leave blank to generate it from the title."><Input disabled={readOnly} value={values.slug} onChange={(event) => update("slug", event.target.value)} className="font-mono" placeholder="auto-generated-from-title" /></Field>
      <Field label="Excerpt" hint={`Short summary used in blog cards and search results. ${values.excerpt.length}/${LIMITS.excerpt}`}><Textarea disabled={readOnly} maxLength={LIMITS.excerpt} value={values.excerpt} onChange={(event) => update("excerpt", event.target.value)} rows={3} placeholder="One or two sentences shown in blog listings" /></Field>
      <Field label="Content" hint={`${contentCharacterCount}/${LIMITS.content} visible characters`}><RichTextEditor disabled={readOnly} value={values.content} onChange={(content, characterCount) => { update("content", content); setContentCharacterCount(characterCount); }} /></Field>
    </section>
    <div className="space-y-6 xl:sticky xl:top-20">
    <section className="space-y-4 rounded-xl border border-line bg-panel p-5"><h2 className="font-heading text-base font-semibold text-ink">Publishing details</h2>
      <Field label="Blog images" hint="Upload one or more images. The first image is used as the blog cover.">
        <input ref={fileInputRef} disabled={readOnly || uploading} type="file" accept="image/*" multiple onChange={addImages} className="sr-only" />
        <button type="button" disabled={readOnly || uploading} onClick={() => fileInputRef.current?.click()} className={`${inputClassName} flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 border-dashed text-center disabled:cursor-not-allowed`}>
          <Upload className="h-5 w-5 text-accent" aria-hidden="true" />
          <span className="text-sm font-medium text-ink">{uploading ? "Uploading..." : "Choose images"}</span>
          <span className="text-xs text-ink/45">PNG, JPG, WEBP, or GIF up to {MAX_IMAGE_SIZE_MB}MB each</span>
        </button>
      </Field>
      {uploadError && <p className="rounded-lg border border-status-rejected/20 bg-status-rejected/10 px-3 py-2 text-sm text-status-rejected">{uploadError}</p>}
      {values.coverImageKey.length > 0 && <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {values.coverImageKey.map((imageUrl, index) => <div key={`${imageUrl}-${index}`} className="group relative overflow-hidden rounded-lg border border-line bg-canvas">
          <img src={imageUrl} alt={`Blog image preview ${index + 1}`} className="h-40 w-full object-cover" />
          <div className="absolute left-2 top-2 rounded bg-ink/70 px-2 py-1 text-xs font-medium text-canvas">{index === 0 ? "Cover" : `Image ${index + 1}`}</div>
          {!readOnly && <div className="absolute right-2 top-2 flex gap-1"><button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} aria-label={`Move image ${index + 1} earlier`} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink/70 text-canvas hover:bg-accent disabled:opacity-40"><ArrowLeft className="h-4 w-4" /></button><button type="button" onClick={() => moveImage(index, 1)} disabled={index === values.coverImageKey.length - 1} aria-label={`Move image ${index + 1} later`} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink/70 text-canvas hover:bg-accent disabled:opacity-40"><ArrowRight className="h-4 w-4" /></button><button type="button" onClick={() => removeImage(index)} aria-label={`Remove image ${index + 1}`} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink/70 text-canvas hover:bg-status-rejected"><X className="h-4 w-4" /></button></div>}
        </div>)}
      </div>}
    </section>
    <section className="space-y-4 rounded-xl border border-line bg-panel p-5"><h2 className="font-heading text-base font-semibold text-ink">SEO</h2><Field label="Meta title" hint={`${values.metaTitle.length}/${LIMITS.metaTitle} characters`}><Input disabled={readOnly} maxLength={LIMITS.metaTitle} value={values.metaTitle} onChange={(event) => update("metaTitle", event.target.value)} placeholder="Title shown in search engines" /></Field><Field label="Meta description" hint={`${values.metaDescription.length}/${LIMITS.metaDescription} characters`}><Textarea disabled={readOnly} maxLength={LIMITS.metaDescription} value={values.metaDescription} onChange={(event) => update("metaDescription", event.target.value)} rows={3} placeholder="Short description for search engines" /></Field></section>
    </div>
    </div>
    {formError && <p role="alert" className="rounded-lg border border-status-rejected/20 bg-status-rejected/10 px-3 py-2 text-sm text-status-rejected">{formError}</p>}
    {!readOnly && !hideSubmit && <Button type="submit" variant="dark" disabled={saving || submitDisabled}>{saving ? "Saving..." : submitLabel}</Button>}
  </form>;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink/80">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink/45">{hint}</p>}
    </div>
  );
}

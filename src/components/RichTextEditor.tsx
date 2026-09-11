"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/Button";
import { uploadBlogImage } from "@/lib/image-upload";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export function RichTextEditor({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string, characterCount: number) => void;
  disabled?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-accent underline" },
      }),
      Placeholder.configure({ placeholder: "Start writing..." }),
    ],
    content: value,
    onUpdate: ({ editor: instance }) =>
      onChange(instance.getHTML(), instance.getText().length),
    editorProps: {
      attributes: {
        class:
          "rich-text-editor min-h-40 resize-y overflow-auto px-3.5 py-3 text-sm text-ink outline-none",
      },
    },
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);
  useEffect(() => {
    if (editor && value !== editor.getHTML())
      editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  async function insertImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editor) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setUploadError("Images must be 10MB or smaller.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const { url } = await uploadBlogImage(file);
      editor
        .chain()
        .focus()
        .setImage({ src: url, alt: file.name })
        .run();
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Could not upload image.",
      );
    } finally {
      setUploading(false);
    }
  }
  function addLink() {
    if (!editor) return;
    const url = window.prompt(
      "Enter the link URL",
      (editor.getAttributes("link").href as string) ?? "",
    );
    if (url === null) return;
    if (!url.trim())
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url.trim() })
        .run();
  }
  const action = (
    label: string,
    icon: React.ReactNode,
    onClick: () => void,
    active = false,
  ) => (
    <Button
      type="button"
      variant={active ? "primary" : "ghost"}
      size="sm"
      className="h-8 w-8 px-0"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
    </Button>
  );

  return (
    <div>
      <div className="flex flex-wrap gap-1 rounded-t-lg border border-line bg-panel p-2">
        {action(
          "Bold",
          <Bold className="h-4 w-4" />,
          () => editor?.chain().focus().toggleBold().run(),
          !!editor?.isActive("bold"),
        )}
        {action(
          "Italic",
          <Italic className="h-4 w-4" />,
          () => editor?.chain().focus().toggleItalic().run(),
          !!editor?.isActive("italic"),
        )}
        <div className="mx-1 my-1 w-px self-stretch bg-line" aria-hidden="true" />
        {action(
          "Heading 2",
          <Heading2 className="h-4 w-4" />,
          () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
          !!editor?.isActive("heading", { level: 2 }),
        )}
        {action(
          "Heading 3",
          <Heading3 className="h-4 w-4" />,
          () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
          !!editor?.isActive("heading", { level: 3 }),
        )}
        {action(
          "Bullet list",
          <List className="h-4 w-4" />,
          () => editor?.chain().focus().toggleBulletList().run(),
          !!editor?.isActive("bulletList"),
        )}
        {action(
          "Numbered list",
          <ListOrdered className="h-4 w-4" />,
          () => editor?.chain().focus().toggleOrderedList().run(),
          !!editor?.isActive("orderedList"),
        )}
        {action(
          "Blockquote",
          <Quote className="h-4 w-4" />,
          () => editor?.chain().focus().toggleBlockquote().run(),
          !!editor?.isActive("blockquote"),
        )}
        <div className="mx-1 my-1 w-px self-stretch bg-line" aria-hidden="true" />
        {action(
          "Add link",
          <LinkIcon className="h-4 w-4" />,
          addLink,
          !!editor?.isActive("link"),
        )}
        <label
          aria-label={uploading ? "Uploading image" : "Insert image"}
          title={uploading ? "Uploading image" : "Insert image"}
          className={`${buttonVariants({ variant: "ghost", size: "sm" })} h-8 w-8 px-0 ${disabled || uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          <ImagePlus className="h-4 w-4" />
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={insertImage}
            disabled={disabled || uploading}
          />
        </label>
        <div className="mx-1 my-1 w-px self-stretch bg-line" aria-hidden="true" />
        {action("Undo", <Undo2 className="h-4 w-4" />, () =>
          editor?.chain().focus().undo().run(),
        )}
        {action("Redo", <Redo2 className="h-4 w-4" />, () =>
          editor?.chain().focus().redo().run(),
        )}
      </div>
      <EditorContent
        editor={editor}
        className="overflow-hidden rounded-b-lg border border-t-0 border-line bg-panel focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20"
      />
      {uploadError && (
        <p role="alert" className="mt-2 text-sm text-status-rejected">
          {uploadError}
        </p>
      )}
    </div>
  );
}

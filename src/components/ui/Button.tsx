"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg",
    "font-medium outline-none cursor-pointer select-none transition-colors active:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-60",
    "focus-visible:ring-2 focus-visible:ring-accent/40",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "bg-accent text-white hover:bg-accent-dark",
        secondary:
          "bg-panel border border-line text-ink/70 hover:border-accent hover:text-ink",
        ghost: "text-ink/70 hover:bg-ink/5 hover:text-ink",
        danger:
          "bg-panel border border-status-rejected text-status-rejected hover:bg-status-rejected/10",
        dark: "bg-ink text-canvas hover:opacity-90",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-11 px-5 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> &
  VariantProps<typeof buttonVariants> & {
    children?: React.ReactNode;
  };

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };

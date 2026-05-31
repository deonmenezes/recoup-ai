"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "subtle";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-white shadow-sm hover:bg-primary-hover active:bg-primary-hover disabled:bg-primary/50",
  secondary:
    "bg-surface text-ink border border-border-strong shadow-xs hover:bg-surface-2 hover:border-faint active:bg-canvas",
  ghost: "bg-transparent text-muted hover:bg-[#eef0f5] hover:text-ink active:bg-[#e6e8f0]",
  subtle: "bg-primary-soft text-primary hover:bg-primary-soft/70 active:bg-primary-soft",
  danger: "bg-danger text-white shadow-sm hover:bg-danger-ink active:bg-danger-ink disabled:bg-danger/50",
  success: "bg-success text-white shadow-sm hover:bg-success-ink active:bg-success-ink disabled:bg-success/50",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-6 text-[15px] gap-2.5 rounded-xl",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, leftIcon, rightIcon, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center font-medium whitespace-nowrap",
        "transition-[background-color,border-color,color,transform,box-shadow] duration-150",
        "active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
        "cursor-pointer",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        leftIcon && <span className="shrink-0" aria-hidden>{leftIcon}</span>
      )}
      {children}
      {!loading && rightIcon && <span className="shrink-0" aria-hidden>{rightIcon}</span>}
    </button>
  );
});

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required for a11y — icon-only buttons must be labelled. */
  label: string;
  size?: Size;
  variant?: Variant;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = "md", variant = "ghost", className, children, ...props },
  ref,
) {
  const dims = size === "sm" ? "size-8 rounded-md" : size === "lg" ? "size-12 rounded-xl" : "size-10 rounded-lg";
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center transition-colors duration-150 cursor-pointer",
        "active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        dims,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

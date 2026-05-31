import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
  as: Tag = "div",
  ...props
}: React.HTMLAttributes<HTMLElement> & { as?: React.ElementType }) {
  return (
    <Tag className={cn("card", className)} {...props}>
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-5 pt-4 pb-3", className)}>
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && <span className="text-subtle shrink-0">{icon}</span>}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink truncate">{title}</h3>
          {subtitle && <p className="text-xs text-subtle mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px bg-border", className)} aria-hidden />;
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-[11px] font-semibold uppercase tracking-wider text-subtle", className)}>{children}</p>
  );
}

export function KeyValue({
  label,
  value,
  mono,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-subtle">{label}</dt>
      <dd className={cn("mt-1 text-sm text-ink font-medium truncate", mono && "tnum")}>{value}</dd>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} aria-hidden />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center px-6 py-12", className)}>
      {icon && (
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-subtle text-pretty">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Lightweight CSS tooltip (keyboard + hover; no JS dependency). */
export function Tooltip({
  label,
  children,
  className,
  side = "top",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  side?: "top" | "bottom";
}) {
  return (
    <span className={cn("group/tt relative inline-flex", className)} tabIndex={0}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-[120] -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150",
          "group-hover/tt:opacity-100 group-focus/tt:opacity-100",
          side === "top" ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]",
        )}
      >
        {label}
      </span>
    </span>
  );
}

"use client";

import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

/** Accessible underline tabs (roving via native buttons; arrow keys optional). */
export function Tabs({
  items,
  active,
  onChange,
  className,
}: {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("flex items-center gap-1 border-b border-border", className)}>
      {items.map((it) => {
        const selected = it.id === active;
        return (
          <button
            key={it.id}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(it.id)}
            className={cn(
              "relative inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium transition-colors cursor-pointer",
              "after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:transition-all after:duration-200",
              selected
                ? "text-primary after:bg-primary"
                : "text-muted hover:text-ink after:bg-transparent",
            )}
          >
            {it.icon && <span className="shrink-0">{it.icon}</span>}
            {it.label}
            {typeof it.count === "number" && (
              <span
                className={cn(
                  "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tnum",
                  selected ? "bg-primary-soft text-primary" : "bg-[#eef0f5] text-subtle",
                )}
              >
                {it.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

import { AVATAR_PALETTES } from "@/lib/data";
import { initials } from "@/lib/format";
import { cn } from "@/lib/cn";

const SIZES = {
  xs: "size-7 text-[11px]",
  sm: "size-9 text-xs",
  md: "size-11 text-sm",
  lg: "size-14 text-lg",
  xl: "size-16 text-xl",
};

export function Avatar({
  name,
  palette = "indigo",
  size = "md",
  className,
  ring,
}: {
  name: string;
  palette?: string;
  size?: keyof typeof SIZES;
  className?: string;
  ring?: boolean;
}) {
  const [from, to] = AVATAR_PALETTES[palette] ?? AVATAR_PALETTES.indigo;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-sm",
        ring && "ring-2 ring-white",
        SIZES[size],
        className,
      )}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

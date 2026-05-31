import type { Tone } from "@/lib/data";

/** Shared tone → utility-class mapping so pills, badges, dots, and accents
 *  stay perfectly consistent across the app (UI/UX Pro Max: semantic tokens). */
export interface ToneClasses {
  soft: string; // soft background + readable ink for chips
  solid: string; // solid background for emphasis bars / fills
  text: string; // accent text color
  dot: string; // status dot
  border: string;
}

export const TONES: Record<Tone, ToneClasses> = {
  primary: {
    soft: "bg-primary-soft text-primary",
    solid: "bg-primary text-white",
    text: "text-primary",
    dot: "bg-primary",
    border: "border-primary/30",
  },
  success: {
    soft: "bg-success-soft text-success-ink",
    solid: "bg-success text-white",
    text: "text-success-ink",
    dot: "bg-success",
    border: "border-success/30",
  },
  warning: {
    soft: "bg-warning-soft text-warning-ink",
    solid: "bg-warning text-white",
    text: "text-warning-ink",
    dot: "bg-warning",
    border: "border-warning/30",
  },
  danger: {
    soft: "bg-danger-soft text-danger-ink",
    solid: "bg-danger text-white",
    text: "text-danger-ink",
    dot: "bg-danger",
    border: "border-danger/30",
  },
  info: {
    soft: "bg-info-soft text-info-ink",
    solid: "bg-info text-white",
    text: "text-info-ink",
    dot: "bg-info",
    border: "border-info/30",
  },
  neutral: {
    soft: "bg-[#eef0f5] text-[#4a5168]",
    solid: "bg-[#64708a] text-white",
    text: "text-muted",
    dot: "bg-[#9aa1b5]",
    border: "border-border-strong",
  },
};

/** Hex pair for charts/SVG fills that can't use Tailwind classes. */
export const TONE_HEX: Record<Tone, string> = {
  primary: "#4f46e5",
  success: "#0b9d6b",
  warning: "#c2790a",
  danger: "#e11d48",
  info: "#0284c7",
  neutral: "#94a3b8",
};

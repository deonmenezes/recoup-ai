// GridPath icon set — clean, geometric, neobrutalist inline SVGs.
// All icons share viewBox 0 0 24 24, stroke="currentColor" so they inherit
// the surrounding text color (reads BOLD black inside colored icon tiles).

import type { CSSProperties } from "react";

export type IconName =
  | "sun"
  | "battery"
  | "heat"
  | "plug"
  | "house"
  | "money"
  | "ruler"
  | "dollar"
  | "clock"
  | "tower"
  | "map"
  | "bolt"
  | "target"
  | "leaf"
  | "download"
  | "check"
  | "info"
  | "lock"
  | "pin"
  | "sparkle"
  | "back"
  | "phone"
  | "arrow-right";

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}

const PATHS: Record<IconName, React.ReactNode> = {
  sun: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M19.4 4.6l-1.8 1.8M6.4 17.6l-1.8 1.8" />
    </>
  ),
  battery: (
    <>
      <rect x="2.5" y="7" width="16" height="10" rx="2" />
      <path d="M21.5 10.5v3" />
      <path d="M7 12h5" />
    </>
  ),
  heat: (
    <>
      <path d="M9 3c1.8 2 1.8 3.8.5 5.8C8 11 8 13 9.5 15" />
      <path d="M15 3c1.8 2 1.8 3.8.5 5.8C14 11 14 13 15.5 15" />
      <path d="M5 19h14" />
      <path d="M5 22h14" />
    </>
  ),
  plug: (
    <>
      <path d="M9 2v5M15 2v5" />
      <path d="M6 7h12v3a6 6 0 0 1-12 0V7Z" />
      <path d="M12 16v6" />
    </>
  ),
  house: (
    <>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  money: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M5.5 9v6M18.5 9v6" />
    </>
  ),
  ruler: (
    <>
      <rect x="2.5" y="7" width="19" height="10" rx="2" transform="rotate(0 12 12)" />
      <path d="M7 7v3M11 7v4M15 7v3M19 7v4" />
    </>
  ),
  dollar: (
    <>
      <path d="M12 2.5v19" />
      <path d="M16.5 6.5c-1-1.3-2.6-2-4.5-2-2.5 0-4.5 1.3-4.5 3.4 0 2.4 2.4 3 4.5 3.6 2.1.6 4.5 1.2 4.5 3.6 0 2.1-2 3.4-4.5 3.4-1.9 0-3.5-.7-4.5-2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6.5V12l4 2.5" />
    </>
  ),
  tower: (
    <>
      <path d="M7 3 4 21M17 3l3 18" />
      <path d="M6.5 5h11M6 9h12M5 15h14" />
      <path d="M12 3v18" />
    </>
  ),
  map: (
    <>
      <path d="M9 4 3.5 6.2v13.3L9 17.3l6 2.2 5.5-2.2V4L15 6.2 9 4Z" />
      <path d="M9 4v13.3M15 6.2v13.3" />
    </>
  ),
  bolt: (
    <>
      <path d="M13 2 4 13.5h6L11 22l9-11.5h-6L13 2Z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  leaf: (
    <>
      <path d="M20 4C9 4 4 9.5 4 16c0 2 .7 3.4.7 3.4S11 19 15.5 14.5 20 4 20 4Z" />
      <path d="M5 19C8 14 12 10.5 16.5 8" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v11" />
      <path d="M7.5 10 12 14.5 16.5 10" />
      <path d="M4 19.5h16" />
    </>
  ),
  check: (
    <>
      <path d="M4.5 12.5 10 18 19.5 6.5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.5" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5" />
      <path d="M12 14v3" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21.5S5 14.6 5 9.5a7 7 0 0 1 14 0c0 5.1-7 12-7 12Z" />
      <circle cx="12" cy="9.5" r="2.6" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 2.5c.8 4.6 2.9 6.7 7.5 7.5-4.6.8-6.7 2.9-7.5 7.5-.8-4.6-2.9-6.7-7.5-7.5 4.6-.8 6.7-2.9 7.5-7.5Z" />
    </>
  ),
  back: (
    <>
      <path d="M11 5.5 4.5 12 11 18.5" />
      <path d="M4.5 12H20" />
    </>
  ),
  phone: (
    <>
      <path d="M5 3.5h4l1.5 5-2.3 1.8a13 13 0 0 0 5.5 5.5l1.8-2.3 5 1.5v4a1.8 1.8 0 0 1-2 1.8C11.3 21.4 2.6 12.7 3.2 5.5A1.8 1.8 0 0 1 5 3.5Z" />
    </>
  ),
  "arrow-right": (
    <>
      <path d="M4 12h15" />
      <path d="M13 5.5 19.5 12 13 18.5" />
    </>
  ),
};

export default function Icon({
  name,
  size = 24,
  strokeWidth = 2.6,
  className,
  style,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={{ display: "block", flexShrink: 0, ...style }}
    >
      {PATHS[name]}
    </svg>
  );
}

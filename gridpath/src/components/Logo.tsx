// GridPath logo — a bold neobrutalist mark: a chunky lightning bolt over a grid,
// flat green + gold fills with thick black outlines and hard edges.

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {/* solid green tile with thick black border + hard offset shadow */}
      <rect x="9" y="9" width="48" height="48" rx="11" fill="#141414" />
      <rect x="6" y="6" width="48" height="48" rx="11" fill="#1E7A4D" stroke="#141414" strokeWidth="3.5" />
      {/* faint grid lines on the tile */}
      <g stroke="#16613D" strokeWidth="2.4" strokeLinecap="round">
        <path d="M20 13v34M34 13v34" />
        <path d="M13 22h34M13 37h34" />
      </g>
      {/* bold gold lightning bolt */}
      <path
        d="M33 12 17 35h11l-3 17 19-25H31l5-15Z"
        fill="#F5C518"
        stroke="#141414"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LogoFull({
  size = 40,
  tagline = true,
  light = false,
}: {
  size?: number;
  tagline?: boolean;
  light?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <LogoMark size={size} />
      <div>
        <div
          className="brand-word"
          style={{ color: light ? "#FCFBF5" : "var(--forest)" }}
        >
          GridPath
        </div>
        {tagline && (
          <div className="brand-tag" style={{ color: light ? "#CFE0CE" : "var(--ink-muted)" }}>
            The fastest way to get clean energy.
          </div>
        )}
      </div>
    </div>
  );
}

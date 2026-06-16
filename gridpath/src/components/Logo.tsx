// GridPath logo — a stylized leaf/foliage mark with a winding "grid path" and a
// blooming flower, in the forest-green + cream + gold brand palette.

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
      {/* soft sage backdrop */}
      <path
        d="M10 38C8 25 19 15 31 15c14 0 24 9 24 21 0 13-11 18-24 18S12 51 10 38Z"
        fill="#CFE0CE"
      />
      {/* layered foliage */}
      <path
        d="M12 41c0-11 8-19 19-17-5 6-7 13-3 20-6 4-12 4-16-3Z"
        fill="#2F4A3C"
      />
      <path
        d="M30 45c0-11 9-20 22-16-5 8-7 15-3 22-9 0-15 0-19-6Z"
        fill="#46674F"
      />
      {/* winding grid path */}
      <path
        d="M15 51c9-6 13-4 19-10s12-4 18-10"
        stroke="#F2ECDD"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* flower */}
      <g transform="translate(43 17)">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse
            key={a}
            cx="0"
            cy="-6.4"
            rx="3.3"
            ry="6.4"
            fill="#FBFAF4"
            transform={`rotate(${a})`}
          />
        ))}
        <circle r="3.4" fill="#E0A82E" />
      </g>
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
          style={{ color: light ? "#F4F1EA" : "var(--forest)" }}
        >
          GridPath
        </div>
        {tagline && (
          <div className="brand-tag" style={{ color: light ? "#CFD9CB" : "var(--ink-muted)" }}>
            The fastest way to get clean energy.
          </div>
        )}
      </div>
    </div>
  );
}

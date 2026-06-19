// GridPath logo - a neobrutalist route-bolt hopping through grid nodes.

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
      <rect x="10" y="10" width="48" height="48" rx="11" fill="#141414" />
      <rect x="6" y="6" width="48" height="48" rx="11" fill="#1E7A4D" stroke="#141414" strokeWidth="3.5" />

      <g stroke="#186040" strokeWidth="2.25" strokeLinecap="round">
        <path d="M18 18H46M18 31H46M18 44H36" />
        <path d="M18 18V44M31 18V44M44 18V31" />
      </g>

      <g fill="#CFE0CE" stroke="#141414" strokeWidth="2.25">
        <circle cx="44" cy="18" r="3.15" />
        <circle cx="18" cy="31" r="3.15" />
        <circle cx="18" cy="44" r="3.15" />
        <circle cx="31" cy="44" r="3.15" />
      </g>

      <path
        d="M18 18H31L25 31H41L32 46L48 30"
        stroke="#141414"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 18H31L25 31H41L32 46L48 30"
        stroke="#F5C518"
        strokeWidth="5.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <g fill="#F5C518" stroke="#141414" strokeWidth="3">
        <circle cx="18" cy="18" r="4" />
        <circle cx="31" cy="18" r="4" />
        <circle cx="25" cy="31" r="4" />
        <circle cx="41" cy="31" r="4" />
        <circle cx="32" cy="46" r="4" />
      </g>
      <circle cx="48" cy="30" r="6.25" fill="#F5C518" stroke="#141414" strokeWidth="3.3" />
      <circle cx="48" cy="30" r="2" fill="#FCFBF5" />
      <path
        d="M48 22.4V18.7M55.6 30H59.3M42.6 35.4 40.1 37.9"
        stroke="#141414"
        strokeWidth="2.6"
        strokeLinecap="round"
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

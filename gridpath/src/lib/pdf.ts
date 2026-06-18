// Dependency-free PDF generator.
//
// We hand-write a minimal but valid PDF (standard Helvetica fonts, vector
// rectangles/lines, positioned text) so the "download your government
// application" feature ships with ZERO extra npm dependencies — nothing to
// break the Vercel build. It produces a clean, official-looking single-form
// document. Coordinates are expressed top-down (y grows downward) and converted
// to PDF's bottom-left origin internally.

type RGB = [number, number, number];

const PAGE_W = 612; // US Letter, points
const PAGE_H = 792;

// Brand palette (mirrors globals.css).
export const INK: RGB = [0.165, 0.165, 0.149];
export const MUTED: RGB = [0.435, 0.424, 0.376];
export const FOREST: RGB = [0.184, 0.29, 0.235];
export const GOLD: RGB = [0.878, 0.659, 0.18];
export const LINE: RGB = [0.78, 0.75, 0.68];
export const WHITE: RGB = [1, 1, 1];
export const PAPER: RGB = [0.984, 0.98, 0.957];

// Map common Unicode punctuation to its WinAnsiEncoding byte (so bullets, dashes
// and smart quotes render instead of being dropped to "?").
const WINANSI: Record<number, number> = {
  0x2022: 0x95, // • bullet
  0x2013: 0x96, // – en dash
  0x2014: 0x97, // — em dash
  0x2018: 0x91, // ' left single quote
  0x2019: 0x92, // ' right single quote
  0x201c: 0x93, // " left double quote
  0x201d: 0x94, // " right double quote
  0x2026: 0x85, // … ellipsis
};

/** Escape + sanitize a string for a PDF literal (WinAnsi / Latin-1). */
function pdfStr(s: string): string {
  let out = "";
  for (const ch of s) {
    let code = ch.codePointAt(0) ?? 63;
    if (WINANSI[code] !== undefined) code = WINANSI[code];
    const c = code <= 0xff ? String.fromCharCode(code) : "?";
    if (c === "(" || c === ")" || c === "\\") out += "\\" + c;
    else out += c;
  }
  return out;
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(3);
}

class PdfDoc {
  private pages: string[] = [];
  private cur = "";

  newPage() {
    if (this.cur) this.pages.push(this.cur);
    this.cur = "";
  }

  private y(top: number): number {
    return PAGE_H - top;
  }

  fill(c: RGB) {
    this.cur += `${fmt(c[0])} ${fmt(c[1])} ${fmt(c[2])} rg\n`;
  }
  stroke(c: RGB) {
    this.cur += `${fmt(c[0])} ${fmt(c[1])} ${fmt(c[2])} RG\n`;
  }

  rect(x: number, top: number, w: number, h: number, opts: { fill?: RGB; stroke?: RGB; lineWidth?: number } = {}) {
    const yBottom = this.y(top + h);
    if (opts.fill) this.fill(opts.fill);
    if (opts.stroke) this.stroke(opts.stroke);
    this.cur += `${fmt(opts.lineWidth ?? 1)} w\n${fmt(x)} ${fmt(yBottom)} ${fmt(w)} ${fmt(h)} re\n`;
    if (opts.fill && opts.stroke) this.cur += "B\n";
    else if (opts.fill) this.cur += "f\n";
    else this.cur += "S\n";
  }

  hline(x1: number, x2: number, top: number, c: RGB = LINE, lineWidth = 0.75) {
    const yy = this.y(top);
    this.stroke(c);
    this.cur += `${fmt(lineWidth)} w\n${fmt(x1)} ${fmt(yy)} m ${fmt(x2)} ${fmt(yy)} l S\n`;
  }

  text(s: string, x: number, top: number, opts: { size?: number; bold?: boolean; color?: RGB } = {}) {
    const size = opts.size ?? 10;
    const font = opts.bold ? "/F2" : "/F1";
    this.fill(opts.color ?? INK);
    // Baseline sits at top + size (so `top` is the cap line).
    const yy = this.y(top + size);
    this.cur += `BT ${font} ${fmt(size)} Tf ${fmt(x)} ${fmt(yy)} Td (${pdfStr(s)}) Tj ET\n`;
  }

  /** Crude width estimate for Helvetica (~0.5em average), good enough for right-align. */
  textWidth(s: string, size: number, bold = false): number {
    const per = bold ? 0.56 : 0.52;
    return s.length * size * per;
  }

  rightText(s: string, xRight: number, top: number, opts: { size?: number; bold?: boolean; color?: RGB } = {}) {
    const size = opts.size ?? 10;
    this.text(s, xRight - this.textWidth(s, size, opts.bold), top, opts);
  }

  build(): Blob {
    if (this.cur) this.pages.push(this.cur);
    if (this.pages.length === 0) this.pages.push("");

    const objects: string[] = [];
    // Reserve: 1 Catalog, 2 Pages, 3 F1, 4 F2, then per page (Page + Contents).
    const fontHelv = 3;
    const fontBold = 4;
    const firstPageObj = 5;
    const pageObjIds: number[] = [];

    this.pages.forEach((_, i) => pageObjIds.push(firstPageObj + i * 2));

    objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
    objects[2] = `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${this.pages.length} >>`;
    objects[fontHelv] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`;
    objects[fontBold] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`;

    this.pages.forEach((content, i) => {
      const pageId = firstPageObj + i * 2;
      const contentId = pageId + 1;
      objects[pageId] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
        `/Resources << /Font << /F1 ${fontHelv} 0 R /F2 ${fontBold} 0 R >> >> ` +
        `/Contents ${contentId} 0 R >>`;
      objects[contentId] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
    });

    // Assemble with an xref table.
    let body = "%PDF-1.4\n";
    const offsets: number[] = [];
    const count = objects.length; // index 0 unused
    for (let i = 1; i < count; i++) {
      offsets[i] = body.length;
      body += `${i} 0 obj\n${objects[i]}\nendobj\n`;
    }
    const xrefStart = body.length;
    body += `xref\n0 ${count}\n`;
    body += `0000000000 65535 f \n`;
    for (let i = 1; i < count; i++) {
      body += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    body += `trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    // Latin-1 string -> bytes (char codes are all <= 0xff after sanitizing).
    const bytes = new Uint8Array(body.length);
    for (let i = 0; i < body.length; i++) bytes[i] = body.charCodeAt(i) & 0xff;
    return new Blob([bytes], { type: "application/pdf" });
  }
}

// ---------------------------------------------------------------------------
// Government application form layout (Form GP-100)
// ---------------------------------------------------------------------------

export interface GovFormData {
  reference: string;
  date: string; // e.g. "June 18, 2026"
  address: string;
  lat: number;
  lon: number;
  parcelId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  propertyType: string;
  scenarioLabel: string; // "House connection" | "Standard service"
  modeLabel: string; // "Overhead" | "Underground"
  distanceFeet: number;
  needsTransformer: boolean;
  nearestPoint: string;
  timeline: string;
  gross: number;
  grants: { name: string; amount: number }[];
  totalApplied: number;
  net: number;
  percentOff: number;
}

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function buildApplicationPdf(d: GovFormData): Blob {
  const doc = new PdfDoc();
  const M = 48; // left margin
  const R = PAGE_W - M; // right edge
  const W = R - M;
  let y = 0;

  // ---- Header band ----
  doc.rect(0, 0, PAGE_W, 96, { fill: FOREST });
  doc.text("GridPath", M, 26, { size: 22, bold: true, color: WHITE });
  doc.text("RESIDENTIAL UTILITY SERVICE CONNECTION APPLICATION", M, 56, { size: 10, bold: true, color: WHITE });
  doc.text("State Public Utilities Commission · Office of Grid Access", M, 72, { size: 8.5, color: [0.85, 0.9, 0.85] });
  doc.rightText("FORM GP-100", R, 30, { size: 12, bold: true, color: GOLD });
  doc.rightText(`Ref: ${d.reference}`, R, 50, { size: 9, color: WHITE });
  doc.rightText(`Date: ${d.date}`, R, 64, { size: 9, color: [0.85, 0.9, 0.85] });

  y = 116;

  const section = (label: string) => {
    doc.rect(M, y, 4, 13, { fill: FOREST });
    doc.text(label, M + 12, y + 1, { size: 11, bold: true, color: FOREST });
    y += 22;
  };

  const field = (label: string, value: string) => {
    doc.text(label, M, y, { size: 8, bold: true, color: MUTED });
    doc.text(value || "—", M, y + 11, { size: 10.5, color: INK });
    doc.hline(M, R, y + 24, LINE);
    y += 30;
  };

  // Two fields side by side.
  const field2 = (l1: string, v1: string, l2: string, v2: string) => {
    const mid = M + W / 2 + 8;
    doc.text(l1, M, y, { size: 8, bold: true, color: MUTED });
    doc.text(v1 || "—", M, y + 11, { size: 10.5, color: INK });
    doc.text(l2, mid, y, { size: 8, bold: true, color: MUTED });
    doc.text(v2 || "—", mid, y + 11, { size: 10.5, color: INK });
    doc.hline(M, R, y + 24, LINE);
    y += 30;
  };

  // ---- A. Service address ----
  section("A.  SERVICE ADDRESS  (auto-populated)");
  field("PROPERTY ADDRESS", d.address);
  field2("LATITUDE", d.lat.toFixed(5), "LONGITUDE", d.lon.toFixed(5));
  field2("ASSESSOR PARCEL ID", d.parcelId, "PROPERTY TYPE", d.propertyType);

  // ---- B. Applicant ----
  section("B.  APPLICANT OF RECORD");
  field2("FULL NAME", d.applicantName, "PHONE", d.applicantPhone);
  field("EMAIL", d.applicantEmail);

  // ---- C. Connection details ----
  section("C.  CONNECTION DETAILS  (auto-populated)");
  field2("CONNECTION SCENARIO", d.scenarioLabel, "SERVICE TYPE", d.modeLabel);
  field2("DISTANCE TO GRID", `${d.distanceFeet} ft`, "NEW TRANSFORMER", d.needsTransformer ? "Required" : "Not required");
  field2("NEAREST GRID POINT", d.nearestPoint, "EST. TIMELINE", d.timeline);

  // ---- D. Cost & grant summary ----
  section("D.  COST & GRANT ASSISTANCE SUMMARY");
  doc.text("CONNECTION COST (OFFER)", M, y, { size: 8, bold: true, color: MUTED });
  doc.rightText(usd(d.gross), R, y - 2, { size: 12, bold: true, color: INK });
  doc.hline(M, R, y + 15, LINE);
  y += 24;

  doc.text("GRANTS & REBATES APPLIED", M, y, { size: 8, bold: true, color: MUTED });
  y += 15;
  for (const g of d.grants) {
    doc.text(`•  ${g.name}`, M + 6, y, { size: 9.5, color: INK });
    doc.rightText(`- ${usd(g.amount)}`, R, y, { size: 9.5, color: FOREST });
    y += 15;
  }
  doc.hline(M, R, y + 1, LINE);
  y += 10;
  doc.text("TOTAL ASSISTANCE APPLIED", M, y, { size: 9, bold: true, color: MUTED });
  doc.rightText(`- ${usd(d.totalApplied)}`, R, y, { size: 10.5, bold: true, color: FOREST });
  y += 20;

  // Net cost highlight box.
  doc.rect(M, y, W, 40, { fill: [0.867, 0.906, 0.867], stroke: FOREST, lineWidth: 1.2 });
  doc.text("NET COST AFTER GRANTS", M + 14, y + 9, { size: 9, bold: true, color: FOREST });
  doc.text(`You save ${d.percentOff}% vs the original offer`, M + 14, y + 23, { size: 8.5, color: MUTED });
  doc.rightText(usd(d.net), R - 14, y + 8, { size: 18, bold: true, color: FOREST });
  y += 50;

  // ---- E. Certification ----
  section("E.  APPLICANT CERTIFICATION");
  doc.text(
    "I certify that the information above is accurate to the best of my knowledge and authorize",
    M,
    y,
    { size: 8.5, color: MUTED }
  );
  doc.text(
    "the serving utility to review this request for grid interconnection and grant assistance.",
    M,
    y + 12,
    { size: 8.5, color: MUTED }
  );
  y += 36;
  doc.hline(M, M + 230, y + 12, INK, 0.75);
  doc.hline(R - 150, R, y + 12, INK, 0.75);
  doc.text("Signature", M, y + 18, { size: 8, color: MUTED });
  doc.text(`Date: ${d.date}`, R - 150, y + 18, { size: 8, color: MUTED });

  // ---- Footer ----
  doc.hline(M, R, PAGE_H - 56, LINE);
  doc.text(
    "This is an automatically generated demonstration form (GridPath Form GP-100). Estimates and grant",
    M,
    PAGE_H - 48,
    { size: 7.5, color: MUTED }
  );
  doc.text(
    "amounts are illustrative and based on public data; actual figures vary by utility and program eligibility.",
    M,
    PAGE_H - 38,
    { size: 7.5, color: MUTED }
  );

  return doc.build();
}

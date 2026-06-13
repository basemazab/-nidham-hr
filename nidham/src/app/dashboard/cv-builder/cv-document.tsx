// Client-safe CV presentation: 6 professional layouts × 8 color themes (used
// for live preview, print/PDF, public interactive pages) + a Word exporter.
// Only `import type` from cv-builder so AI/server deps never reach the client.

import type { CvData } from "@/lib/cv-builder";

export const EMPTY_CV: CvData = {
  full_name: "", headline: "", email: "", phone: "", location: "",
  links: [], summary: "", experience: [], education: [], skills: [],
  languages: [], certifications: [],
};

export type CvTemplate = "classic" | "sidebar" | "modern" | "elegant" | "bold" | "minimal";
export type CvColor = "navy" | "teal" | "burgundy" | "emerald" | "indigo" | "slate" | "ocean" | "rust";

export const CV_TEMPLATES: { key: CvTemplate; label: string; hint: string }[] = [
  { key: "classic", label: "كلاسيك", hint: "عمود واحد — الأنسب لرفع ATS" },
  { key: "sidebar", label: "عمودين", hint: "شريط جانبي ملوّن — احترافي وجذاب" },
  { key: "modern", label: "مودرن", hint: "هيدر ملوّن عريض" },
  { key: "bold", label: "جريء", hint: "حروف أولى دائرية + عناوين ملوّنة" },
  { key: "elegant", label: "أنيق", hint: "خطوط راقية وتوسيط" },
  { key: "minimal", label: "مينيمال", hint: "مساحات واسعة ونظافة" },
];

type Palette = { dark: string; accent: string; soft: string };
const COLORS: Record<CvColor, Palette> = {
  navy: { dark: "#0D1B2A", accent: "#C9A84C", soft: "#eef2f7" },
  teal: { dark: "#0f766e", accent: "#0891b2", soft: "#ecfeff" },
  burgundy: { dark: "#7f1d1d", accent: "#b45309", soft: "#fef2f2" },
  emerald: { dark: "#065f46", accent: "#059669", soft: "#ecfdf5" },
  indigo: { dark: "#3730a3", accent: "#6d28d9", soft: "#eef2ff" },
  slate: { dark: "#1e293b", accent: "#475569", soft: "#f1f5f9" },
  ocean: { dark: "#0c4a6e", accent: "#0284c7", soft: "#f0f9ff" },
  rust: { dark: "#7c2d12", accent: "#ea580c", soft: "#fff7ed" },
};
export const CV_COLORS: { key: CvColor; label: string; swatch: string }[] = [
  { key: "navy", label: "كحلي", swatch: "#0D1B2A" },
  { key: "teal", label: "تركواز", swatch: "#0f766e" },
  { key: "ocean", label: "أزرق", swatch: "#0c4a6e" },
  { key: "emerald", label: "أخضر", swatch: "#065f46" },
  { key: "indigo", label: "بنفسجي", swatch: "#3730a3" },
  { key: "burgundy", label: "نبيتي", swatch: "#7f1d1d" },
  { key: "rust", label: "نحاسي", swatch: "#7c2d12" },
  { key: "slate", label: "رمادي", swatch: "#1e293b" },
];

const isArabic = (s: string) => /[؀-ۿ]/.test(s);
const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("");

export function CvDocument({
  cv, print, template = "classic", color = "navy",
}: { cv: CvData; print?: boolean; template?: CvTemplate; color?: CvColor }) {
  const rtl = isArabic(cv.full_name + " " + cv.summary);
  const dir = rtl ? "rtl" : "ltr";
  const c = COLORS[color] ?? COLORS.navy;
  const serif = template === "elegant";
  const font = serif
    ? (rtl ? "'Amiri', Cairo, serif" : "Georgia, 'Times New Roman', serif")
    : (rtl ? "Cairo, Tahoma, sans-serif" : "Arial, Helvetica, sans-serif");

  const L = { rtl, c, font, template, T };
  if (template === "sidebar") return <SidebarLayout cv={cv} L={L} dir={dir} print={print} />;

  // Single-column family (classic / modern / bold / elegant / minimal)
  const banner = template === "modern" || template === "bold";
  const center = template === "elegant";
  const contacts = [cv.email, cv.phone, cv.location, ...cv.links].filter(Boolean);

  return (
    <div dir={dir} className={print ? "text-black" : ""} style={{ fontFamily: font, color: "#1f2937", background: "#fff", lineHeight: 1.55, fontSize: 14 }}>
      <div style={{
        background: banner ? c.dark : undefined, color: banner ? "#fff" : c.dark,
        padding: banner ? "26px 40px" : "38px 44px 14px",
        textAlign: center ? "center" : "start",
        borderBottom: banner ? `4px solid ${c.accent}` : (template === "minimal" ? "1px solid #e5e7eb" : `3px solid ${c.accent}`),
        marginBottom: 16, display: "flex", alignItems: "center", gap: 18,
        justifyContent: center ? "center" : "flex-start",
      }}>
        {template === "bold" && (
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: c.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, flexShrink: 0 }}>
            {initials(cv.full_name)}
          </div>
        )}
        <div style={{ textAlign: center ? "center" : "start" }}>
          <h1 style={{ fontSize: 27, fontWeight: 800, color: banner ? "#fff" : c.dark, margin: 0, letterSpacing: serif ? 1 : 0 }}>{cv.full_name || "الاسم الكامل"}</h1>
          {cv.headline && <div style={{ fontSize: 15, color: banner ? "rgba(255,255,255,0.85)" : c.accent, fontWeight: 700, marginTop: 3 }}>{cv.headline}</div>}
          {contacts.length > 0 && (
            <div dir="auto" style={{ fontSize: 12, color: banner ? "rgba(255,255,255,0.8)" : "#475569", marginTop: 7, display: "flex", flexWrap: "wrap", gap: "4px 12px", justifyContent: center ? "center" : "flex-start" }}>
              {contacts.map((x, i) => <span key={i}>{x}</span>)}
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 44px 26px" }}>
        <MainSections cv={cv} L={L} />
      </div>
    </div>
  );
}

// Section title style per template
function T(L: { c: Palette; template: CvTemplate; rtl: boolean }): React.CSSProperties {
  const { c, template, rtl } = L;
  switch (template) {
    case "bold":
      return { fontSize: 13, fontWeight: 800, color: c.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, display: "inline-block", borderBottom: `3px solid ${c.accent}`, paddingBottom: 2 };
    case "modern":
      return { fontSize: 13, fontWeight: 800, color: c.dark, borderRight: rtl ? `4px solid ${c.accent}` : undefined, borderLeft: rtl ? undefined : `4px solid ${c.accent}`, paddingInlineStart: 8, marginBottom: 8 };
    case "elegant":
      return { fontSize: 13, fontWeight: 700, color: c.dark, textAlign: "center", letterSpacing: 2, borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", padding: "4px 0", marginBottom: 8 };
    case "minimal":
      return { fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 };
    default: // classic
      return { fontSize: 13, fontWeight: 800, color: c.dark, textTransform: "uppercase", letterSpacing: rtl ? 0 : 1, borderBottom: "1px solid #e2e8f0", paddingBottom: 3, marginBottom: 8 };
  }
}

type Ctx = { rtl: boolean; c: Palette; font: string; template: CvTemplate; T: typeof T };

function Sec({ title, L, children }: { title: string; L: Ctx; children: React.ReactNode }) {
  return <section style={{ marginBottom: 14 }}><h2 style={L.T(L)}>{title}</h2>{children}</section>;
}

// Main column: summary + experience + education (+ skills/langs/certs for single-col)
function MainSections({ cv, L, mainOnly }: { cv: CvData; L: Ctx; mainOnly?: boolean }) {
  const { rtl, c } = L;
  return (
    <>
      {cv.summary && <Sec title={rtl ? "الملخص المهني" : "Summary"} L={L}><p style={{ margin: 0 }}>{cv.summary}</p></Sec>}
      {cv.experience.length > 0 && (
        <Sec title={rtl ? "الخبرات العملية" : "Experience"} L={L}>
          {cv.experience.map((ex, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                <strong style={{ color: c.dark }}>{ex.role}{ex.company ? ` — ${ex.company}` : ""}</strong>
                <span style={{ fontSize: 12, color: "#64748b" }}>{[ex.period, ex.location].filter(Boolean).join(" · ")}</span>
              </div>
              {ex.bullets.length > 0 && <ul style={{ margin: "4px 0 0", paddingInlineStart: 18 }}>{ex.bullets.map((b, j) => <li key={j} style={{ marginBottom: 2 }}>{b}</li>)}</ul>}
            </div>
          ))}
        </Sec>
      )}
      {cv.education.length > 0 && (
        <Sec title={rtl ? "التعليم" : "Education"} L={L}>
          {cv.education.map((ed, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                <strong style={{ color: c.dark }}>{ed.degree}{ed.institution ? ` — ${ed.institution}` : ""}</strong>
                <span style={{ fontSize: 12, color: "#64748b" }}>{ed.period}</span>
              </div>
              {ed.details && <div style={{ fontSize: 13, color: "#475569" }}>{ed.details}</div>}
            </div>
          ))}
        </Sec>
      )}
      {!mainOnly && cv.skills.length > 0 && (
        <Sec title={rtl ? "المهارات" : "Skills"} L={L}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {cv.skills.map((s, i) => <span key={i} style={{ fontSize: 12, background: c.soft, color: c.dark, borderRadius: 6, padding: "3px 10px" }}>{s}</span>)}
          </div>
        </Sec>
      )}
      {!mainOnly && cv.languages.length > 0 && <Sec title={rtl ? "اللغات" : "Languages"} L={L}><p style={{ margin: 0 }}>{cv.languages.join(" · ")}</p></Sec>}
      {!mainOnly && cv.certifications.length > 0 && <Sec title={rtl ? "الشهادات" : "Certifications"} L={L}><ul style={{ margin: 0, paddingInlineStart: 18 }}>{cv.certifications.map((x, i) => <li key={i}>{x}</li>)}</ul></Sec>}
    </>
  );
}

// Two-column layout with a colored sidebar.
function SidebarLayout({ cv, L, dir, print }: { cv: CvData; L: Ctx; dir: string; print?: boolean }) {
  const { rtl, c, font } = L;
  const sideTitle: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: c.accent, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 6px" };
  return (
    <div dir={dir} className={print ? "text-black" : ""} style={{ fontFamily: font, color: "#1f2937", background: "#fff", display: "flex", lineHeight: 1.5, fontSize: 13.5, minHeight: print ? "auto" : 600 }}>
      {/* Sidebar */}
      <aside style={{ width: "34%", background: c.dark, color: "#fff", padding: "28px 20px", boxSizing: "border-box" }}>
        <div style={{ width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: `2px solid ${c.accent}`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, margin: "0 auto 14px" }}>
          {initials(cv.full_name)}
        </div>
        {[cv.email, cv.phone, cv.location, ...cv.links].filter(Boolean).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h3 style={sideTitle}>{rtl ? "التواصل" : "Contact"}</h3>
            <div dir="auto" style={{ fontSize: 11.5, color: "rgba(255,255,255,0.85)", display: "flex", flexDirection: "column", gap: 4, wordBreak: "break-word" }}>
              {[cv.email, cv.phone, cv.location, ...cv.links].filter(Boolean).map((x, i) => <span key={i}>{x}</span>)}
            </div>
          </div>
        )}
        {cv.skills.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h3 style={sideTitle}>{rtl ? "المهارات" : "Skills"}</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {cv.skills.map((s, i) => <span key={i} style={{ fontSize: 11, background: "rgba(255,255,255,0.14)", color: "#fff", borderRadius: 5, padding: "2px 8px" }}>{s}</span>)}
            </div>
          </div>
        )}
        {cv.languages.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h3 style={sideTitle}>{rtl ? "اللغات" : "Languages"}</h3>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.85)", display: "flex", flexDirection: "column", gap: 3 }}>{cv.languages.map((x, i) => <span key={i}>{x}</span>)}</div>
          </div>
        )}
        {cv.certifications.length > 0 && (
          <div>
            <h3 style={sideTitle}>{rtl ? "الشهادات" : "Certifications"}</h3>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.85)", display: "flex", flexDirection: "column", gap: 3 }}>{cv.certifications.map((x, i) => <span key={i}>• {x}</span>)}</div>
          </div>
        )}
      </aside>
      {/* Main */}
      <main style={{ width: "66%", padding: "28px 26px", boxSizing: "border-box" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: c.dark, margin: 0 }}>{cv.full_name || "الاسم الكامل"}</h1>
        {cv.headline && <div style={{ fontSize: 14, color: c.accent, fontWeight: 700, marginBottom: 14 }}>{cv.headline}</div>}
        <MainSections cv={cv} L={L} mainOnly />
      </main>
    </div>
  );
}

// ── Word (.doc) export — always ATS-safe single-column ──
export function buildCvWordHtml(cv: CvData, color: CvColor = "navy"): string {
  const c = COLORS[color] ?? COLORS.navy;
  const rtl = isArabic(cv.full_name + " " + cv.summary);
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const contacts = [cv.email, cv.phone, cv.location, ...cv.links].filter(Boolean).map(esc).join(" • ");
  const sec = (t: string, inner: string) => inner ? `<h2 style="font-size:13px;color:${c.dark};border-bottom:1px solid #ccc;padding-bottom:3px;margin:14px 0 6px;">${t}</h2>${inner}` : "";
  const exp = cv.experience.map((ex) => `<p style="margin:0 0 2px;"><b style="color:${c.dark}">${esc(ex.role)}${ex.company ? " — " + esc(ex.company) : ""}</b> <span style="color:#666;font-size:11px;">${esc([ex.period, ex.location].filter(Boolean).join(" · "))}</span></p>${ex.bullets.length ? `<ul style="margin:0 0 10px;">${ex.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}`).join("");
  const edu = cv.education.map((ed) => `<p style="margin:0 0 6px;"><b style="color:${c.dark}">${esc(ed.degree)}${ed.institution ? " — " + esc(ed.institution) : ""}</b> <span style="color:#666;font-size:11px;">${esc(ed.period)}</span>${ed.details ? `<br><span style="font-size:12px;color:#555">${esc(ed.details)}</span>` : ""}</p>`).join("");
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${esc(cv.full_name || "CV")}</title></head>
<body dir="${rtl ? "rtl" : "ltr"}" style="font-family:${rtl ? "Cairo,Tahoma" : "Arial"};font-size:14px;color:#222;line-height:1.5;">
<h1 style="font-size:24px;color:${c.dark};margin:0;border-bottom:3px solid ${c.accent};padding-bottom:6px;">${esc(cv.full_name)}</h1>
${cv.headline ? `<p style="color:${c.accent};font-weight:bold;margin:4px 0;">${esc(cv.headline)}</p>` : ""}
${contacts ? `<p style="font-size:12px;color:#475569;margin:0 0 8px;">${contacts}</p>` : ""}
${sec(rtl ? "الملخص المهني" : "Summary", cv.summary ? `<p>${esc(cv.summary)}</p>` : "")}
${sec(rtl ? "الخبرات العملية" : "Experience", exp)}
${sec(rtl ? "التعليم" : "Education", edu)}
${sec(rtl ? "المهارات" : "Skills", cv.skills.length ? `<p>${cv.skills.map(esc).join(" • ")}</p>` : "")}
${sec(rtl ? "اللغات" : "Languages", cv.languages.length ? `<p>${cv.languages.map(esc).join(" · ")}</p>` : "")}
${sec(rtl ? "الشهادات" : "Certifications", cv.certifications.length ? `<ul>${cv.certifications.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "")}
</body></html>`;
}

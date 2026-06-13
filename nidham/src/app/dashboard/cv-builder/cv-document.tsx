// Client-safe CV presentation: the clean single-column ATS template (used for
// live preview, print/PDF, and the public interactive page) + a Word exporter.
// IMPORTANT: only `import type` from cv-builder so the AI/server deps never get
// pulled into the client bundle.

import type { CvData } from "@/lib/cv-builder";

export const EMPTY_CV: CvData = {
  full_name: "",
  headline: "",
  email: "",
  phone: "",
  location: "",
  links: [],
  summary: "",
  experience: [],
  education: [],
  skills: [],
  languages: [],
  certifications: [],
};

const NAVY = "#0D1B2A";
const GOLD = "#C9A84C";

// Arabic if the name has Arabic letters → RTL document, else LTR.
function isArabic(s: string) {
  return /[؀-ۿ]/.test(s);
}

export function CvDocument({ cv, print }: { cv: CvData; print?: boolean }) {
  const rtl = isArabic(cv.full_name + " " + cv.summary);
  const dir = rtl ? "rtl" : "ltr";
  const contacts = [cv.email, cv.phone, cv.location, ...cv.links].filter(Boolean);

  return (
    <div
      dir={dir}
      className={print ? "text-black" : ""}
      style={{
        fontFamily: rtl ? "Cairo, Tahoma, sans-serif" : "Arial, Helvetica, sans-serif",
        color: "#1f2937",
        background: "#fff",
        padding: print ? "0" : "40px 44px",
        lineHeight: 1.5,
        fontSize: 14,
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: `3px solid ${GOLD}`, paddingBottom: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: NAVY, margin: 0 }}>{cv.full_name || "الاسم الكامل"}</h1>
        {cv.headline && <div style={{ fontSize: 15, color: GOLD, fontWeight: 700, marginTop: 2 }}>{cv.headline}</div>}
        {contacts.length > 0 && (
          <div style={{ fontSize: 12, color: "#475569", marginTop: 6, display: "flex", flexWrap: "wrap", gap: "4px 12px" }} dir="auto">
            {contacts.map((c, i) => <span key={i}>{c}</span>)}
          </div>
        )}
      </div>

      {cv.summary && (
        <Section title={rtl ? "الملخص المهني" : "Summary"} rtl={rtl}>
          <p style={{ margin: 0 }}>{cv.summary}</p>
        </Section>
      )}

      {cv.experience.length > 0 && (
        <Section title={rtl ? "الخبرات العملية" : "Experience"} rtl={rtl}>
          {cv.experience.map((ex, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                <strong style={{ color: NAVY }}>{ex.role}{ex.company ? ` — ${ex.company}` : ""}</strong>
                <span style={{ fontSize: 12, color: "#64748b" }}>{[ex.period, ex.location].filter(Boolean).join(" · ")}</span>
              </div>
              {ex.bullets.length > 0 && (
                <ul style={{ margin: "4px 0 0", paddingInlineStart: 18 }}>
                  {ex.bullets.map((b, j) => <li key={j} style={{ marginBottom: 2 }}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {cv.education.length > 0 && (
        <Section title={rtl ? "التعليم" : "Education"} rtl={rtl}>
          {cv.education.map((ed, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                <strong style={{ color: NAVY }}>{ed.degree}{ed.institution ? ` — ${ed.institution}` : ""}</strong>
                <span style={{ fontSize: 12, color: "#64748b" }}>{ed.period}</span>
              </div>
              {ed.details && <div style={{ fontSize: 13, color: "#475569" }}>{ed.details}</div>}
            </div>
          ))}
        </Section>
      )}

      {cv.skills.length > 0 && (
        <Section title={rtl ? "المهارات" : "Skills"} rtl={rtl}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {cv.skills.map((s, i) => (
              <span key={i} style={{ fontSize: 12, background: "#f1f5f9", color: "#334155", borderRadius: 6, padding: "3px 10px" }}>{s}</span>
            ))}
          </div>
        </Section>
      )}

      {cv.languages.length > 0 && (
        <Section title={rtl ? "اللغات" : "Languages"} rtl={rtl}><p style={{ margin: 0 }}>{cv.languages.join(" · ")}</p></Section>
      )}
      {cv.certifications.length > 0 && (
        <Section title={rtl ? "الشهادات" : "Certifications"} rtl={rtl}>
          <ul style={{ margin: 0, paddingInlineStart: 18 }}>{cv.certifications.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, rtl, children }: { title: string; rtl: boolean; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 14 }}>
      <h2 style={{ fontSize: 13, fontWeight: 800, color: NAVY, textTransform: "uppercase", letterSpacing: rtl ? 0 : 1, borderBottom: "1px solid #e2e8f0", paddingBottom: 3, marginBottom: 8 }}>{title}</h2>
      {children}
    </section>
  );
}

// ── Word (.doc) export — Word opens HTML cleanly; keeps text selectable/ATS-safe ──
export function buildCvWordHtml(cv: CvData): string {
  const rtl = isArabic(cv.full_name + " " + cv.summary);
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const contacts = [cv.email, cv.phone, cv.location, ...cv.links].filter(Boolean).map(esc).join(" • ");
  const sec = (t: string, inner: string) => inner ? `<h2 style="font-size:13px;color:${NAVY};border-bottom:1px solid #ccc;padding-bottom:3px;margin:14px 0 6px;">${t}</h2>${inner}` : "";

  const exp = cv.experience.map((ex) => `
    <p style="margin:0 0 2px;"><b style="color:${NAVY}">${esc(ex.role)}${ex.company ? " — " + esc(ex.company) : ""}</b>
    <span style="color:#666;font-size:11px;"> ${esc([ex.period, ex.location].filter(Boolean).join(" · "))}</span></p>
    ${ex.bullets.length ? `<ul style="margin:0 0 10px;">${ex.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}`).join("");
  const edu = cv.education.map((ed) => `<p style="margin:0 0 6px;"><b style="color:${NAVY}">${esc(ed.degree)}${ed.institution ? " — " + esc(ed.institution) : ""}</b> <span style="color:#666;font-size:11px;">${esc(ed.period)}</span>${ed.details ? `<br><span style="font-size:12px;color:#555">${esc(ed.details)}</span>` : ""}</p>`).join("");

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${esc(cv.full_name || "CV")}</title></head>
<body dir="${rtl ? "rtl" : "ltr"}" style="font-family:${rtl ? "Cairo,Tahoma" : "Arial"};font-size:14px;color:#222;line-height:1.5;">
<h1 style="font-size:24px;color:${NAVY};margin:0;border-bottom:3px solid ${GOLD};padding-bottom:6px;">${esc(cv.full_name)}</h1>
${cv.headline ? `<p style="color:${GOLD};font-weight:bold;margin:4px 0;">${esc(cv.headline)}</p>` : ""}
${contacts ? `<p style="font-size:12px;color:#475569;margin:0 0 8px;">${contacts}</p>` : ""}
${sec(rtl ? "الملخص المهني" : "Summary", cv.summary ? `<p>${esc(cv.summary)}</p>` : "")}
${sec(rtl ? "الخبرات العملية" : "Experience", exp)}
${sec(rtl ? "التعليم" : "Education", edu)}
${sec(rtl ? "المهارات" : "Skills", cv.skills.length ? `<p>${cv.skills.map(esc).join(" • ")}</p>` : "")}
${sec(rtl ? "اللغات" : "Languages", cv.languages.length ? `<p>${cv.languages.map(esc).join(" · ")}</p>` : "")}
${sec(rtl ? "الشهادات" : "Certifications", cv.certifications.length ? `<ul>${cv.certifications.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>` : "")}
</body></html>`;
}

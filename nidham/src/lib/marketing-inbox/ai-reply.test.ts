import { describe, it, expect } from "vitest";
import { tryTemplateMatch, sanitizeReplyLinks } from "./ai-reply";

describe("sanitizeReplyLinks", () => {
  it("collapses an invented path to the homepage", () => {
    expect(
      sanitizeReplyLinks("حمّل الكتيب: https://www.nidhamhr.com/kiteb 📄"),
    ).toBe("حمّل الكتيب: https://www.nidhamhr.com 📄");
  });

  it("keeps a real path untouched", () => {
    const ok = "الأسعار هنا: https://www.nidhamhr.com/pricing";
    expect(sanitizeReplyLinks(ok)).toBe(ok);
  });

  it("keeps a real nested path (tools/...)", () => {
    const ok = "احسب: https://www.nidhamhr.com/tools/salary-calculator";
    expect(sanitizeReplyLinks(ok)).toBe(ok);
  });

  it("keeps the bare homepage", () => {
    const ok = "زورنا: https://www.nidhamhr.com";
    expect(sanitizeReplyLinks(ok)).toBe(ok);
  });

  it("fixes an invented path even without www", () => {
    expect(sanitizeReplyLinks("شوف http://nidhamhr.com/download-now")).toBe(
      "شوف https://www.nidhamhr.com",
    );
  });

  it("leaves non-nidham links alone", () => {
    const ok = "تابعنا على https://facebook.com/nidham";
    expect(sanitizeReplyLinks(ok)).toBe(ok);
  });
});

describe("tryTemplateMatch", () => {
  const templates = [
    { trigger_keywords: ["سعر", "كم"], reply_text: "الأسعار تبدأ من 750 جنيه" },
    { trigger_keywords: ["demo", "تجربة"], reply_text: "احجز demo مجاني" },
    { trigger_keywords: ["شكر"], reply_text: "العفو دائمًا في خدمتك" },
  ];

  it("returns null for empty templates", () => {
    const result = tryTemplateMatch({ userMessage: "السلام عليكم", templates: [] });
    expect(result).toBeNull();
  });

  it("matches one keyword", () => {
    const result = tryTemplateMatch({ userMessage: "عايز اعرف سعر النظام", templates });
    expect(result).toBe("الأسعار تبدأ من 750 جنيه");
  });

  it("matches second keyword in triggers", () => {
    const result = tryTemplateMatch({ userMessage: "كم سعر الباقة", templates });
    expect(result).toBe("الأسعار تبدأ من 750 جنيه");
  });

  it("matches demo keyword", () => {
    const result = tryTemplateMatch({ userMessage: "عايز اجرب demo", templates });
    expect(result).toBe("احجز demo مجاني");
  });

  it("returns null when no keywords match", () => {
    const result = tryTemplateMatch({ userMessage: "مرحبًا", templates });
    expect(result).toBeNull();
  });

  it("case-insensitive matching", () => {
    const result = tryTemplateMatch({ userMessage: "شكراً جزيلاً", templates });
    expect(result).toBe("العفو دائمًا في خدمتك");
  });

  it("arabic text with tashkeel", () => {
    const result = tryTemplateMatch({ userMessage: "بِكَم سعر الاشتراك", templates });
    expect(result).toBe("الأسعار تبدأ من 750 جنيه");
  });

  it("prefers first matching template", () => {
    const result = tryTemplateMatch({ userMessage: "شكراً كم سعركم", templates });
    expect(result).toBe("الأسعار تبدأ من 750 جنيه");
  });

  it("empty message returns null", () => {
    const result = tryTemplateMatch({ userMessage: "", templates });
    expect(result).toBeNull();
  });
});

// ============================================================================
// guide-content.ts — نِظّوم's knowledge map (the in-system onboarding guide)
// ============================================================================
//
// 100% static, hand-written per-page guidance. NO AI, NO network, NO keys —
// so the guide is instant, free, works offline, and can NEVER fail or stall.
// One entry per route (matched by longest prefix); a generic fallback ensures
// the guide always has something to say, even on an unmapped page.

export type GuidePage = {
  /** Route prefix this entry covers, e.g. "/dashboard/employees". */
  match: string;
  icon: string;
  title: string;
  /** One line: what this page is for. */
  what: string;
  /** 2-4 short "how to use it" steps. */
  steps: string[];
  /** Optional pro tip. */
  tip?: string;
};

export const GUIDE_PAGES: GuidePage[] = [
  {
    match: "/dashboard",
    icon: "🏠",
    title: "لوحة التحكم",
    what: "ده مركز نِظام — بتشوف منه نبضة شركتك كلها وتنبيهات الامتثال أول بأول.",
    steps: [
      "بصّ على «درع الامتثال» فوق — بيقولك لو في مخاطر غرامات.",
      "الكروت بتوريك عدد الموظفين والعملاء بسرعة.",
      "من القائمة الجانبية توصل لأي أداة في النظام.",
    ],
    tip: "افتح النظام كل صباح — هتلاقي اللي محتاج تاخد بالك منه قدامك على طول.",
  },
  {
    match: "/dashboard/employees",
    icon: "👥",
    title: "الموظفين",
    what: "هنا بتضيف وتدير بيانات فريقك كله — شخصية، مرتب، تأمينات، بنك.",
    steps: [
      "اضغط ➕ «إضافة موظف» لإضافة واحد بالتفصيل.",
      "أو استورد كل الموظفين دفعة واحدة من Excel/CSV.",
      "اضغط على أي موظف تشوف ملفه الكامل وتطبع نماذجه.",
    ],
    tip: "كود الموظف لازم يطابق رقمه على جهاز البصمة عشان الحضور يتربط تلقائي.",
  },
  {
    match: "/dashboard/attendance/import",
    icon: "📥",
    title: "استيراد الحضور",
    what: "ارفع ملف الحضور من أي جهاز بصمة — والنظام بيفهمه تلقائي.",
    steps: [
      "صدّر ملف Excel/CSV من برنامج جهاز البصمة.",
      "ارفعه هنا — الأعمدة بتتطابق تلقائيًا مهما كان تنسيقها.",
      "راجع النتيجة واعتمدها.",
    ],
    tip: "بنفهم أي تنسيق ملف من أي جهاز — مش لازم شكل معيّن.",
  },
  {
    match: "/dashboard/attendance/review",
    icon: "✅",
    title: "مراجعة واعتماد الحضور",
    what: "راجع سجلات الحضور قبل ما تتحسب في المرتبات.",
    steps: [
      "افحص الحضور والانصراف لكل موظف.",
      "عدّل أي سجل غلط، وبعدين اعتمد.",
      "الاعتماد بيخلّي المرتبات تاخد الأرقام الصح.",
    ],
    tip: "اعتمد الحضور أول الشهر قبل ما تعمل المرتبات.",
  },
  {
    match: "/dashboard/attendance",
    icon: "🕐",
    title: "الحضور والانصراف",
    what: "متابعة حضور فريقك يوم بيوم — يدوي أو من جهاز البصمة.",
    steps: [
      "سجّل الحضور يدوي، أو استورده من جهاز البصمة.",
      "راجع واعتمد السجلات قبل المرتبات.",
      "الغياب والتأخير بيأثروا على المرتب تلقائيًا.",
    ],
    tip: "اربط جهاز ZKTeco من «أجهزة البصمة» علشان الحضور ييجي لوحده.",
  },
  {
    match: "/dashboard/payroll",
    icon: "💰",
    title: "المرتبات",
    what: "حساب وصرف مرتبات الفريق بقانون العمل المصري بالكامل.",
    steps: [
      "اعمل كشف مرتبات لشهر.",
      "النظام بيحسب التأمينات والضرائب والأوفرتايم تلقائيًا.",
      "راجع، اعتمد، واطبع قسائم المرتب.",
    ],
    tip: "اعتمد الحضور الأول — المرتبات بتاخد منه الغياب والتأخير.",
  },
  {
    match: "/dashboard/loans",
    icon: "💵",
    title: "السلف والمرتجعات",
    what: "إدارة سلف الموظفين وتقسيطها على المرتبات.",
    steps: [
      "سجّل سلفة لموظف وحدد عدد الأقساط.",
      "القسط بيتخصم تلقائيًا من المرتب كل شهر.",
    ],
    tip: "تقدر تشوف رصيد سلف أي موظف من ملفه الشخصي.",
  },
  {
    match: "/dashboard/eos-calculator",
    icon: "⚖️",
    title: "مكافأة نهاية الخدمة",
    what: "حساب مستحقات نهاية الخدمة بالقانون المصري.",
    steps: [
      "اختار الموظف وتاريخ ترك الخدمة.",
      "النظام بيحسب المكافأة وباقي المستحقات.",
    ],
    tip: "بيطبّق المادة القانونية الصح حسب سبب ترك الخدمة.",
  },
  {
    match: "/dashboard/customers",
    icon: "🤝",
    title: "العملاء (CRM)",
    what: "إدارة عملائك وخط أنابيب المبيعات في مكان واحد.",
    steps: [
      "أضف عميل وحدد حالته في الـ Pipeline.",
      "سجّل تفاعلاتك ومكالماتك معاه.",
      "اربط العقود بالعميل.",
    ],
    tip: "تقدر تتواصل واتساب مع عملائك من «العملاء المحتملين».",
  },
  {
    match: "/dashboard/interactions",
    icon: "💬",
    title: "التفاعلات",
    what: "سجل كل تواصل حصل مع عملائك (مكالمات، اجتماعات، رسائل).",
    steps: ["سجّل تفاعل جديد واربطه بعميل.", "تابع تاريخ التواصل مع كل عميل."],
    tip: "كل ما تسجّل أكتر، الـ CRM بيبقى أذكى في متابعة عملائك.",
  },
  {
    match: "/dashboard/contracts",
    icon: "📋",
    title: "العقود",
    what: "عقود عملائك وتواريخ تجديدها — من غير ما يفوتك عقد.",
    steps: ["أضف عقد واربطه بعميل.", "النظام بينبّهك قبل انتهاء العقد."],
    tip: "العقود اللي قربت تنتهي بتظهر في تنبيهاتك تلقائيًا.",
  },
  {
    match: "/dashboard/compliance-shield",
    icon: "🛡️",
    title: "درع الامتثال",
    what: "بيرصد مخاطر الغرامات في شركتك قبل ما تتحوّل لمخالفة فعلية.",
    steps: ["بصّ على المخاطر المرصودة.", "اقفل كل بند عشان تحمي شركتك."],
    tip: "بيحسبلك تعرّضك التقديري للغرامات بالجنيه — رقم بيخوّف ويحميك.",
  },
  {
    match: "/dashboard/memo-studio",
    icon: "✒️",
    title: "مولّد المستندات الرسمية",
    what: "اكتب طلبك بالعامية، والنظام يطلّعلك مذكرة رسمية جاهزة للطباعة.",
    steps: [
      "اكتب اللي عايزه (مذكرة صرف، طلب موافقة…).",
      "راجع وعدّل المعاينة الحيّة.",
      "حمّل PDF أو Excel.",
    ],
    tip: "ضيف شعار شركتك من «هوية الشركة» يظهر في ترويسة كل مذكرة.",
  },
  {
    match: "/dashboard/forms",
    icon: "📄",
    title: "النماذج الرسمية",
    what: "نماذج HR جاهزة للطباعة: عقود، خطابات، نماذج تأمينات.",
    steps: [
      "اختار النموذج اللي محتاجه.",
      "بيتعبّى تلقائيًا ببيانات شركتك والموظف.",
      "اطبعه أو حمّله PDF.",
    ],
    tip: "افتح ملف موظف واضغط «نماذج» علشان النموذج يتعبّى ببياناته على طول.",
  },
  {
    match: "/dashboard/documents",
    icon: "📁",
    title: "المستندات والتراخيص",
    what: "حفظ مستندات الشركة ومتابعة تواريخ انتهائها.",
    steps: ["ارفع تراخيص ومستندات الشركة.", "حدد تاريخ الانتهاء عشان النظام ينبّهك."],
    tip: "السجل التجاري والبطاقة الضريبية أهم حاجة تتابع انتهاءها هنا.",
  },
  {
    match: "/dashboard/jobs/cv-analyzer",
    icon: "🔍",
    title: "تحليل السيرة الذاتية",
    what: "الـ AI بيحلل سيرة ذاتية ويقيّمها لمدى مناسبتها للوظيفة.",
    steps: ["ارفع أو الصق السيرة الذاتية.", "شوف التقييم والملاحظات والترشيح."],
    tip: "بيوفّر عليك ساعات في فرز عشرات الـ CVs.",
  },
  {
    match: "/dashboard/jobs",
    icon: "💼",
    title: "الوظائف والتوظيف",
    what: "انشر وظائف، استقبل المتقدمين، والـ AI بيفرزهم لك.",
    steps: [
      "أنشئ وظيفة جديدة.",
      "انشرها وانسخ رابط التقديم.",
      "الـ AI بيفحص ويرتّب المتقدمين.",
    ],
    tip: "زرّ «نسخ رابط التقديم» بيشتغل بعد ما تنشر الوظيفة (تخليها عامة).",
  },
  {
    match: "/dashboard/outreach",
    icon: "🎯",
    title: "العملاء المحتملين",
    what: "تنقيب وتواصل مع عملاء B2B جدد عبر واتساب.",
    steps: ["استورد عملاء أو ضيفهم يدوي.", "اضغط واتساب جنب كل واحد وابعتله الرسالة."],
    tip: "الرسايل بتتغيّر تلقائيًا لكل عميل عشان متبقاش متكررة (وآمنة من الحظر).",
  },
  {
    match: "/dashboard/marketing",
    icon: "📣",
    title: "التسويق",
    what: "أدوات تسويق وحملات تشتغل كلها على منتج شركتك إنت.",
    steps: [
      "اختار الأداة حسب احتياجك (إعلانات، إيميل، SEO، فيديو).",
      "كل أداة بتولّد محتوى لمنتجك.",
    ],
    tip: "«ماكينة العملاء» بتلاقيلك شركات حقيقية تتواصل معاها.",
  },
  {
    match: "/dashboard/settings/devices",
    icon: "🔌",
    title: "أجهزة البصمة",
    what: "اربط أجهزة البصمة بالنظام عشان الحضور ييجي تلقائي.",
    steps: [
      "جهاز ZKTeco/eSSL → ربط تلقائي لحظي.",
      "أي جهاز تاني → صدّر ملف الحضور واستورده.",
    ],
    tip: "بيشتغل مع أي جهاز بصمة بطريقة من الاتنين.",
  },
  {
    match: "/dashboard/settings/branding",
    icon: "🎨",
    title: "هوية الشركة",
    what: "ارفع شعار شركتك يظهر في ترويسة كل المستندات.",
    steps: ["ارفع الشعار (PNG/JPG/SVG).", "احفظ — هيظهر في المذكرات تلقائيًا."],
    tip: "الأفضل شعار بخلفية شفافة (PNG).",
  },
  {
    match: "/dashboard/team",
    icon: "👤",
    title: "الفريق والصلاحيات",
    what: "إدارة مستخدمي النظام وصلاحياتهم.",
    steps: ["ادعُ زميل بصلاحية (مدير/مشرف).", "حدد مين يشوف ويعدّل إيه."],
    tip: "الموظفين العاديين بيستخدموا تطبيق الموبايل، مش لوحة التحكم.",
  },
  {
    match: "/dashboard/subscription",
    icon: "💎",
    title: "الاشتراك",
    what: "خطتك الحالية والأيام المتبقية فيها.",
    steps: ["شوف تفاصيل خطتك.", "جدّد أو رقّي لو محتاج مميزات أكتر."],
    tip: "كل المميزات مفتوحة طول فترة التجربة.",
  },
  {
    match: "/dashboard/intelligence",
    icon: "🧠",
    title: "ذكاء الموارد البشرية",
    what: "مؤشرات وتحليلات ذكية عن فريقك وأداء الشركة.",
    steps: ["شوف معدل الدوران، متوسط المرتبات، وكتلة الأجور."],
    tip: "بيساعدك تاخد قرارات مبنية على أرقام مش إحساس.",
  },
  {
    match: "/dashboard/reports",
    icon: "📊",
    title: "التقارير",
    what: "تقارير وتحليلات جاهزة للتصدير والطباعة.",
    steps: ["اختار التقرير اللي محتاجه.", "صدّره Excel أو اطبعه."],
    tip: "تقارير الحضور والمرتبات هي أكتر حاجة هتستخدمها.",
  },
];

// Generic fallback — guarantees نِظّوم always has something to say.
export const GUIDE_FALLBACK: GuidePage = {
  match: "*",
  icon: "✨",
  title: "أداة في نِظام",
  what: "دي واحدة من أدوات نِظام — مصمّمة تكون واضحة وسهلة.",
  steps: [
    "استكشف الصفحة — أغلب الأزرار واضحة من اسمها.",
    "لو احتجت مساعدة مخصّصة، افتح الشات الذكي.",
  ],
  tip: "أنا نِظّوم — بظهرلك على كل صفحة جديدة أشرحهالك.",
};

// Longest-prefix match. "/dashboard" only matches exactly (so it isn't a
// catch-all for every sub-page); unmapped sub-pages fall to the generic guide.
export function getGuide(pathname: string): GuidePage {
  const exact = GUIDE_PAGES.find((p) => p.match === pathname);
  if (exact) return exact;
  const prefix = GUIDE_PAGES.filter(
    (p) =>
      p.match !== "/dashboard" &&
      (pathname === p.match || pathname.startsWith(p.match + "/")),
  ).sort((a, b) => b.match.length - a.match.length);
  return prefix[0] ?? GUIDE_FALLBACK;
}

export const GUIDE_PAGE_COUNT = GUIDE_PAGES.length;

// Guided first-run tour — نِظّوم navigates the user through the core flow.
export type TourStop = { route: string; title: string; msg: string };

export const TOUR: TourStop[] = [
  {
    route: "/dashboard",
    title: "أهلاً بيك! 🤖",
    msg: "أنا نِظّوم، هوريك النظام في دقيقة. ده مركز التحكم — منه بتشوف كل حاجة وتنبيهات الامتثال.",
  },
  {
    route: "/dashboard/employees",
    title: "الموظفين 👥",
    msg: "هنا فريقك. ابدأ بإضافة موظفينك واحد واحد، أو استوردهم كلهم دفعة من Excel.",
  },
  {
    route: "/dashboard/attendance",
    title: "الحضور 🕐",
    msg: "تابع الحضور والانصراف — يدوي أو من جهاز البصمة. ده اللي المرتبات بتعتمد عليه.",
  },
  {
    route: "/dashboard/payroll",
    title: "المرتبات 💰",
    msg: "احسب واصرف المرتبات بقانون العمل تلقائي — تأمينات وضرائب وأوفرتايم.",
  },
  {
    route: "/dashboard/forms",
    title: "النماذج 📄",
    msg: "عقود وخطابات ونماذج تأمينات جاهزة للطباعة، بتتعبّى ببيانات شركتك.",
  },
  {
    route: "/dashboard/compliance-shield",
    title: "درع الامتثال 🛡️",
    msg: "ده بيحميك من غرامات مكتب العمل والتأمينات. خلصنا الجولة — استكشف الباقي وأنا معاك! 🎉",
  },
];

// ============================================================================
// نِظّوم's conversational brain — rule-based intent matching. NO AI, NO keys,
// NO network: it normalizes Arabic, scores the message against keyword intents,
// and answers from the same page knowledge above. Instant + free + never fails.
// ============================================================================

// Arabic normalization: drop diacritics/tatweel, unify alef/ya/ta-marbuta/hamza
// so "إجازة" / "اجازه" / "أجازة" all match the same intent.
function norm(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

type Intent = {
  keys: string[];
  page?: string;
  special?: "tour" | "greet" | "thanks" | "who";
};

const INTENTS: Intent[] = [
  { special: "greet", keys: ["سلام", "صباح", "مساء", "ازيك", "ازايك", "اهلا", "هاي", "هلا", "hi", "hello", "عامل ايه"] },
  { special: "thanks", keys: ["شكرا", "تسلم", "ميرسي", "thanks", "thank"] },
  { special: "who", keys: ["مين انت", "انت مين", "اسمك", "نظوم", "تعمل ايه", "بتعمل ايه"] },
  { special: "tour", keys: ["جوله", "tour", "طوفني", "وريني النظام", "عرفني على النظام", "خدني في جوله"] },
  { page: "/dashboard/employees", keys: ["موظف", "موظفين", "فريق", "employee", "اضيف حد", "اضافه موظف", "العاملين", "استيراد موظفين"] },
  { page: "/dashboard/attendance/import", keys: ["استيراد الحضور", "رفع الحضور", "ملف بصمه", "ملف الحضور"] },
  { page: "/dashboard/attendance", keys: ["حضور", "انصراف", "غياب", "تاخير", "attendance"] },
  { page: "/dashboard/payroll", keys: ["مرتب", "مرتبات", "راتب", "رواتب", "payroll", "تامينات", "ضرايب", "اوفرتايم", "كشف مرتب"] },
  { page: "/dashboard/loans", keys: ["سلفه", "سلف", "قسط", "اقساط", "loan"] },
  { page: "/dashboard/eos-calculator", keys: ["نهايه الخدمه", "مكافاه", "مكافات", "ترك الخدمه", "استقاله"] },
  { page: "/dashboard/customers", keys: ["عميل", "عملاء", "crm", "مبيعات", "pipeline", "زباين"] },
  { page: "/dashboard/contracts", keys: ["عقد", "عقود", "تجديد عقد"] },
  { page: "/dashboard/memo-studio", keys: ["مذكره", "مذكرات", "خطاب", "صرف مستحقات", "مستند رسمي", "اكتبلي"] },
  { page: "/dashboard/forms", keys: ["نموذج", "نماذج", "فورم", "خطاب تعيين", "شهاده", "عقد عمل", "استماره"] },
  { page: "/dashboard/jobs", keys: ["وظيفه", "وظايف", "توظيف", "متقدم", "سيره ذاتيه", "cv", "تقديم", "اعلان وظيفه"] },
  { page: "/dashboard/compliance-shield", keys: ["امتثال", "غرامه", "غرامات", "مكتب العمل", "مخالفه", "قانون العمل"] },
  { page: "/dashboard/documents", keys: ["مستندات", "تراخيص", "ترخيص", "سجل تجاري", "بطاقه ضريبيه"] },
  { page: "/dashboard/settings/branding", keys: ["لوجو", "شعار", "هويه", "ترويسه", "logo"] },
  { page: "/dashboard/settings/devices", keys: ["جهاز", "بصمه", "zkteco", "اجهزه", "ماكينه"] },
  { page: "/dashboard/team", keys: ["صلاحيه", "صلاحيات", "ادعو", "permission", "role", "مستخدم جديد"] },
  { page: "/dashboard/subscription", keys: ["اشتراك", "خطه", "باقه", "سعر", "تجديد الاشتراك"] },
  { page: "/dashboard/reports", keys: ["تقرير", "تقارير", "report", "تصدير", "excel"] },
  { page: "/dashboard/intelligence", keys: ["تحليلات", "معدل دوران", "احصاءات", "مؤشرات", "ذكاء"] },
  { page: "/dashboard/outreach", keys: ["عملاء محتملين", "تنقيب", "واتساب", "outreach"] },
  { page: "/dashboard/marketing", keys: ["تسويق", "اعلان", "حمله", "ايميل تسويقي", "سوشيال", "marketing"] },
];

export const TOPIC_CHIPS = ["إزاي أضيف موظف؟", "إزاي أعمل مرتبات؟", "أربط جهاز البصمة", "خدني في جولة 🧭"];

export type GuideReply = { text: string; chips: string[]; goto?: string; tour?: boolean };

export function pageReplyText(p: GuidePage): string {
  const steps = p.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
  const tip = p.tip ? `\n\n💡 ${p.tip}` : "";
  return `${p.icon} ${p.title}\n${p.what}\n\n${steps}${tip}`;
}

// ── Task how-tos: accurate, CODE-GROUNDED step-by-steps for "عايز أعمل كذا".
// These are hand-written from the real flows so نِظّوم never hallucinates. ──
export type GuideTask = {
  keys: string[];
  title: string;
  steps: string[];
  goto?: string;
  note?: string;
};

export const TASKS: GuideTask[] = [
  {
    keys: ["اربط البصمه", "ربط البصمه", "ربط الجهاز", "اربط جهاز", "ربط جهاز", "جهاز بصمه", "zkteco", "اوصل البصمه", "الحضور التلقائي", "اضيف جهاز بصمه"],
    title: "ربط جهاز البصمة",
    steps: [
      "روح: الإعدادات ← أجهزة البصمة.",
      "سجّل الجهاز: اسمه + الرقم التسلسلي (SN) — تلاقيه في قائمة الجهاز: System Info ← SN.",
      "في الجهاز نفسه: Comm ← Cloud Server Setup (أو ADMS) واكتب: Server = nidhamhr.com · Port = 443 · Domain/HTTPS = ON · Path = /iclock.",
      "اعمل Restart للجهاز — أول ما يتصل يظهر «آخر اتصال»، وأول بصمة «آخر استلام».",
      "جهازك مش ZKTeco؟ صدّر ملف الحضور Excel/CSV من برنامجه واستورده من «استيراد الحضور» — بيتقرأ أي تنسيق.",
    ],
    goto: "/dashboard/settings/devices",
    note: "مهم جدًا: رقم الموظف على الجهاز (Enroll ID) لازم يساوي «كود الموظف» في النظام — وإلا مش هيعرف البصمة بتاعة مين.",
  },
  {
    keys: ["اضيف موظف", "اضافه موظف", "موظف جديد", "ادخل موظف", "اضيف حد", "تعيين موظف"],
    title: "إضافة موظف جديد",
    steps: [
      "روح: الموظفين.",
      "اضغط ➕ «إضافة موظف» واملأ بياناته (شخصية، مرتب، تأمينات، بنك).",
      "أو لو عددهم كبير: استورد كلهم دفعة من Excel/CSV.",
      "حدّد «كود الموظف» بحيث يطابق رقمه على جهاز البصمة عشان الحضور يتربط تلقائي.",
    ],
    goto: "/dashboard/employees",
  },
  {
    keys: ["استيراد موظفين", "رفع موظفين", "موظفين من excel", "اضيف موظفين كتير"],
    title: "استيراد الموظفين من Excel",
    steps: [
      "روح: الموظفين ← استيراد.",
      "ارفع ملف Excel/CSV ببيانات الموظفين.",
      "راجع التطابق واعتمد — بيتضافوا دفعة واحدة.",
    ],
    goto: "/dashboard/employees",
  },
  {
    keys: ["اعمل مرتبات", "عمل مرتبات", "كشف مرتب", "اطلع المرتبات", "مرتبات الشهر", "اعمل مرتب", "صرف المرتبات", "احسب المرتبات"],
    title: "عمل كشف مرتبات لشهر",
    steps: [
      "الأول اعتمد حضور الشهر من «مراجعة الحضور».",
      "روح: المرتبات ← اعمل دورة مرتب جديدة للشهر (بتحدد أيام العمل).",
      "افتح الدورة — النظام بيحسب لكل موظف: الأساسي + البدلات − التأمينات − الضرائب ± تعديلات الحضور والأوفرتايم.",
      "راجع الأرقام وعدّل أي بند، وبعدين «اعتمد» الدورة.",
      "سجّل الدفع (تبقى «مدفوعة») واطبع قسيمة مرتب لكل موظف.",
    ],
    goto: "/dashboard/payroll",
    note: "اعتماد الحضور قبل الدورة بيضمن إن الخصومات والأوفرتايم تتحسب صح تلقائي.",
  },
  {
    keys: ["استيراد الحضور", "رفع الحضور", "ملف الحضور", "استورد بصمات", "ملف بصمه"],
    title: "استيراد الحضور من ملف",
    steps: [
      "صدّر ملف الحضور (Excel/CSV) من برنامج جهاز البصمة.",
      "روح: الحضور ← استيراد، وارفع الملف — الأعمدة بتتطابق تلقائي.",
      "راجع النتيجة، وبعدها اعتمدها من «مراجعة الحضور».",
    ],
    goto: "/dashboard/attendance/import",
  },
  {
    keys: ["اعتمد الحضور", "مراجعه الحضور", "راجع الحضور", "تعديل الحضور"],
    title: "مراجعة واعتماد الحضور",
    steps: [
      "روح: الحضور ← مراجعة واعتماد.",
      "راجع حضور/انصراف كل موظف وعدّل أي سجل غلط.",
      "اعتمد — عشان المرتبات تاخد الأرقام الصح.",
    ],
    goto: "/dashboard/attendance/review",
  },
  {
    keys: ["سلفه", "سلف", "اعمل سلفه", "اصرف سلفه", "قسط", "مقدم مرتب"],
    title: "تسجيل سلفة لموظف",
    steps: [
      "روح: السلف والمرتجعات.",
      "سجّل سلفة جديدة: الموظف، المبلغ، وعدد الأقساط.",
      "القسط هيتخصم تلقائيًا من مرتبه كل شهر.",
    ],
    goto: "/dashboard/loans",
  },
  {
    keys: ["نهايه الخدمه", "مكافاه", "حساب نهايه الخدمه", "مستحقات استقاله", "فصل موظف", "ترك الخدمه"],
    title: "حساب مكافأة نهاية الخدمة",
    steps: [
      "روح: مكافأة نهاية الخدمة.",
      "اختار الموظف وتاريخ ترك الخدمة وسببه.",
      "النظام بيحسب المكافأة وباقي المستحقات بالقانون المصري.",
    ],
    goto: "/dashboard/eos-calculator",
  },
  {
    keys: ["اكتب مذكره", "مذكره", "مستند رسمي", "خطاب رسمي", "صرف مستحقات", "اكتبلي مذكره"],
    title: "كتابة مذكرة / مستند رسمي",
    steps: [
      "روح: مولّد المستندات الرسمية.",
      "اكتب طلبك بالعامية (مثلاً: مذكرة لإدارة الحسابات بصرف مستحقات فلان).",
      "اضغط «ولّد» — هيكتبها رسمية ويحسب أي مبالغ.",
      "عدّل المعاينة لو حبيت، وحمّل PDF أو Excel.",
    ],
    goto: "/dashboard/memo-studio",
    note: "ارفع شعار شركتك من «هوية الشركة» يظهر في ترويسة كل مذكرة.",
  },
  {
    keys: ["شعار", "لوجو", "هويه الشركه", "ارفع شعار", "ترويسه"],
    title: "رفع شعار الشركة",
    steps: [
      "روح: الإعدادات ← هوية الشركة.",
      "ارفع صورة الشعار (PNG/JPG/SVG) — بيتصغّر تلقائي.",
      "احفظ — هيظهر في ترويسة كل المستندات والنماذج.",
    ],
    goto: "/dashboard/settings/branding",
  },
  {
    keys: ["اطبع عقد", "عقد عمل", "خطاب تعيين", "نموذج", "شهاده", "استماره", "اطبع نموذج", "فورم", "اطبع خطاب"],
    title: "طباعة نموذج رسمي (عقد / خطاب / شهادة)",
    steps: [
      "روح: النماذج.",
      "اختار النموذج المطلوب (عقد عمل، خطاب تعيين، شهادة…).",
      "بيتعبّى تلقائي ببيانات شركتك — ولو فتحته من ملف موظف بيتعبّى ببياناته كمان.",
      "تقدر تعدّل عليه بزر «تعديل»، وبعدها اطبع أو حمّل PDF.",
    ],
    goto: "/dashboard/forms",
  },
  {
    keys: ["انشر وظيفه", "اعلان وظيفه", "توظيف", "وظيفه جديده", "استقبل متقدمين", "رابط تقديم"],
    title: "نشر وظيفة واستقبال المتقدمين",
    steps: [
      "روح: الوظائف ← أنشئ وظيفة جديدة.",
      "خلّيها «عامة/مفتوحة» وانشرها، وبعدها انسخ «رابط التقديم» وابعته.",
      "المتقدمين بيوصلوا للنظام والـAI بيفرزهم ويرتّبهم بالـScore.",
      "بيوصلك إشعار بكل متقدم جديد، يفتح صفحة الوظيفة بجدول المتقدمين.",
    ],
    goto: "/dashboard/jobs",
  },
  {
    keys: ["حلل سيره ذاتيه", "فحص cv", "cv", "سيره ذاتيه", "افحص متقدم"],
    title: "تحليل سيرة ذاتية بالـAI",
    steps: [
      "روح: تحليل السيرة الذاتية.",
      "ارفع أو الصق السيرة الذاتية.",
      "هتاخد تقييم + ملاحظات + مدى مناسبته للوظيفة.",
    ],
    goto: "/dashboard/jobs/cv-analyzer",
  },
  {
    keys: ["اضيف عميل", "عميل جديد", "عملاء", "crm", "مبيعات"],
    title: "إضافة عميل وإدارة المبيعات",
    steps: [
      "روح: العملاء.",
      "أضف عميل وحدد حالته في خط الأنابيب (Pipeline).",
      "سجّل تفاعلاتك معاه واربط عقوده.",
    ],
    goto: "/dashboard/customers",
  },
  {
    keys: ["ادعو", "صلاحيه", "صلاحيات", "اضيف مدير", "اضيف مستخدم", "permission", "فريق العمل"],
    title: "دعوة مستخدم / تحديد صلاحيات",
    steps: [
      "روح: الفريق والصلاحيات.",
      "ادعُ زميل بإيميله وحدد صلاحيته (مدير/مشرف).",
      "هيستلم دعوة يعمل بيها حساب.",
    ],
    goto: "/dashboard/team",
    note: "الموظفين العاديين بيستخدموا تطبيق الموبايل مش لوحة التحكم.",
  },
  {
    keys: ["عملاء محتملين", "واتساب", "تنقيب", "ابعت رساله", "outreach", "عملاء جدد"],
    title: "التواصل مع عملاء محتملين عبر واتساب",
    steps: [
      "روح: العملاء المحتملين.",
      "استورد عملاء أو ضيفهم.",
      "اضغط زر واتساب جنب كل واحد — بتفتح المحادثة برسالة جاهزة (بتتغير لكل واحد).",
    ],
    goto: "/dashboard/outreach",
  },
  {
    keys: ["امتثال", "غرامات", "مكتب العمل", "مخالفات", "درع الامتثال"],
    title: "متابعة الامتثال وتجنّب الغرامات",
    steps: [
      "روح: درع الامتثال.",
      "شوف المخاطر المرصودة وتعرّضك التقديري للغرامات.",
      "اقفل كل بند عشان تحمي شركتك.",
    ],
    goto: "/dashboard/compliance-shield",
  },
  {
    keys: ["ارفع مستند", "ترخيص", "سجل تجاري", "بطاقه ضريبيه", "مستندات الشركه"],
    title: "رفع مستندات وتراخيص الشركة",
    steps: [
      "روح: المستندات والتراخيص.",
      "ارفع الترخيص/المستند وحدد تاريخ انتهائه.",
      "النظام هينبّهك قبل ما ينتهي.",
    ],
    goto: "/dashboard/documents",
  },
];

function taskReply(t: GuideTask): GuideReply {
  const steps = t.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
  const note = t.note ? `\n\n💡 ${t.note}` : "";
  return { text: `🛠️ ${t.title}\n\n${steps}${note}`, chips: TOPIC_CHIPS.slice(0, 3), goto: t.goto };
}

function scoreKeys(q: string, keys: string[]): number {
  let s = 0;
  for (const k of keys) {
    const nk = norm(k);
    if (nk && q.includes(nk)) s += nk.length; // longer match = stronger signal
  }
  return s;
}

export function respond(query: string): GuideReply {
  const q = norm(query);
  if (!q) return { text: "اكتبلي سؤالك وأنا أساعدك 🙂", chips: TOPIC_CHIPS };

  // Score the three layers, then prefer the most specific (task > special > page).
  let bestTask: GuideTask | null = null;
  let taskScore = 0;
  for (const t of TASKS) {
    const sc = scoreKeys(q, t.keys);
    if (sc > taskScore) {
      taskScore = sc;
      bestTask = t;
    }
  }

  let bestSpecial: Intent | null = null;
  let specialScore = 0;
  let bestPage: Intent | null = null;
  let pageScore = 0;
  for (const it of INTENTS) {
    const sc = scoreKeys(q, it.keys);
    if (it.special) {
      if (sc > specialScore) {
        specialScore = sc;
        bestSpecial = it;
      }
    } else if (it.page) {
      if (sc > pageScore) {
        pageScore = sc;
        bestPage = it;
      }
    }
  }

  // An explicit tour request always wins.
  if (bestSpecial?.special === "tour" && specialScore >= taskScore)
    return { text: "يلا نبدأ جولة سريعة في النظام! 🧭", chips: [], tour: true };

  // Actionable how-to wins when it matches at least as strongly as the rest.
  if (bestTask && taskScore > 0 && taskScore >= pageScore && taskScore >= specialScore)
    return taskReply(bestTask);

  if (bestSpecial && specialScore > 0 && specialScore >= pageScore) {
    if (bestSpecial.special === "greet")
      return { text: "أهلاً بيك! 👋 أنا نِظّوم، مرشدك في النظام. قوللي عايز تعمل إيه (زي «عايز أربط البصمة») أو خد جولة سريعة.", chips: TOPIC_CHIPS };
    if (bestSpecial.special === "thanks")
      return { text: "العفو 😊 أي وقت تحتاجني أنا هنا في الركن.", chips: TOPIC_CHIPS };
    if (bestSpecial.special === "who")
      return {
        text: "أنا نِظّوم 🤖 — مرشد نِظام. قوللي «عايز أعمل كذا» وأديك الخطوات بالظبط، وأمشي معاك صفحة بصفحة — كله جوّاك من غير إنترنت ولا توقّف.",
        chips: TOPIC_CHIPS,
      };
    if (bestSpecial.special === "tour")
      return { text: "يلا نبدأ جولة سريعة في النظام! 🧭", chips: [], tour: true };
  }

  if (bestPage?.page && pageScore > 0) {
    const page = GUIDE_PAGES.find((p) => p.match === bestPage!.page);
    if (page)
      return { text: pageReplyText(page), chips: ["افتح الصفحة دي ←", ...TOPIC_CHIPS.slice(0, 2)], goto: page.match };
  }

  return {
    text: "مش متأكد فهمت قصدك بالظبط 🤔 قوللي اللي عايز تعمله (مثلاً: «عايز أربط البصمة» أو «عايز أعمل مرتبات») وأديك الخطوات، أو اختار من تحت 👇",
    chips: TOPIC_CHIPS,
  };
}

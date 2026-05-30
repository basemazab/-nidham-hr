## إعداد GROQ_API_KEY (للتكرارية في AI)
Groq مجاني ويعطي 30 RPM → يمنع توقف AI لو Gemini ضرب quota.

1. افتح https://console.groq.com/keys
2. سجّل بـ GitHub/Gmail
3. اضغط "Create API Key"
4. انسخ الـ key (يبدأ بـ `gsk_`)
5. أضفه في Vercel:
   ```
   vercel env add GROQ_API_KEY production
   ```
   والصق الـ key وادخل `y`
6. وأضفه محليًا:
   ```
   echo "GROQ_API_KEY=gsk_..." >> .env.local
   ```

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Prompts مرجعية — من [Pythonation gist](https://gist.github.com/Pythonation/6c8fd844915ba57ee6a90a28798ca06f)

### 1. التخطيط (The Planning Protocol)
قبل أي تغيير كبير: Think Before Coding. أوضح الافتراضات، اسأل عن الغموض، التزم بأبسط حل، وثّق TECH_STACK/SYSTEM_FLOW/ARCHITECTURE في PROJECT_MAP.md. لا تكتب كود قبل الموافقة.

### 2. التنفيذ (The Execution Engine)
Simplicity First. نفّذ ← تحقق ← حدّث PROJECT_MAP.md. لا placeholders، لا TODO. Loop Until Verified. كل خطوة تخدم [SYSTEM_FLOW].

### 3. التعديل الجراحي (Surgical Editing Protocol)
المس فقط ما يجب لمسه. طابق أسلوب الكود الحالي. حلّل التأثير قبل التغيير. اقرأ PROJECT_MAP.md أولاً. لا توسع النطاق.

### 4. التشخيص والإنقاذ (The Diagnostic & Rescue Protocol)
Zero Guesswork. قبل كتابة أي كود: اجمع الأدلة (stack traces, logs, terminal). Reproduce → Bottom-Up RCA → Micro-Patching → Regression Test → Clean-Up.

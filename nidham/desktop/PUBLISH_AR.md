# نشر تطبيق سطح المكتب — من البناء لزر التحميل في الموقع

زر «نزّل لويندوز» في الصفحة الرئيسية بيوجّه لرابط قابل للضبط. الخطوات دي بتبني الـ `Setup.exe`، تنشره، وتربط الزر بيه.

## 1) ابنِ الـ Setup.exe (على ويندوز)
```powershell
cd nidham/desktop
npm install          # أول مرة (~3 دقائق + تحميل Electron)
npm run make         # ~5 دقائق
```
الناتج:
```
nidham/desktop/out/make/squirrel.windows/x64/Nidham-1.0.0 Setup.exe
```
ده الملف اللي المستخدم بيشغّله — بيثبّت في `%LOCALAPPDATA%\Nidham\` ويضيف أيقونة سطح المكتب + قائمة ابدأ.

## 2) انشر الملف (عشان يبقى قابل للتحميل من أي حد)

**الأفضل: GitHub Releases (مجاني).** لازم الـ repo يكون **public** عشان أي حد ينزّل من غير تسجيل دخول.

عبر واجهة GitHub:
1. افتح صفحة الـ repo → **Releases** → **Draft a new release**.
2. Tag: `desktop-v1.0.0` — Title: `Nidham Desktop 1.0.0`.
3. اسحب ملف `Nidham-1.0.0 Setup.exe` في خانة المرفقات (Assets).
4. **Publish release**.

أو عبر سطر الأوامر (لو عندك GitHub CLI):
```powershell
gh release create desktop-v1.0.0 "out/make/squirrel.windows/x64/Nidham-1.0.0 Setup.exe" --title "Nidham Desktop 1.0.0" --notes "أول إصدار لتطبيق سطح المكتب"
```

> ⚠️ لو الـ repo **private**: الإصدارات مش هتنزّل للعامة. الحل: repo عام منفصل للإصدارات، أو ارفع الـ exe على أي استضافة ملفات عامة وحط رابطها المباشر في الخطوة 3.

## 3) اربط الزر بالملف (مرة واحدة)
زي الافتراضي، الزر بيوجّه لـ `https://github.com/basemazab/-nidham-hr/releases/latest`. لو عايز يوجّه للملف مباشرة، أضف المتغير ده في Vercel ثم Redeploy:
```
NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL = https://github.com/<user>/<repo>/releases/latest/download/Nidham-1.0.0.Setup.exe
```
(أو أي رابط مباشر للملف على استضافتك.)

## 4) (اختياري لكن مهم للاحتراف)
- **التوقيع الرقمي (Code Signing):** شهادة Authenticode (~300$/سنة) بتشيل تحذير ويندوز «ناشر غير معروف». من غيرها المستخدم بيضغط «More info → Run anyway».
- **التحديث التلقائي:** نقاط ربط `electron-updater` موجودة — تتفعّل في مرحلة لاحقة.
- **التشغيل بدون إنترنت:** التطبيق عميل بيتصل بسيرفر. لتشغيل بدون نت، ثبّت `nidham/enterprise` (Docker) على جهاز/سيرفر في الشبكة، وأول ما تفتح التطبيق اكتب عنوانه المحلي (مثلاً `http://192.168.1.10:3001`).

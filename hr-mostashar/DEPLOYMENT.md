# دليل النشر — مستشار HR

> هذا الملف يحتوي خطوات نشر المشروع على خدمات مجانية بالكامل.

## 📋 المتطلبات قبل النشر

1. حساب على **GitHub**
2. حساب على **Google AI Studio** للحصول على مفتاح Gemini
3. حساب **Vercel** (مجاني)
4. حساب **Render** أو **Railway** (مجاني)
5. بوت تليجرام من **BotFather**

---

## المرحلة 1: إعداد قاعدة البيانات

### الخيار أ: SQLite (للبداية السريعة)
لا تحتاج إعداد. الملف `hr_mostashar.db` يتولّد تلقائياً.

```
DATABASE_URL=sqlite+aiosqlite:///./hr_mostashar.db
```

### الخيار ب: PostgreSQL على Supabase (للمدى الطويل)
1. ادخل على [supabase.com](https://supabase.com)
2. أنشئ مشروع جديد
3. انسخ Connection String
4. عدّل `DATABASE_URL` في `.env`

```
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname
```

---

## المرحلة 2: نشر Backend على Render

### الخطوة 1: اربط المشروع بـ GitHub
```bash
cd hr-mostashar
git init
git add .
git commit -m "Initial commit"
git push origin main
```

### الخطوة 2: أنشئ Web Service على Render
1. ادخل على [render.com](https://render.com)
2. Dashboard → New → Web Service
3. اربط مستودع GitHub
4. الإعدادات:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Python Version:** 3.11

### الخطوة 3: أضف Environment Variables
في Render Dashboard → Environment:

```
APP_ENV=production
DEBUG=false
SECRET_KEY=<random-string-64-chars>
DATABASE_URL=sqlite+aiosqlite:///./data/hr_mostashar.db
GEMINI_API_KEY=<your-gemini-api-key>
JWT_SECRET_KEY=<random-string-64-chars>
ADMIN_EMAIL=admin@hrmostashar.com
ADMIN_PASSWORD=<strong-password>
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
VODAFONE_CASH_NUMBER=010XXXXXXXX
INSTAPAY_NUMBER=010XXXXXXXX
BANK_NAME=Example Bank
BANK_ACCOUNT=XXXX-XXXX-XXXX-XXXX
```

---

## المرحلة 3: نشر Frontend على Vercel

### الخطوة 1: أنشئ ملف `.env.local` في frontend
```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

### الخطوة 2: اربط بـ Vercel
1. ادخل على [vercel.com](https://vercel.com)
2. Add New Project
3. اربط مستودع GitHub
4. Root Directory: `frontend`
5. Framework Preset: Next.js
6. Build Command: `npm run build`
7. Output Directory: `.next`

---

## المرحلة 4: نشر Telegram Bot

### الخطوة 1: احصل على Token
1. افتح @BotFather في تليجرام
2. `/newbot`
3. اختار اسم البوت
4. انسخ الـ Token

### الخطوة 2: انشر على Render
1. New → Web Service (أو Cron Job)
2. Root Directory: `telegram-bot`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `python bot.py`
5. Environment:

```
TELEGRAM_BOT_TOKEN=<your-bot-token>
BACKEND_URL=https://your-backend.onrender.com
```

---

## المرحلة 5: التحقق من التشغيل

### اختبار API
```bash
# Health check
curl https://your-backend.onrender.com/health

# Register
curl -X POST https://your-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","full_name":"Test User","password":"password123"}'
```

### اختبار Frontend
افتح `https://your-frontend.vercel.app` في المتصفح.

### اختبار Telegram Bot
افتح البوت في تليجرام واكتب `/start`.

---

## 🔄 تحديث المشروع

```bash
git add .
git commit -m "update description"
git push origin main
```

Render و Vercel سينشرون التحديث تلقائياً.

---

## 💰 التكلفة الشهرية (مجانية بالكامل)

| الخدمة | التكلفة |
|--------|---------|
| Vercel (Frontend) | $0 |
| Render (Backend) | $0 |
| Render (Bot) | $0 |
| SQLite (Database) | $0 |
| Gemini API | $0 (1500 req/day) |
| **الإجمالي** | **$0** |

---

## ⚠️ ملاحظات مهمة

1. **Render Free Tier** ينام بعد 15 دقيقة من عدم الاستخدام. أول طلب هيأخده 30-60 ثانية.
2. **Gemini Free Tier** 1500 طلب/يوم — كافي لـ 100 مستخدم.
3. **Vercel Free Tier** 100GB bandwidth/شهر.
4. لو عدد المستخدمين زاد، انتقل لـ PostgreSQL على Supabase.
5. خلي `SECRET_KEY` و `JWT_SECRET_KEY` سريين ومتفردن.

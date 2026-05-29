# مستشار HR — مساعد قانون العمل المصري الذكي

![Navy](https://via.placeholder.com/12x12/0D1B2A/0D1B2A) **مستشار HR** هو منصة ذكية تجاوب على أسئلة قانون العمل المصري والتأمينات الاجتماعية، مع حاسبات HR ومكتبة نماذج جاهزة.

> **مطور بواسطة:** HR BASEM AZAB

## 🚀 المميزات

### 💬 محادثة ذكية بالذكاء الاصطناعي
- أسئلة قانونية بالعامية المصرية
- إجابات دقيقة مع مراجع المواد القانونية
- محادثات سابقة محفوظة

### 🧮 حاسبات تفاعلية
- **حاسبة مكافأة نهاية الخدمة** — حسب المادة 122
- **حاسبة التأمينات الاجتماعية** — العامل وصاحب العمل
- **حاسبة الإجازات** — رصيد سنوي وطارئ ومرضي
- **حاسبة الراتب الصافي** — بعد التأمينات والضريبة

### 📄 مكتبة النماذج (20 نموذج)
- عقود عمل (محدد، غير محدد، تجربة، جزئي، استشاري)
- إنذارات وجزاءات (5 نماذج)
- نماذج إدارية (تعيين، شهادة خبرة، إخلاء طرف، استقالة)
- نماذج HR متخصصة (إجازات، تقييم أداء، محضر تحقيق)

### 💎 نظام اشتراكات
| الخطة | السعر | المميزات |
|-------|-------|----------|
| مجاني | 0 جنيه | 5 أسئلة/شهر، 3 نماذج/شهر |
| Pro | 49 جنيه/شهر | غير محدود |
| أعمال | 299 جنيه/شهر | 5 مستخدمين + API |
| مدى الحياة | 999 جنيه | كل مميزات Pro للأبد |

## 🏗️ المعمارية التقنية

```
┌─────────────────┐    ┌─────────────────┐
│   Web App       │    │  Telegram Bot   │
│  (Next.js 14)   │    │   (Python)      │
└────────┬────────┘    └────────┬────────┘
         │                      │
         └──────────┬───────────┘
                    │
         ┌──────────▼──────────┐
         │   FastAPI Backend   │
         │  (Python 3.11+)     │
         └──────────┬──────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
   ┌────▼───┐  ┌────▼────┐  ┌──▼──────┐
   │ SQLite │  │ Gemini  │  │  Redis  │
   │   DB   │  │   API   │  │ (cache) │
   └────────┘  └─────────┘  └─────────┘
```

## 📁 هيكل المشروع

```
hr-mostashar/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── main.py            # التطبيق الرئيسي
│   │   ├── config.py          # الإعدادات
│   │   ├── database.py        # قاعدة البيانات
│   │   ├── models/            # نماذج SQLAlchemy
│   │   ├── routers/           # نقاط API
│   │   ├── services/          # خدمات (AI، PDF، حاسبات)
│   │   ├── knowledge_base/    # القانون والمرجعية
│   │   └── utils/             # أدوات مساعدة
│   ├── requirements.txt
│   └── .env.example
├── frontend/                   # Next.js Web App
├── telegram-bot/               # Telegram Bot
├── docker-compose.yml
├── README.md
└── DEPLOYMENT.md
```

## 🛠️ التشغيل المحلي

### المتطلبات
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (اختياري)

### 1. تشغيل Backend
```bash
cd backend
cp .env.example .env
# عدّل القيم في .env
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. تشغيل Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. تشغيل Telegram Bot
```bash
cd telegram-bot
pip install -r requirements.txt
python bot.py
```

### أو باستخدام Docker
```bash
docker-compose up -d
```

## 📚 نقاط API الرئيسية

| المسار | الوصف |
|--------|-------|
| `POST /api/auth/register` | تسجيل جديد |
| `POST /api/auth/login` | تسجيل دخول |
| `GET /api/auth/me` | بيانات المستخدم |
| `POST /api/ai/chat` | محادثة ذكية |
| `POST /api/calc/end-of-service` | حاسبة نهاية الخدمة |
| `POST /api/calc/insurance` | حاسبة التأمينات |
| `POST /api/calc/leaves` | حاسبة الإجازات |
| `POST /api/calc/net-salary` | حاسبة الراتب الصافي |
| `GET /api/templates` | قائمة النماذج |
| `POST /api/templates/{id}/generate` | توليد نموذج |
| `POST /api/subscriptions/subscribe` | اشتراك جديد |

## 🔐 الأمان
- تشفير كلمات المرور بـ bcrypt
- JWT للمصادقة
- Rate limiting على كل endpoint
- حماية ضد SQL injection و XSS
- CORS محدد

## 🚀 النشر

انظر ملف [DEPLOYMENT.md](./DEPLOYMENT.md) للتفاصيل الكاملة.

## 📝 الترخيص

جميع الحقوق محفوظة © 2026 HR BASEM AZAB

---

> ⚠️ تنويه: هذا التطبيق يقدم استشارات عامة. للحالات الخاصة أو النزاعات القانونية، يُرجى استشارة محامي متخصص.

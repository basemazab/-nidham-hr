# تجهيز Meta App Review — للرد على الرسائل والكومنتات للعملاء الحقيقيين

> الهدف: تحويل التطبيق من **Development** لـ **Live** بصلاحيات معتمدة، عشان **أي عميل** (مش بس الأدمن/الـTesters) يعلّق أو يبعت رسالة ويستلم رد. النصوص الإنجليزية تحت **جاهزة للنسخ واللصق** في فورمات Meta (المراجعين أجانب فبيقدّموا بالإنجليزي).

---

## 0) متطلبات لازم تتعمل قبل التقديم (Checklist)
- [ ] **Business Verification**: من [Business Settings → Security Center](https://business.facebook.com/settings/security) — وثّق نشاطك (سجل تجاري/بطاقة ضريبية). **إجباري للـ Advanced Access.**
- [ ] **Privacy Policy URL** في App Settings → Basic: `https://www.nidhamhr.com/privacy`
- [ ] **App Icon** 1024×1024 + **Category** متحددة (Business).
- [ ] **Data Use Checkup** متعمل (لو ظهرلك تنبيه).
- [ ] **App Mode = Live** (التوجل فوق في الداشبورد).
- [ ] حساب **Test User** أو وصول للمراجع يجرّب بيه (الخطوة الأصعب — تحت).

---

## 1) الصلاحيات المطلوبة + نص الاستخدام (انسخ كل واحد في خانته)

### `pages_messaging`
> Our app, Nidham, is an HR + CRM platform for Egyptian businesses. With this permission we send replies to people who message the business's connected Facebook Page — both automated AI replies and replies sent manually by the business's staff from our unified inbox — and a one-time private reply to people who comment on the Page's posts or ads, to answer sales and support inquiries. We only message users who initiated contact (messaged or commented).

### `pages_read_engagement`
> We read the connected Page's posts and the comments on them (via the `feed` webhook) so the business can see incoming comments in our inbox and respond to them. We do not store content beyond what's needed to display and reply to the conversation.

### `pages_manage_engagement`
> We post public replies to comments on the business's own Page posts/ads on their behalf — a short acknowledgement under the customer's comment (e.g., "Thanks for your interest, we've sent you a private message"). Only triggered by a customer's new comment.

### `pages_manage_metadata`
> We subscribe the business's Page to webhooks (`messages` and `feed`) so we receive new messages and comments in real time, and read the page settings required to operate the inbox. Used only for the Pages the business explicitly connects.

### `pages_show_list`
> During onboarding the business selects which of the Pages they manage to connect to Nidham; we use this permission to list their Pages so they can pick one.

### (لو هتستخدم إنستجرام) `instagram_basic`, `instagram_manage_messages`, `instagram_manage_comments`
> Same use cases as above, applied to the business's connected Instagram professional account: read & reply to DMs and comments on their own media.

---

## 2) خطوات للمراجِع (Step-by-step instructions) — انسخها
> Meta بتطلب خطوات يقدر المراجع يكرّرها. لازم تديله **وصول تجريبي**.

```
Test credentials: <email> / <password>   (أنشئ حساب تجريبي على https://www.nidhamhr.com/signup ووصّله بصفحة فيسبوك تجريبية)

1. Log in at https://www.nidhamhr.com/login with the test credentials.
2. Go to Marketing Inbox → Settings, where the test Facebook Page is already connected and "Auto-reply" + "Comment auto-reply" are enabled.
3. From a different Facebook account, send a message to the connected Page → observe Nidham auto-reply within seconds (visible in the Page chat and in Nidham's inbox).
4. From a different Facebook account, comment on one of the Page's posts → observe (a) a public reply appears under the comment, and (b) the commenter receives a private message. The lead appears in Nidham's inbox and CRM.
```

---

## 3) سكريبت الفيديو (Screencast) — Meta بتطلب فيديو يوضّح كل صلاحية
سجّل شاشة (٢-٣ دقايق) تبيّن:
1. تسجيل الدخول لـ Nidham + صفحة الإعدادات وفيها الصفحة متوصّلة (`pages_show_list`, `pages_manage_metadata`).
2. حساب تاني يبعت رسالة للصفحة → يظهر الرد الآلي (`pages_messaging`).
3. حساب تاني يعلّق على بوست → يظهر الرد العام تحت الكومنت (`pages_manage_engagement`, `pages_read_engagement`) + توصله رسالة خاصة (`pages_messaging`).
4. الـ lead بيظهر في صندوق Nidham.
> ارفع الفيديو على Google Drive (Public link) أو YouTube (Unlisted) وحط اللينك في التقديم.

---

## 4) نصائح للقبول
- اكتب الاستخدام **واضح وصادق** — Meta بترفض الوصف الغامض.
- تأكد إن الـ Test User بيشتغل فعلاً قبل التقديم (المراجع لو معرفش يدخل → رفض فوري).
- متطلبش صلاحيات مش بتستخدمها.
- المراجعة بتاخد من **يومين لأسبوعين**. لو اترفض، بيقولك السبب وتعدّل وتعيد.

---

## ملخص اللي تعمله بالترتيب:
1. فعّل Business Verification + حط Privacy Policy URL + خلّي التطبيق Live.
2. أنشئ حساب Nidham تجريبي موصّل بصفحة فيسبوك تجريبية (للمراجع).
3. سجّل الفيديو.
4. في App Review → اطلب الصلاحيات الـ5 + الصق النصوص فوق + لينك الفيديو + خطوات المراجع.
5. قدّم وانتظر الموافقة.

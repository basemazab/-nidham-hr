set client_encoding to 'UTF8';

-- ============================================================================
-- 106 — LinkedIn scheduled posts (hands-free campaign publishing)
-- ============================================================================
-- Posts queue per company. A daily cron publishes due posts to the CONNECTED
-- member profile via the official API (w_member_social). Image params (not a
-- URL) are stored so the runner builds the branded-image URL with proper
-- encoding at publish time.
--
-- Seeds the 6-post launch campaign for every company that already connected
-- LinkedIn: one post every 2 days at 08:50 UTC (~11:50 Cairo), starting
-- tomorrow. Idempotent: skips companies that already have queued posts.

create table if not exists public.linkedin_scheduled_posts (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  post_text    text not null,
  link_url     text,
  image_title  text,
  image_sub    text,
  image_badge  text,
  scheduled_at timestamptz not null,
  status       text not null default 'pending'
               check (status in ('pending', 'posted', 'failed', 'cancelled')),
  posted_at    timestamptz,
  post_url     text,
  error        text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_li_sched_due
  on public.linkedin_scheduled_posts(status, scheduled_at);

alter table public.linkedin_scheduled_posts enable row level security;

drop policy if exists li_sched_tenant on public.linkedin_scheduled_posts;
create policy li_sched_tenant on public.linkedin_scheduled_posts
  for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- ── Seed the launch campaign for companies with LinkedIn connected ──
insert into public.linkedin_scheduled_posts
  (company_id, post_text, link_url, image_title, image_sub, image_badge, scheduled_at)
select
  c.company_id,
  p.post_text,
  'https://www.nidhamhr.com',
  p.img_title, p.img_sub, p.img_badge,
  date_trunc('day', now()) + (p.day_offset || ' days')::interval + interval '8 hours 50 minutes'
from public.linkedin_connections c
cross join (
  values
  (1,
$p$🚀 نِظام وصل لينكد إن!

بعد شهور من الشغل مع شركات مصرية حقيقية، بنقدّم أول منصة مصرية متكاملة بتدير:

✅ الموارد البشرية والحضور (GPS + بصمة)
✅ المرتبات بقانون العمل المصري — تأمينات وضرائب تلقائيًا
✅ التوظيف الذكي — من الإعلان لجمع الـ CVs وفرزها بالـ AI
✅ العملاء والمبيعات (CRM)
✅ مساعد ذكي بيفهم العامية وينفّذ شغل حقيقي

كل ده في مكان واحد، بأسعار بالجنيه، ودعم بالعربي.

جرّبها مجانًا 14 يوم 👇
https://www.nidhamhr.com

#HR #Payroll #Egypt #مصر #موارد_بشرية #ذكاء_اصطناعي #SaaS$p$,
   'نظام وصل لينكد إن', 'منصة مصرية واحدة: HR · مرتبات · CRM — بالذكاء الاصطناعي', 'إطلاق 🚀'),
  (3,
$p$تخيل تفتح النظام الصبح تلاقي مديرك التنفيذي الآلي جهزلك تقرير عن شركتك كلها ⚡

«نبض نِظام» بيمسح كل حاجة يوميًا:
🔴 مين غايب النهاردة ومين بيتأخر بشكل متكرر
🟡 إجازات وسلف مستنية موافقتك
💰 عملاء سخنين محتاجين مكالمة دلوقتي
📄 مستندات وعقود هتنتهي خلال 30 يوم

وكل بند معاه خطوة عملية واحدة + لينك مباشر. الأرقام كلها من قاعدة بياناتك — مفيش تخمين.

شوفه شغال: https://www.nidhamhr.com

#AI #إدارة_أعمال #HR #مصر #ذكاء_اصطناعي$p$,
   '⚡ نبض نظام', 'بريفينج تنفيذي يومي عن شركتك كلها — بالأرقام', 'ميزة جديدة'),
  (5,
$p$عايز توظّف محاسب؟ اكتب جملة واحدة. 🎯

في نِظام بتقول للمساعد الذكي: «عايز أوظف محاسب خبرة 3 سنين»

وهو بيعمل الباقي:
1️⃣ يدوّر في بنك المواهب — ممكن يلاقيلك مرشح جاهز
2️⃣ يكتب إعلان التوظيف باحترافية
3️⃣ ينشر الوظيفة بلينك تقديم عام
4️⃣ كل CV بيتفرز بالـ AI تلقائيًا
5️⃣ تسأله «مين قدّم؟» يديك الأسماء والأرقام

من الإعلان للمقابلة من غير ما تفتح إكسل.

جرّبه: https://www.nidhamhr.com

#توظيف #Recruitment #HR #مصر #وظائف$p$,
   'وظّف بجملة واحدة', 'قول للمساعد: عايز أوظف محاسب — وهو ينشر ويجمع الـ CVs ويفرزها', 'توظيف ذكي 🎯'),
  (7,
$p$لو لسه بتحسب المرتبات على إكسل، البوست ده ليك 💰

نِظام بيحسب مرتبات فريقك بقانون العمل المصري:
✅ التأمينات الاجتماعية تلقائيًا
✅ شرائح ضريبة كسب العمل محدّثة
✅ البدلات والحوافز والخصومات والسلف
✅ الحضور والغياب بيتحسب من البصمة مباشرة
✅ قسيمة مرتب PDF لكل موظف

اللي كان بياخد يومين آخر الشهر، بقى بضغطة — ومراجعة AI بتلقط أي رقم شاذ.

https://www.nidhamhr.com

#مرتبات #Payroll #قانون_العمل #محاسبة #مصر$p$,
   'مرتبات بقانون العمل المصري', 'تأمينات وضرائب وبدلات محسوبة تلقائيًا بدون إكسل', 'مرتبات 💰'),
  (9,
$p$«فين دفتر الحضور؟» — جملة اختفت من الشركات اللي بتستخدم نِظام ⏰

✅ حضور بالموبايل بـ GPS — من موقع الشغل بس
✅ ربط مباشر مع أجهزة البصمة ZKTeco
✅ ورديات ومناوبات مرنة
✅ التأخير بيتحسب لحظيًا — وبيدخل في المرتب تلقائيًا
✅ تقارير يومية لكل فرع

مفيش ورق، ومفيش جدل آخر الشهر.

https://www.nidhamhr.com

#حضور_وانصراف #Attendance #HR #بصمة #مصر$p$,
   'حضور GPS وبصمة', 'تقارير لحظية لكل فروعك — بدون ورق', 'حضور ⏰'),
  (11,
$p$جرّبت الأنظمة الأجنبية ولقيتها مش فاهمة السوق المصري؟ 🇪🇬

نِظام اتبني من الأول مخصوص لمصر:
💵 أسعار بالجنيه — تبدأ من 750 ج/شهر للشركة كلها (مش للمستخدم!)
📜 قانون العمل والتأمينات والضرائب المصرية مدمجة
🗣️ الواجهة والدعم والمساعد الذكي — كله بالعربي
⚡ تجهيز شركتك بياخد ساعة واحدة مش أسابيع

التجربة 14 يوم مجانية — من غير فيزا ومن غير التزام.

ابدأ دلوقتي 👇
https://www.nidhamhr.com

#SaaS #مصر #شركات_ناشئة #HR #Payroll$p$,
   'جرّب نظام مجانًا 14 يوم', 'أسعار بالجنيه المصري تبدأ من 750 ج شهريًا', 'عرض خاص')
) as p(day_offset, post_text, img_title, img_sub, img_badge)
where c.access_token is not null
  and not exists (
    select 1 from public.linkedin_scheduled_posts e
    where e.company_id = c.company_id
  );

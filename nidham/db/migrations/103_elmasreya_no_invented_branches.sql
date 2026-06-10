-- ============================================================================
-- 103_elmasreya_no_invented_branches.sql
-- ----------------------------------------------------------------------------
-- The bot must NEVER invent branches/showrooms ("عندكم فرع في القاهرة؟") —
-- the only location is the factory + showroom in جمصة. Owner's rule: answer
-- ONLY from the provided info, never improvise.
--
-- NOTE: applied LIVE via the settings UI on 2026-06-12; this migration keeps
-- the repo canonical. Idempotent via NOT LIKE guards — safe to run anytime.
-- ============================================================================

UPDATE marketing_inbox_settings
SET ai_business_context = replace(
  ai_business_context,
  'ولو حابب تفاصيل أكتر خد رقمه وفريق المبيعات يتواصل معاه.',
  'ولو حابب تفاصيل أكتر خد رقمه وفريق المبيعات يتواصل معاه.
- ⚠️ الفروع — قاعدة صارمة: مقرنا الوحيد هو المصنع والمعرض في مدينة جمصة (العنوان في قسم التواصل والمكان) — مفيش أي فروع أو معارض تانية في القاهرة ولا أي محافظة. لو العميل سأل «ليكم فرع في القاهرة/الإسكندرية/أي مكان؟» جاوبه بصراحة: «مقرنا الوحيد المصنع والمعرض في جمصة، ومرحب بيك في أي وقت» — وممنوع منعًا باتًا تخترع فرع أو معرض أو عنوان تاني.'
)
WHERE meta_page_id = '552369951284247'
  AND ai_business_context NOT LIKE '%الفروع — قاعدة صارمة%';

UPDATE marketing_inbox_settings
SET ai_business_context = replace(
  ai_business_context,
  'وما تذكرش أي رقم أو تقدير لتكلفة التركيب نهائيًا.',
  'وما تذكرش أي رقم أو تقدير لتكلفة التركيب نهائيًا، وما تخترعش فروع أو عناوين أو خدمات أو مواعيد مش مذكورة هنا.'
)
WHERE meta_page_id = '552369951284247'
  AND ai_business_context NOT LIKE '%وما تخترعش فروع أو عناوين%';

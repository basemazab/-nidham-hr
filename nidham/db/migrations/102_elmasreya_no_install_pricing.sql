-- ============================================================================
-- 102_elmasreya_no_install_pricing.sql
-- ----------------------------------------------------------------------------
-- The bot INVENTED an installation cost ("بنضيف من 200 لـ 300 جنيه للباب") —
-- the owner explicitly forbids quoting ANY installation price. Adds a strict
-- rule to المصرية الألمانية's business context.
--
-- NOTE: this was already applied LIVE via the settings UI on 2026-06-12; the
-- migration exists so the repo stays the canonical record. Idempotent via the
-- NOT LIKE guard — safe to run anytime.
-- ============================================================================

UPDATE marketing_inbox_settings
SET ai_business_context = replace(
  replace(
    ai_business_context,
    'جاوبه بوضوح: «لأ، السعر غير شامل التركيب».',
    'جاوبه بوضوح: «لأ، السعر غير شامل التركيب».
- ⚠️ التركيب — قاعدة صارمة: ممنوع منعًا باتًا تذكر أي رقم أو تقدير لتكلفة التركيب (ولا حتى «من كذا لكذا») — مفيش أسعار تركيب معلنة عندنا نهائيًا، وأي رقم هتقوله هيكون كذب. لو العميل سأل «التركيب بكام؟»: قوله «التركيب مش ضمن السعر، وأي نجار عادي يقدر يركّب الباب بسهولة من غير معدات خاصة»، ولو حابب تفاصيل أكتر خد رقمه وفريق المبيعات يتواصل معاه.'
  ),
  'وما تقولش إن السعر شامل التركيب أبدًا.',
  'وما تقولش إن السعر شامل التركيب أبدًا، وما تذكرش أي رقم أو تقدير لتكلفة التركيب نهائيًا.'
)
WHERE meta_page_id = '552369951284247'
  AND ai_business_context NOT LIKE '%التركيب — قاعدة صارمة%';

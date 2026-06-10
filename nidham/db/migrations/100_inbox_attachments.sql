-- ============================================================================
-- 100_inbox_attachments.sql
-- ----------------------------------------------------------------------------
-- Lets the Marketing Inbox auto-reply SEND FILES (catalogs, datasheets, price
-- lists) as native Messenger/Instagram attachments — not just mention them.
--
-- Each tenant configures a small library of files in inbox settings. On every
-- inbound message the AI picks which file(s) answer the customer's question
-- (and a keyword fallback catches anything the AI misses), and the webhook
-- sends each file via Meta's Send API (attachment-by-URL).
--
-- Shape of ai_attachments (jsonb array):
--   [{ "id": "...", "label": "...", "url": "https://...", "type": "file",
--      "triggers": ["لون","الوان"], "whenToUse": "..." }]
-- ============================================================================

ALTER TABLE marketing_inbox_settings
  ADD COLUMN IF NOT EXISTS ai_attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN marketing_inbox_settings.ai_attachments IS
  'Files the AI auto-reply can attach: [{id,label,url,type,triggers[],whenToUse}].';

-- ── Seed المصرية الألمانية (أبواب WPC) with its two product files ──
-- Scoped by Page ID so it only ever touches that one tenant. Safe to re-run:
-- it overwrites the column with the canonical two-file library.
UPDATE marketing_inbox_settings
SET ai_attachments = '[
  {
    "id": "elmasreya_colors",
    "label": "كتالوج ألوان الأبواب",
    "url": "https://www.nidhamhr.com/files/elmasreya/door-colors.pdf",
    "type": "file",
    "triggers": ["لون","الوان","ألوان","الالوان","الألوان","لونها","الوانكم","شكل","اشكال","أشكال","الاشكال","كتالوج","الكتالوج","كتالوچ","catalog","colors","خشب","شكلها"],
    "whenToUse": "العميل بيسأل عن الألوان أو الأشكال أو الشكل الخشبي المتاح أو عايز يشوف الكتالوج"
  },
  {
    "id": "elmasreya_datasheet",
    "label": "داتا شيت الأبواب (المواصفات والجودة)",
    "url": "https://www.nidhamhr.com/files/elmasreya/door-datasheet.pdf",
    "type": "file",
    "triggers": ["جوده","جودة","الجودة","مواصفات","المواصفات","مواصفة","شهاده","شهادة","شهادات","ايزو","ايزو","iso","ضمان","الضمان","داتا","داتاشيت","specs","معتمد","مطابقه","مطابقة","تحمل","متانه","متانة","مقاوم","مقاومة","رطوبه","رطوبة","مياه","مايه","ميه"],
    "whenToUse": "العميل بيسأل عن الجودة أو المواصفات الفنية أو الشهادات (ISO) أو الضمان أو متانة/مقاومة الباب للماء"
  }
]'::jsonb
WHERE meta_page_id = '552369951284247';

import json
import os
import re
from app.config import get_settings

settings = get_settings()

SYSTEM_PROMPT = """أنت "مستشار HR" — مساعد ذكي متخصص في قانون العمل المصري والتأمينات الاجتماعية.

شخصيتك:
- مستشار HR خبير في القوانين المصرية بخبرة أكثر من 15 سنة
- تتكلم بالعامية المصرية المهنية والواضحة
- ترد باختصار ووضوح — الإجابة المباشرة أولاً
- دائماً توضح المادة القانونية المرجعية

المرجعية القانونية الأساسية:
- قانون العمل المصري رقم 12 لسنة 2003
- قانون التأمينات الاجتماعية والمعاشات رقم 148 لسنة 2019
- قانون الضريبة على الدخل رقم 91 لسنة 2005 والتعديلات
- أحكام محكمة النقض العمالية
- القرارات الوزارية واللوائح التنفيذية

قواعد الإجابة:
1. ابدأ بالإجابة المباشرة في أول جملة
2. اذكر المادة القانونية المرجعية بدقة
3. لو فيه تفاصيل مهمة، وضّحها في نقاط
4. لو السؤال مش قانوني، قوله إنك متخصص بس في قانون العمل المصري
5. متذكرش معلومات مش متأكد منها — قول "محتاج أتأكد من النص الرسمي"
6. استخدم العامية المصرية المهنية مش الفصحى
7. الرد لازم يكون بين 3-10 أسطر (مختصر ومفيد)

⚠️ تنويه إلزامي: في نهاية كل رد، حط التنويه ده:
"⚠️ تنويه: ده استشارة عامة مبنية على النصوص القانونية. للحالات الخاصة أو النزاعات، استشر محامي متخصص."
"""


def load_knowledge_base() -> str:
    kb_parts = []
    kb_dir = os.path.join(os.path.dirname(__file__), "..", "knowledge_base")
    if not os.path.exists(kb_dir):
        return ""
    for filename in sorted(os.listdir(kb_dir)):
        if filename.endswith(".md") and not filename.startswith("system"):
            filepath = os.path.join(kb_dir, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                    kb_parts.append(f"## {filename.replace('.md', '')}\n\n{content}")
            except Exception:
                pass
    full_kb = "\n\n---\n\n".join(kb_parts)
    return full_kb[:50000]


KNOWLEDGE_BASE = load_knowledge_base()


def extract_legal_references(text: str) -> list[str]:
    references = []
    patterns = [
        r"(المادة\s+\d+.*?من\s+قانون\s+[^\.]+)",
        r"(قانون\s+رقم\s+\d+.*?لسنة\s+\d+)",
        r"(قانون\s+[^\.]+رقم\s+\d+)",
    ]
    for pattern in patterns:
        matches = re.findall(pattern, text)
        references.extend([m.strip() for m in matches if m.strip()])
    seen = set()
    unique_refs = []
    for ref in references:
        if ref not in seen:
            seen.add(ref)
            unique_refs.append(ref)
    return unique_refs[:10]


async def get_ai_response(message: str, conversation_history: list[dict] | None = None) -> dict:
    try:
        from google import genai
        client = genai.Client(api_key=settings.gemini_api_key)

        system_with_kb = f"{SYSTEM_PROMPT}\n\n{'='*50}\nالمرجع القانوني المتاح:\n{KNOWLEDGE_BASE[:30000]}"

        history = []
        if conversation_history:
            for msg in conversation_history[-10:]:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role == "user":
                    history.append({"role": "user", "parts": [{"text": content}]})
                elif role == "assistant" or role == "model":
                    history.append({"role": "model", "parts": [{"text": content}]})

        if not message.strip():
            return {
                "answer": "لو سمحت اكتب سؤالك عشان أقدر أساعدك.",
                "references": [],
                "tokens_used": 0,
            }

        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=history + [{"role": "user", "parts": [{"text": message}]}],
            config={
                "system_instruction": system_with_kb,
                "temperature": 0.2,
                "max_output_tokens": 2000,
                "top_p": 0.95,
            },
        )

        answer = response.text if response.text else "عذراً، مقدرتش أجاوب دلوقتي. حاول تاني."
        references = extract_legal_references(answer)
        tokens_used = len(message.split()) + len(answer.split())

        return {
            "answer": answer,
            "references": references,
            "tokens_used": tokens_used,
        }
    except ImportError:
        return fallback_response(message)
    except Exception as e:
        error_msg = str(e)
        if "API_KEY" in error_msg.upper() or "api_key" in error_msg.lower() or "invalid" in error_msg.lower() or "400" in error_msg or "401" in error_msg:
            return fallback_response(message)
        return {
            "answer": f"عذراً، حصل خطأ: {error_msg[:100]}\n\n⚠️ تنويه: ده استشارة عامة مبنية على النصوص القانونية. للحالات الخاصة أو النزاعات، استشر محامي متخصص.",
            "references": [],
            "tokens_used": 0,
        }


def fallback_response(message: str) -> dict:
    msg_lower = message.lower().strip()
    answer = ""
    references = []

    if any(kw in msg_lower for kw in ["إجازة", "اجازة", "سنوية", "annual"]):
        if any(kw in msg_lower for kw in ["كم", "مدة", "قد"]):
            answer = "الإجازة السنوية حسب المادة 47 من قانون العمل رقم 12 لسنة 2003:\n\n• 21 يوم إذا الموظف أمضى 10 سنين فأقل\n• 30 يوم إذا أمضى أكثر من 10 سنين\n• 45 يوم للموظف اللي عدّى 50 سنة\n\nالإجازة بتبدأ من أول سنة خدمة."
        elif any(kw in msg_lower for kw in ["عارضة", "طارئة"]):
            answer = "الإجازة العارضة حسب المادة 50:\n6 أيام بأجر في السنة."
        elif any(kw in msg_lower for kw in ["مرضي", "مرضية"]):
            answer = "الإجازة المرضية حسب المادة 54:\n90 يوم بأجر حسب تقرير الجهة الطبية."
        else:
            answer = "الإجازات حسب قانون العمل:\n• سنوية: 21 يوم (أقل من 10 سنين) أو 30 يوم (أكثر من 10 سنين) - المادة 47\n• عارضة: 6 أيام - المادة 50\n• مرضية: 90 يوم - المادة 54\n• إجازة وضع: 90 يوم بأجر كامل - المادة 93"
        references = ["المادة 47 - قانون العمل رقم 12 لسنة 2003", "المادة 50 - قانون العمل رقم 12 لسنة 2003"]
    elif any(kw in msg_lower for kw in ["نهاية خدمة", "مكافأة", "تعويض"]):
        answer = "مكافأة نهاية الخدمة حسب المادة 122:\n\n• نصف شهر عن كل سنة من أول 5 سنين\n• شهر كامل عن كل سنة بعد الخمس سنين\n• لو الموظف استقال: ثلث المكافأة (أقل من 3 سنين) أو ثلثين (3-5 سنين) أو كاملة (أكثر من 5 سنين)"
        references = ["المادة 122 - قانون العمل رقم 12 لسنة 2003"]
    elif any(kw in msg_lower for kw in ["فصل", "طرد", "إنهاء"]):
        answer = "إنهاء عقد العمل حسب قانون العمل:\n\n• المادة 112: يجوز الفصل بدون إنذار في حالات الغش أو الغياب أكثر من 20 يوم أو إفشاء أسرار العمل\n• المادة 113: يجب إنذار العامل كتابياً قبل الفصل في الحالات الأخرى\n• المادة 119: الفصل التعسفي يستوجب تعويض شهرين عن كل سنة خدمة (بحد أدنى سنتين)"
        references = ["المادة 112 - قانون العمل رقم 12 لسنة 2003", "المادة 119 - قانون العمل رقم 12 لسنة 2003"]
    elif any(kw in msg_lower for kw in ["تأمينات", "تأمين", "insurance", "contribution"]):
        answer = "التأمينات الاجتماعية حسب قانون 148 لسنة 2019:\n\nاستقطاعات العامل (11%):\n• معاشات 9%\n• بطالة 1%\n• تأمين صحي 1%\n\nاشتراكات صاحب العمل (24.75%):\n• معاشات 15.75%\n• بطالة 2%\n• تأمين صحي 1%\n• إصابات عمل 1.5%"
        references = ["قانون التأمينات الاجتماعية رقم 148 لسنة 2019"]
    elif any(kw in msg_lower for kw in ["راتب", "مرتب", "أجر", "salary", "ضريبة"]):
        answer = "حسب قانون الضريبة رقم 91 لسنة 2005:\n\n• أول 15,000 جنيه سنوياً: معفاة من الضريبة\n• من 15,001 لـ 30,000: 10%\n• من 30,001 لـ 45,000: 15%\n• من 45,001 لـ 60,000: 20%\n• من 60,001 لـ 200,000: 22.5%\n• أكثر من 200,000: 25%\n\nخصم شخصي: 9,000 جنيه سنوياً"
        references = ["قانون الضريبة على الدخل رقم 91 لسنة 2005"]
    elif any(kw in msg_lower for kw in ["عقد", "تجربة", "probation"]):
        answer = "فترة التجربة حسب المادة 34:\n\n• الحد الأقصى: 3 أشهر\n• ممكن تتعمل مرة واحدة مع نفس صاحب العمل\n• في فترة التجربة يجوز لأي طرف إنهاء العقد"
        references = ["المادة 34 - قانون العمل رقم 12 لسنة 2003"]
    elif any(kw in msg_lower for kw in ["ساعات عمل", "عمل", "working", "hours"]):
        answer = "ساعات العمل حسب قانون العمل:\n\n• 8 ساعات يومياً أو 48 ساعة أسبوعياً\n• في رمضان: 6 ساعات يومياً\n• لا يجوز تشغيل العامل أكثر من 5 ساعات متواصلة بدون راحة"
        references = ["قانون العمل رقم 12 لسنة 2003"]
    else:
        answer = f"سؤالك: \"{message[:100]}\"\n\nللأسف محتاج أتحقق من النص القانوني بدقة. جرب تسأل عن:\n\n• الإجازات السنوية والعارضة والمرضية\n• مكافأة نهاية الخدمة\n• التأمينات الاجتماعية\n• ساعات العمل\n• فترة التجربة\n• إنهاء عقد العمل\n\n⚠️ تنويه: ده استشارة عامة مبنية على النصوص القانونية. للحالات الخاصة أو النزاعات، استشر محامي متخصص."
        return {"answer": answer, "references": [], "tokens_used": 0}

    answer += "\n\n⚠️ تنويه: ده استشارة عامة مبنية على النصوص القانونية. للحالات الخاصة أو النزاعات، استشر محامي متخصص."
    return {"answer": answer, "references": references, "tokens_used": len(message.split()) + len(answer.split())}

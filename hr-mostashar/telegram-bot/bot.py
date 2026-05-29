import os
import logging
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    ConversationHandler,
    filters,
    CallbackQueryHandler,
)

load_dotenv()

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

ASKING_QUESTION = 0
CALC_SELECT = 1
CALC_INPUT = 2

CALC_TYPES = {
    "end_of_service": {
        "name": "نهاية الخدمة",
        "icon": "💰",
        "steps": ["start_date", "end_date", "total_salary"],
        "prompts": [
            "📅 ابعت تاريخ التعيين (مثال: 2020-01-15 أو 15-01-2020):",
            "📅 تاريخ ترك العمل (نفس الصيغة):",
            "💰 آخر مرتب شامل بالجنيه:",
        ],
    },
    "insurance": {
        "name": "التأمينات",
        "icon": "🛡️",
        "steps": ["gross_salary"],
        "prompts": ["💰 ابعت المرتب الإجمالي بالجنيه:"],
    },
    "leaves": {
        "name": "الإجازات",
        "icon": "🏖️",
        "steps": ["start_date", "current_date", "taken_days", "employee_age"],
        "prompts": [
            "📅 ابعت تاريخ التعيين (مثال: 2020-01-15 أو 15-01-2020):",
            "📅 تاريخ اليوم (نفس الصيغة):",
            "📅 عدد الإجازات المأخوذة:",
            "👤 عمر الموظف:",
        ],
    },
    "net_salary": {
        "name": "الراتب الصافي",
        "icon": "💵",
        "steps": ["gross_salary", "marital_status", "dependents"],
        "prompts": [
            "💰 ابعت المرتب الإجمالي:",
            "الحالة الاجتماعية؟ (married/single):",
            "عدد المعالين:",
        ],
    },
}

from datetime import datetime
import re
import httpx

DATE_FIELDS = ["start_date", "end_date", "current_date"]


def parse_date(text: str) -> str | None:
    text = text.strip().strip("()").strip()
    patterns = [
        (r"^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$", lambda m: f"{int(m.group(1)):04d}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"),
        (r"^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$", lambda m: f"{int(m.group(3)):04d}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"),
        (r"^(\d{1,2})[-/](\d{1,2})[-/](\d{2})$", lambda m: f"{2000+int(m.group(3)):04d}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"),
    ]
    for pattern, formatter in patterns:
        m = re.match(pattern, text)
        if m:
            try:
                formatted = formatter(m)
                datetime.strptime(formatted, "%Y-%m-%d")
                return formatted
            except ValueError:
                return None
    return None


ERROR_MSG = "❌ الصيغة غير صحيحة. اكتب التاريخ بصيغة YYYY-MM-DD\nمثال: 2020-01-15 أو 15-01-2020"


async def call_backend(path: str, method: str = "GET", json_data: dict | None = None) -> dict | None:
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            if method == "POST":
                response = await client.post(f"{BACKEND_URL}{path}", json=json_data)
            else:
                response = await client.get(f"{BACKEND_URL}{path}")
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                return {"error": "rate_limit"}
            else:
                logger.error(f"Backend error {response.status_code}: {response.text}")
                return None
    except Exception as e:
        logger.error(f"Backend call failed: {e}")
        return None


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    welcome = """👋 *اهلاً بيك في مستشار HR!*

انا مساعدك الذكي لقانون العمل المصري والتأمينات الاجتماعية.

🔹 *اسألني* أي سؤال قانوني
🔹 *حاسبات* دقيقة (نهاية الخدمة، التأمينات، الإجازات، الراتب)
🔹 *نماذج جاهزة* للتحميل (عقود، إنذارات، شهادات)
🔹 *اشتراكات* مرنة تناسبك"""
    keyboard = [
        [InlineKeyboardButton("💬 اسأل سؤال", callback_data="ask")],
        [
            InlineKeyboardButton("🧮 الحاسبات", callback_data="calc"),
            InlineKeyboardButton("📄 النماذج", callback_data="templates"),
        ],
        [
            InlineKeyboardButton("💎 الاشتراكات", callback_data="subscribe"),
            InlineKeyboardButton("📊 حسابي", callback_data="account"),
        ],
        [InlineKeyboardButton("❓ مساعدة", callback_data="help")],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(welcome, reply_markup=reply_markup, parse_mode="Markdown")


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    help_text = """📖 *دليل الاستخدام*

/start - القائمة الرئيسية
/ask - اطرح سؤال قانوني
/calc - الحاسبات
/templates - مكتبة النماذج
/subscribe - الاشتراكات
/account - حسابي

💡 *نصيحة:* تقدر تكتب أي سؤال قانوني مباشرة في أي وقت وهجاوبك!"""
    await update.message.reply_text(help_text, parse_mode="Markdown")


async def ask_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("💬 *اكتب سؤالك القانوني* وهجاوبك فوراً.", parse_mode="Markdown")
    return ASKING_QUESTION


async def handle_question(update: Update, context: ContextTypes.DEFAULT_TYPE):
    question = update.message.text
    conv_id = context.user_data.get("conversation_id")

    payload = {"message": question}
    if conv_id:
        payload["conversation_id"] = conv_id

    result = await call_backend("/api/ai/bot/chat", "POST", payload)

    if result is None:
        await update.message.reply_text("عذراً، حصل خطأ في الاتصال. تأكد إن السيرفر شغال وحاول تاني.")
    elif result.get("error") == "rate_limit":
        await update.message.reply_text("⚠️ *تم تجاوز حد الأسئلة المجانية*\n\nاشترك في Pro للحصول على أسئلة غير محدودة.\nاكتب /subscribe للتفاصيل.", parse_mode="Markdown")
    else:
        answer = result.get("answer", "")
        new_conv_id = result.get("conversation_id")
        if new_conv_id:
            context.user_data["conversation_id"] = new_conv_id
        references = result.get("references", [])
        if references:
            answer += "\n\n📋 *مراجع:*\n" + "\n".join([f"• {r}" for r in references[:3]])
        await update.message.reply_text(answer, parse_mode="Markdown")

    return ConversationHandler.END


async def handle_any_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if not text or text.startswith("/"):
        return
    await handle_question(update, context)


async def handle_media(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "❌ البوت لا يدعم إرسال الصور حالياً.\n"
        "من فضلك اكتب سؤالك كنص وسأجاوبك فوراً! 💬"
    )


async def calc_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data.clear()
    keyboard = [
        [InlineKeyboardButton(f"{CALC_TYPES['end_of_service']['icon']} {CALC_TYPES['end_of_service']['name']}", callback_data="calc_end_of_service")],
        [InlineKeyboardButton(f"{CALC_TYPES['insurance']['icon']} {CALC_TYPES['insurance']['name']}", callback_data="calc_insurance")],
        [InlineKeyboardButton(f"{CALC_TYPES['leaves']['icon']} {CALC_TYPES['leaves']['name']}", callback_data="calc_leaves")],
        [InlineKeyboardButton(f"{CALC_TYPES['net_salary']['icon']} {CALC_TYPES['net_salary']['name']}", callback_data="calc_net_salary")],
        [InlineKeyboardButton("❌ إلغاء", callback_data="calc_cancel")],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text("🧮 *اختار الحاسبة:*", reply_markup=reply_markup, parse_mode="Markdown")
    return CALC_SELECT


async def templates_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    result = await call_backend("/api/templates")
    if result is None:
        await update.message.reply_text("عذراً، حصل خطأ في الاتصال.")
        return ConversationHandler.END

    text = "📄 *مكتبة النماذج*\n\n"
    for category, templates in result.items():
        text += f"*{category}:*\n"
        for t in templates[:3]:
            text += f"  • {t['name']}\n"
        if len(templates) > 3:
            text += f"  ... و{len(templates) - 3} نماذج تانية\n"
        text += "\n"
    text += "لتحميل نموذج، سجل على الموقع: /subscribe"

    keyboard = [[InlineKeyboardButton("🌐 فتح الموقع", url="http://localhost:3000/app/templates")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(text, reply_markup=reply_markup, parse_mode="Markdown")
    return ConversationHandler.END


async def subscribe_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = """💎 *خطط الاشتراك*

🆓 *مجاني* - 0 جنيه
• 5 أسئلة/شهر
• 3 نماذج/شهر

⭐ *Pro* - 49 جنيه/شهر
• أسئلة غير محدودة
• كل النماذج والحاسبات

🏢 *أعمال* - 299 جنيه/شهر
• كل مميزات Pro
• 5 مستخدمين + API

♾️ *مدى الحياة* - 999 جنيه
• كل مميزات Pro للأبد

📱 *طرق الدفع:*
• فودافون كاش
• إنستاباي
• تحويل بنكي

بعد التحويل، ابعت الإيصال على الموقع."""
    keyboard = [[InlineKeyboardButton("🌐 اشترك الآن", url="http://localhost:3000/app/account")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(text, reply_markup=reply_markup, parse_mode="Markdown")
    return ConversationHandler.END


async def account_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    result = await call_backend("/api/subscriptions/usage")
    if result is None:
        await update.message.reply_text("سجل دخول الأول على الموقع عشان تشوف استخدامك.")
        return ConversationHandler.END

    text = "📊 *استخدامك هذا الشهر*\n\n"
    for u in result:
        feature_name = "💬 أسئلة" if u.get("feature") == "chat" else "📄 نماذج"
        if u.get("remaining", 0) == -1:
            usage_text = "غير محدود ✅"
        else:
            usage_text = f"{u['count']}/{u['limit']} ({u['remaining']} متبقي)"
        text += f"{feature_name}: {usage_text}\n"

    await update.message.reply_text(text, parse_mode="Markdown")
    return ConversationHandler.END


async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data = query.data

    if data == "ask":
        await query.message.reply_text("💬 *اكتب سؤالك القانوني:*", parse_mode="Markdown")
        return ASKING_QUESTION

    elif data == "calc":
        keyboard = [
            [InlineKeyboardButton(f"{CALC_TYPES['end_of_service']['icon']} {CALC_TYPES['end_of_service']['name']}", callback_data="calc_end_of_service")],
            [InlineKeyboardButton(f"{CALC_TYPES['insurance']['icon']} {CALC_TYPES['insurance']['name']}", callback_data="calc_insurance")],
            [InlineKeyboardButton(f"{CALC_TYPES['leaves']['icon']} {CALC_TYPES['leaves']['name']}", callback_data="calc_leaves")],
            [InlineKeyboardButton(f"{CALC_TYPES['net_salary']['icon']} {CALC_TYPES['net_salary']['name']}", callback_data="calc_net_salary")],
            [InlineKeyboardButton("❌ إلغاء", callback_data="calc_cancel")],
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.message.reply_text("🧮 *اختار الحاسبة:*", reply_markup=reply_markup, parse_mode="Markdown")
        return CALC_SELECT

    elif data == "calc_cancel":
        await query.message.reply_text("تم إلغاء الحاسبة.")
        return ConversationHandler.END

    elif data.startswith("calc_"):
        calc_type = data.replace("calc_", "")
        if calc_type not in CALC_TYPES:
            await query.message.reply_text("حاسبة غير معروفة.")
            return ConversationHandler.END

        context.user_data.clear()
        context.user_data["calc_type"] = calc_type
        context.user_data["calc_step"] = 0
        context.user_data["calc_data"] = {}
        calc_info = CALC_TYPES[calc_type]
        await query.message.reply_text(f"{calc_info['icon']} *حاسبة {calc_info['name']}*\n\n{calc_info['prompts'][0]}", parse_mode="Markdown")
        return CALC_INPUT

    elif data == "subscribe":
        await subscribe_command(update, context)
    elif data == "templates":
        await templates_command(update, context)
    elif data == "account":
        await account_command(update, context)
    elif data == "help":
        await help_command(update, context)

    return ConversationHandler.END


async def handle_calc_input(update: Update, context: ContextTypes.DEFAULT_TYPE):
    calc_type = context.user_data.get("calc_type")
    step = context.user_data.get("calc_step", 0)
    calc_data = context.user_data.get("calc_data", {})

    if calc_type not in CALC_TYPES:
        await update.message.reply_text("حاسبة غير معروفة. اكتب /calc للبدء.")
        return ConversationHandler.END

    calc_info = CALC_TYPES[calc_type]
    steps = calc_info["steps"]

    if step >= len(steps):
        await update.message.reply_text("تم الحساب.")
        context.user_data.clear()
        return ConversationHandler.END

    current_step = steps[step]
    user_input = update.message.text.strip()

    if current_step in DATE_FIELDS:
        parsed = parse_date(user_input)
        if parsed is None:
            await update.message.reply_text(ERROR_MSG)
            return CALC_INPUT
        calc_data[current_step] = parsed
    elif current_step in ["total_salary", "gross_salary"]:
        try:
            calc_data[current_step] = float(user_input.replace(",", ""))
        except (ValueError, TypeError):
            await update.message.reply_text("❌ قيمة غير صحيحة. اكتب رقم صحيح (مثال: 10000):")
            return CALC_INPUT
    elif current_step in ["taken_days", "employee_age", "dependents"]:
        try:
            calc_data[current_step] = int(user_input.replace(",", ""))
        except (ValueError, TypeError):
            await update.message.reply_text("❌ قيمة غير صحيحة. اكتب رقم صحيح (مثال: 5):")
            return CALC_INPUT
    elif current_step == "marital_status":
        val = user_input.lower().strip()
        calc_data[current_step] = val if val in ["married", "single"] else "single"
    else:
        calc_data[current_step] = user_input

    context.user_data["calc_step"] = step + 1
    context.user_data["calc_data"] = calc_data

    if step + 1 >= len(steps):
        await calc_and_send_result(update, context, calc_type, calc_data)
        context.user_data.clear()
        return ConversationHandler.END
    else:
        await update.message.reply_text(calc_info["prompts"][step + 1])
        return CALC_INPUT


async def calc_and_send_result(update: Update, context: ContextTypes.DEFAULT_TYPE, calc_type: str, calc_data: dict):
    calc_info = CALC_TYPES[calc_type]
    endpoint_map = {
        "end_of_service": "/api/calc/end-of-service",
        "insurance": "/api/calc/insurance",
        "leaves": "/api/calc/leaves",
        "net_salary": "/api/calc/net-salary",
    }

    result = await call_backend(endpoint_map.get(calc_type, ""), "POST", {"fields": calc_data})

    if result is None:
        await update.message.reply_text("عذراً، حصل خطأ في الحساب. حاول تاني.")
        return

    if calc_type == "end_of_service":
        text = f"{calc_info['icon']} *نتيجة حاسبة {calc_info['name']}*\n\n"
        text += f"💰 *المكافأة:* {result.get('reward', 0):,.0f} جنيه\n"
        text += f"📅 *مدة الخدمة:* {result.get('years_of_service', 0)} سنة\n\n"
        text += "*تفاصيل الحساب:*\n"
        for line in result.get("breakdown", []):
            text += f"• {line}\n"
        text += f"\n📋 {result.get('legal_reference', '')}"

    elif calc_type == "insurance":
        emp = result.get("employee_deductions", {})
        empl = result.get("employer_contributions", {})
        text = f"{calc_info['icon']} *نتيجة حاسبة {calc_info['name']}*\n\n"
        text += f"الأجر التأميني: {result.get('insurance_base', 0):,.0f} جنيه\n"
        text += f"استقطاعات العامل: {emp.get('total', 0):,.0f} جنيه\n"
        text += f"اشتراكات صاحب العمل: {empl.get('total', 0):,.0f} جنيه\n"
        text += f"💰 *صافي الراتب:* {result.get('net_salary_after_insurance', 0):,.0f} جنيه"

    elif calc_type == "leaves":
        annual = result.get("annual_leave", {})
        casual = result.get("casual_leave", {})
        text = f"{calc_info['icon']} *نتيجة حاسبة {calc_info['name']}*\n\n"
        text += f"*الإجازة السنوية:*\n"
        text += f"  الإجمالي: {annual.get('total', 0)} | مأخوذة: {annual.get('taken', 0)} | متبقية: {annual.get('remaining', 0)}\n"
        text += f"*الإجازة العارضة:*\n"
        text += f"  الإجمالي: {casual.get('total', 0)} | مأخوذة: {casual.get('taken', 0)} | متبقية: {casual.get('remaining', 0)}"

    elif calc_type == "net_salary":
        text = f"{calc_info['icon']} *نتيجة حاسبة {calc_info['name']}*\n\n"
        text += f"الراتب الإجمالي: {result.get('gross_monthly', 0):,.0f} جنيه\n"
        text += f"التأمينات: {result.get('insurance_deductions', {}).get('monthly', 0):,.0f} جنيه\n"
        text += f"الضريبة: {result.get('tax', {}).get('monthly', 0):,.0f} جنيه\n"
        text += f"💰 *صافي الراتب:* {result.get('net_monthly', 0):,.0f} جنيه"
    else:
        text = "نتيجة غير معروفة."

    await update.message.reply_text(text, parse_mode="Markdown")


def main():
    if not BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN not set!")
        return

    app = ApplicationBuilder().token(BOT_TOKEN).build()

    conv_handler = ConversationHandler(
        entry_points=[
            CommandHandler("ask", ask_command),
            CommandHandler("calc", calc_command),
            CommandHandler("start", start),
            CommandHandler("help", help_command),
        ],
        states={
            ASKING_QUESTION: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_question)],
            CALC_SELECT: [CallbackQueryHandler(button_handler)],
            CALC_INPUT: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_calc_input)],
        },
        fallbacks=[
            CommandHandler("cancel", lambda u, c: ConversationHandler.END),
            CommandHandler("calc", calc_command),
            CommandHandler("start", start),
        ],
        allow_reentry=True,
    )

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("templates", templates_command))
    app.add_handler(CommandHandler("subscribe", subscribe_command))
    app.add_handler(CommandHandler("account", account_command))
    app.add_handler(conv_handler)
    app.add_handler(CallbackQueryHandler(button_handler))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_any_message))
    app.add_handler(MessageHandler(filters.PHOTO | filters.Document.ALL | filters.VIDEO | filters.AUDIO | filters.VOICE, handle_media))

    logger.info("🤖 مستشار HR Bot started!")
    app.run_polling()


if __name__ == "__main__":
    main()

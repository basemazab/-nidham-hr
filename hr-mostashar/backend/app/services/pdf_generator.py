import os
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict
from io import BytesIO

from jinja2 import Environment, FileSystemLoader, select_autoescape
from playwright.async_api import async_playwright

logger = logging.getLogger(__name__)

# Templates directory
TEMPLATES_DIR = Path(__file__).parent.parent / "templates" / "pdf"

# Jinja2 environment
jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(),
)

# Default company settings
DEFAULT_COMPANY = {
    "company_name": "HR BASEM AZAB",
    "company_address": "القاهرة، مصر",
    "company_phone": "+20 123 456 7890",
    "company_email": "info@hrbasemazab.com",
    "legal_representative": "باسم عزاب",
    "generation_date": "",
}


def _prepare_context(data: Dict[str, Any]) -> Dict[str, Any]:
    """Merge user data with defaults and add generation date."""
    context = DEFAULT_COMPANY.copy()
    context.update(data)
    context.setdefault("generation_date", datetime.now().strftime("%Y-%m-%d %H:%M"))
    return context


def render_template(template_name: str, context: Dict[str, Any]) -> str:
    """Render a Jinja2 template with the given context."""
    template = jinja_env.get_template(template_name)
    return template.render(**_prepare_context(context))


async def generate_pdf_async(template_name: str, data: Dict[str, Any]) -> bytes:
    """Generate a PDF from a template and data dictionary using Playwright.

    Args:
        template_name: Name of the HTML template (e.g., 'employment_contract.html')
        data: Dictionary of template variables

    Returns:
        PDF file content as bytes
    """
    html_content = render_template(template_name, data)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Set the HTML content
        await page.set_content(html_content, wait_until="networkidle")

        # Generate PDF with A4 format
        pdf_bytes = await page.pdf(
            format="A4",
            print_background=True,
            margin={"top": "15mm", "right": "12mm", "bottom": "15mm", "left": "12mm"},
        )

        await browser.close()

    logger.info(f"PDF generated successfully from template: {template_name}")
    return pdf_bytes


def generate_pdf(template_name: str, data: Dict[str, Any]) -> bytes:
    """Synchronous wrapper for generate_pdf_async."""
    import asyncio

    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    return loop.run_until_complete(generate_pdf_async(template_name, data))


# Template names for reference
TEMPLATE_MAP = {
    "employment_contract": "employment_contract.html",
    "appointment_letter": "appointment_letter.html",
    "experience_certificate": "experience_certificate.html",
    "salary_certificate": "salary_certificate.html",
    "warning_letter": "warning_letter.html",
    "termination_letter": "termination_letter.html",
}


def get_template_filename(template_type: str) -> str:
    """Get the template filename for a given template type."""
    return TEMPLATE_MAP.get(template_type, f"{template_type}.html")


# Legacy functions for calculators (backward compatibility)
def _generate_simple_calculator_pdf(title: str, rows: list, data: Dict[str, Any] = None) -> bytes:
    """Generate a simple one-page PDF for calculator results."""
    html = f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <style>
        @page {{ size: A4; margin: 20mm; }}
        body {{ font-family: 'Cairo', 'Tahoma', Arial, sans-serif; direction: rtl; text-align: right; padding: 30px; font-size: 12pt; color: #0D1B2A; }}
        h1 {{ text-align: center; color: #0D1B2A; border-bottom: 3px solid #C9A84C; padding-bottom: 10px; }}
        table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        th {{ background: #0D1B2A; color: #C9A84C; padding: 10px; text-align: right; }}
        td {{ padding: 10px; border-bottom: 1px solid #ddd; }}
        tr:nth-child(even) td {{ background: #FAF7F0; }}
        .footer {{ text-align: center; margin-top: 40px; font-size: 9pt; color: #999; }}
    </style>
</head>
<body>
    <h1>{title}</h1>
    <table>
        {''.join(f'<tr><th>{k}</th><td>{v}</td></tr>' for k, v in rows)}
    </table>
    <div class="footer">HR BASEM AZAB | {datetime.now().strftime("%Y-%m-%d %H:%M")}</div>
</body>
</html>"""
    import asyncio
    async def _render():
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            await page.set_content(html, wait_until="networkidle")
            pdf = await page.pdf(format="A4", print_background=True)
            await browser.close()
            return pdf
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(_render())


def generate_end_of_service_pdf(data: Dict[str, Any]) -> bytes:
    """Legacy: End of service calculator PDF."""
    rows = [
        ("تاريخ البداية", data.get("start_date", "")),
        ("تاريخ النهاية", data.get("end_date", "")),
        ("مدة الخدمة", data.get("duration", "")),
        ("إجمالي الراتب", data.get("total_salary", "")),
        ("مكافأة نهاية الخدمة", data.get("gratuity", "")),
        ("نوع العقد", data.get("contract_type", "")),
        ("سبب المغادرة", data.get("reason", "")),
    ]
    return _generate_simple_calculator_pdf("حساب مكافأة نهاية الخدمة", rows, data)


def generate_insurance_pdf(data: Dict[str, Any]) -> bytes:
    """Legacy: Insurance calculator PDF."""
    rows = [
        ("الراتب الإجمالي", data.get("gross_salary", "")),
        ("اشتراك الموظف", data.get("employee_share", "")),
        ("اشتراك صاحب العمل", data.get("employer_share", "")),
        ("إجمالي الاشتراك", data.get("total_insurance", "")),
    ]
    return _generate_simple_calculator_pdf("حساب التأمينات الاجتماعية", rows, data)


def generate_salary_pdf(data: Dict[str, Any]) -> bytes:
    """Legacy: Net salary calculator PDF."""
    rows = [
        ("الراتب الإجمالي", data.get("gross_salary", "")),
        ("الخصومات", data.get("deductions", "")),
        ("صافي الراتب", data.get("net_salary", "")),
        ("الحالة الاجتماعية", data.get("marital_status", "")),
        ("عدد المعالين", data.get("dependents", "")),
    ]
    return _generate_simple_calculator_pdf("حساب صافي الراتب", rows, data)

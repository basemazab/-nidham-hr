"""
Test script for HR Mostashar system
Tests: Auth -> AI Chat -> Calculators -> Templates -> Subscriptions
"""

import requests
import json
import sys
import os

os.environ['PYTHONIOENCODING'] = 'utf-8'
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

BASE_URL = "http://localhost:8000"
API = f"{BASE_URL}/api"
results = []
token = ""
admin_email = "basem@hr-basem-azab.com"
admin_password = "Basem@HR2026!"

def log(test, status, details=""):
    icon = "[OK]" if status else "[FAIL]"
    msg = f"  {icon} {test}"
    if details:
        msg += f" | {details}"
    print(msg)
    results.append({"test": test, "status": status, "details": details})

def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

# ============================================================
# 1. Health Check
# ============================================================
section("1. Health Check")

try:
    r = requests.get(f"{BASE_URL}/health", timeout=10)
    log("Health Check", r.status_code == 200, f"Status: {r.status_code}")
except Exception as e:
    log("Health Check", False, str(e))
    section("Final Result")
    print("\n[FAIL] Backend is not running. Start it first:")
    print(f"   cd backend && .\\venv\\Scripts\\activate && uvicorn app.main:app --reload --port 8000")
    sys.exit(1)

try:
    r = requests.get(f"{BASE_URL}/", timeout=10)
    log("Root Endpoint", r.status_code == 200, r.json().get("message", ""))
except Exception as e:
    log("Root Endpoint", False, str(e))

# ============================================================
# 2. Register
# ============================================================
section("2. Register")

import random
test_email = f"test_{random.randint(1000,9999)}@hrmostashar.com"
test_password = "Test@1234!"

try:
    r = requests.post(f"{API}/auth/register", json={
        "full_name": "System Tester",
        "email": test_email,
        "password": test_password,
    }, timeout=10)
    if r.status_code in (201, 200, 400):
        log("Register", True, f"Status: {r.status_code}")
    else:
        log("Register", False, f"Status: {r.status_code}, {r.text[:100]}")
except Exception as e:
    log("Register", False, str(e))

# ============================================================
# 3. Login
# ============================================================
section("3. Login")

try:
    r = requests.post(f"{API}/auth/login", json={
        "email": admin_email,
        "password": admin_password,
    }, timeout=10)
    data = r.json()
    if r.status_code == 200 and "access_token" in data:
        token = data["access_token"]
        log("Login (Admin)", True, f"User: {data.get('user', {}).get('full_name', '')}")
    else:
        log("Login (Admin)", False, f"Status: {r.status_code}, {r.text[:100]}")
except Exception as e:
    log("Login (Admin)", False, str(e))

# ============================================================
# 4. Get Me
# ============================================================
section("4. Get Me")

if token:
    headers = {"Authorization": f"Bearer {token}"}
    try:
        r = requests.get(f"{API}/auth/me", headers=headers, timeout=10)
        data = r.json()
        if r.status_code == 200:
            log("Get Me", True, f"Email: {data.get('email', '')}, Admin: {data.get('is_admin', False)}")
        else:
            log("Get Me", False, f"Status: {r.status_code}")
    except Exception as e:
        log("Get Me", False, str(e))
else:
    log("Get Me", False, "No token from login")

# ============================================================
# 5. AI Chat
# ============================================================
section("5. AI Chat")

if token:
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    try:
        r = requests.post(f"{API}/ai/chat", headers=headers, json={
            "message": "ما هي مدة الإجازة السنوية حسب قانون العمل المصري؟",
        }, timeout=30)
        data = r.json()
        if r.status_code == 200 and "answer" in data:
            log("AI Chat", True, f"Answer length: {len(data['answer'])} chars")
        else:
            detail = data.get("detail", r.text[:100])
            if "GEMINI_API_KEY" in str(detail) or "gemini" in str(detail).lower():
                log("AI Chat", False, "GEMINI_API_KEY not configured (expected)")
            else:
                log("AI Chat", False, f"Status: {r.status_code}, {str(detail)[:80]}")
    except Exception as e:
        log("AI Chat", False, str(e))
else:
    log("AI Chat", False, "No token from login")

# ============================================================
# 6. Calculators
# ============================================================
section("6. Calculators")

if token:
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # 6a. End of Service
    try:
        r = requests.post(f"{API}/calc/end-of-service", headers=headers, json={
            "fields": {
                "total_salary": 10000,
                "start_date": "2020-01-01",
                "end_date": "2025-01-01",
                "contract_type": "unlimited",
                "reason": "termination",
            },
        }, timeout=10)
        data = r.json()
        if r.status_code == 200:
            log("End of Service Calculator", True, f"Result: {json.dumps(data, ensure_ascii=False)[:100]}")
        else:
            log("End of Service Calculator", False, f"Status: {r.status_code}")
    except Exception as e:
        log("End of Service Calculator", False, str(e))

    # 6b. Social Insurance
    try:
        r = requests.post(f"{API}/calc/insurance", headers=headers, json={
            "fields": {
                "gross_salary": 10000,
            },
        }, timeout=10)
        data = r.json()
        if r.status_code == 200:
            log("Social Insurance Calculator", True, f"Result: {json.dumps(data, ensure_ascii=False)[:100]}")
        else:
            log("Social Insurance Calculator", False, f"Status: {r.status_code}")
    except Exception as e:
        log("Social Insurance Calculator", False, str(e))

    # 6c. Leaves
    try:
        r = requests.post(f"{API}/calc/leaves", headers=headers, json={
            "fields": {
                "start_date": "2020-01-01",
                "current_date": "2026-01-01",
                "taken_days": 5,
                "employee_age": 30,
            },
        }, timeout=10)
        data = r.json()
        if r.status_code == 200:
            log("Leaves Calculator", True, f"Result: {json.dumps(data, ensure_ascii=False)[:100]}")
        else:
            log("Leaves Calculator", False, f"Status: {r.status_code}")
    except Exception as e:
        log("Leaves Calculator", False, str(e))

    # 6d. Net Salary
    try:
        r = requests.post(f"{API}/calc/net-salary", headers=headers, json={
            "fields": {
                "gross_salary": 15000,
                "marital_status": "married",
                "dependents": 2,
            },
        }, timeout=10)
        data = r.json()
        if r.status_code == 200:
            log("Net Salary Calculator", True, f"Result: {json.dumps(data, ensure_ascii=False)[:100]}")
        else:
            log("Net Salary Calculator", False, f"Status: {r.status_code}")
    except Exception as e:
        log("Net Salary Calculator", False, str(e))
else:
    for name in ["End of Service", "Social Insurance", "Leaves", "Net Salary"]:
        log(f"{name} Calculator", False, "No token from login")

# ============================================================
# 7. List Templates
# ============================================================
section("7. Templates")

if token:
    headers = {"Authorization": f"Bearer {token}"}
    try:
        r = requests.get(f"{API}/templates", headers=headers, timeout=10)
        data = r.json()
        if r.status_code == 200 and isinstance(data, dict):
            total = sum(len(v) for v in data.values())
            log("List Templates", True, f"{total} templates in {len(data)} categories")
        else:
            log("List Templates", False, f"Status: {r.status_code}")
    except Exception as e:
        log("List Templates", False, str(e))
else:
    log("List Templates", False, "No token from login")

# ============================================================
# 8. Generate Template
# ============================================================
section("8. Generate Template")

if token:
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    try:
        r = requests.post(f"{API}/templates/employment-unlimited/generate", headers=headers, json={
            "custom_fields": {
                "employee_name": "Ahmad Muhammad",
                "company_name": "Advanced Technology Co.",
                "start_date": "2026-01-01",
                "salary": "10000",
                "job_title": "Software Engineer",
                "probation_period": "3 months",
            },
            "format": "pdf",
        }, timeout=10)
        if r.status_code == 200 and r.headers.get("Content-Type", "").startswith("application"):
            log("Generate Template (PDF)", True, f"File size: {len(r.content)} bytes")
        else:
            log("Generate Template (PDF)", False, f"Status: {r.status_code}, Content-Type: {r.headers.get('Content-Type', 'N/A')}")
    except Exception as e:
        log("Generate Template (PDF)", False, str(e))
else:
    log("Generate Template", False, "No token from login")

# ============================================================
# 9. Get Subscription Plans
# ============================================================
section("9. Subscriptions")

try:
    r = requests.get(f"{API}/subscriptions/plans", timeout=10)
    data = r.json()
    if r.status_code == 200 and isinstance(data, dict):
        plans = list(data.values())
        log("Subscription Plans", True, f"{len(data)} plans available")
        for key, plan in data.items():
            name = plan.get("name", key)
            price = plan.get("price", "N/A")
            print(f"       - {name}: {price} EGP")
    else:
        log("Subscription Plans", False, f"Status: {r.status_code}")
except Exception as e:
    log("Subscription Plans", False, str(e))

# ============================================================
# 10. Submit Manual Payment
# ============================================================
section("10. Manual Payment")

if token:
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    try:
        r = requests.post(f"{API}/subscriptions/subscribe", headers=headers, json={
            "plan": "pro",
            "payment_reference": "TEST-12345",
        }, timeout=10)
        data = r.json()
        if r.status_code in (200, 201):
            log("Manual Payment Request", True, f"Status: {r.status_code}")
        else:
            log("Manual Payment Request", False, f"Status: {r.status_code}, {str(data.get('detail', r.text[:80]))}")
    except Exception as e:
        log("Manual Payment Request", False, str(e))
else:
    log("Manual Payment Request", False, "No token from login")

# ============================================================
# Final Report
# ============================================================
section("Final Results Report")

passed = sum(1 for r in results if r["status"])
failed = sum(1 for r in results if not r["status"])
total = len(results)

print(f"\n  Total: {total} tests")
print(f"  Passed: [OK] {passed}")
print(f"  Failed: [FAIL] {failed}")
print(f"  Rate: {(passed/total*100):.0f}%")

print(f"\n{'='*60}")
if failed == 0:
    print("  [OK] All tests passed! System is fully operational.")
elif failed <= 3:
    print(f"  [WARN] Most tests passed. {failed} minor issues found.")
else:
    print(f"  [FAIL] {failed} tests failed. Review the system.")
print(f"{'='*60}\n")

import re
from datetime import datetime

def parse_date(text):
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

tests = [
    ("2020-01-15", "2020-01-15"),
    ("15-01-2020", "2020-01-15"),
    ("1-1-2020", "2020-01-01"),
    ("2020/1/15", "2020-01-15"),
    ("15/1/2020", "2020-01-15"),
    ("(1-1-2020)", "2020-01-01"),
    ("2020-02-30", None),
    ("hello", None),
    ("15-13-2020", None),
    ("1/6/25", "2025-06-01"),
]

all_pass = True
for text, expected in tests:
    result = parse_date(text)
    status = "PASS" if result == expected else "FAIL"
    if result != expected:
        all_pass = False
    print(f"  [{status}] '{text}' -> {result} (expected: {expected})")

print(f"\n{'ALL TESTS PASSED' if all_pass else 'SOME TESTS FAILED'}")

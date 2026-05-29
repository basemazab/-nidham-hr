# CHANGELOG

## Bug Fixes - May 5, 2026

### 🐛 Bug 1: Route Ordering - `/stats` matched as employee_id
- **File**: `backend/app/routers/employees.py`
- **Issue**: `GET /employees/stats` was matched by `GET /employees/{employee_id}` because the dynamic route was defined before the static route
- **Fix**: Moved `/stats` route BEFORE `/{employee_id}` route

### 🐛 Bug 2: Token Key Mismatch in HRMS API
- **File**: `frontend/lib/hrms-api.ts`
- **Issue**: Used `localStorage.getItem("token")` while auth module stores token as `access_token`
- **Fix**: Changed to `localStorage.getItem("access_token")`

### 🐛 Bug 3: No Network Error Handling
- **Files**: `frontend/lib/api.ts`, `frontend/lib/hrms-api.ts`, `frontend/lib/auth.ts`
- **Issue**: Fetch failures threw generic TypeError with no Arabic message
- **Fix**: Added try/catch with Arabic error messages: "تعذر الاتصال بالخادم، يرجى التأكد من تشغيل الخادم أو الاتصال بالإنترنت"

### 🐛 Bug 4: Schema Import Conflict
- **File**: `backend/app/schemas/__init__.py`, `backend/app/schemas/user.py`
- **Issue**: Old `schemas.py` file conflicted with new `schemas/` directory
- **Fix**: Split into `schemas/user.py` and `schemas/hrms.py` with proper `__init__.py`

### 🐛 Bug 5: TypeScript Syntax Errors
- **File**: `frontend/lib/hrms-types.ts`
- **Issue**: Used `=` instead of `:` in object property definitions
- **Fix**: Corrected all `key = value` to `key: value`

### 🐛 Bug 6: Null Safety in Employee Detail
- **File**: `frontend/app/(app)/employees/[id]/page.tsx`
- **Issue**: `employee` could be null when calling `fullName()`
- **Fix**: Added null check

### ✅ Confirmed Fixed (from previous sessions)
- `/app/` routing prefix - all routes use root paths correctly
- CORS configured with `http://localhost:3000`
- `.env.local` has correct `NEXT_PUBLIC_API_URL`
- HTML lang="ar" dir="rtl" set in layout

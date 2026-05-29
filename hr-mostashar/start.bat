@echo off
chcp 65001 > nul

REM Get local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do (
    set "IP=%%a"
    goto :found_ip
)
:found_ip
set "IP=%IP: =%"

echo ════════════════════════════════════════
echo   🚀 تشغيل نظام مستشار HR
echo ════════════════════════════════════════
echo   📱 IP: %IP%
echo.

REM Open firewall ports
echo 🔓 Opening firewall ports...
netsh advfirewall firewall add rule name="HR Backend (8000)" dir=in action=allow protocol=TCP localport=8000 >nul 2>&1
netsh advfirewall firewall add rule name="HR Frontend (3000)" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1

REM Start Backend
echo 1️⃣ Starting Backend...
start "Backend - HR Mostashar" powershell -NoExit -Command ^
  "cd backend; .\venv\Scripts\activate; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 8 /nobreak > nul

REM Start Frontend
echo 2️⃣ Starting Frontend...
start "Frontend - HR Mostashar" powershell -NoExit -Command ^
  "cd frontend; set NEXT_PUBLIC_API_URL=http://%IP%:8000 && npm run dev -- -H 0.0.0.0"

timeout /t 12 /nobreak > nul

REM Open browser
echo 3️⃣ Opening Browser...
start http://localhost:3000

echo.
echo ════════════════════════════════════════
echo   ✅ النظام جاهز!
echo ════════════════════════════════════════
echo.
echo   🖥️  من الكمبيوتر: http://localhost:3000
echo   📱 من الموبايل:    http://%IP%:3000
echo.
echo   📚 API Docs: http://%IP%:8000/docs
echo.
echo   🔑 حساب الأدمن:
echo      Email:    basem@hr-basem-azab.com
echo      Password: Basem@HR2026!
echo.
echo ════════════════════════════════════════
echo.
echo   شارك الرابط ده مع اي حد على نفس الشبكة:
echo   http://%IP%:3000
echo.
pause

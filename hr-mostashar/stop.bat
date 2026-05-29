@echo off
echo ════════════════════════════════════════
echo   ⏹️  إيقاف جميع الخدمات
echo ════════════════════════════════════════
echo.
echo جاري إيقاف الخدمات...
taskkill /F /FI "WINDOWTITLE eq Backend - HR Mostashar*" /T 2>nul
taskkill /F /FI "WINDOWTITLE eq Frontend - HR Mostashar*" /T 2>nul
timeout /t 2 /nobreak > nul
echo.
echo ✅ تم إيقاف الخدمات!
echo ════════════════════════════════════════
pause

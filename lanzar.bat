# ==========================================
# LANZAR Development Launcher
# ==========================================

Write-Host ""
Write-Host "=========================================="
Write-Host "     Starting LANZAR Development"
Write-Host "=========================================="
Write-Host ""

# Backend
wt -w 0 new-tab --title "LANZAR Backend" `
    powershell -NoExit -Command "Set-Location 'C:\Projects\LANZAR\website\backend'; npm run dev"

# Frontend
wt -w 0 new-tab --title "LANZAR Frontend" `
    powershell -NoExit -Command "Set-Location 'C:\Projects\LANZAR\website'; npm run dev"
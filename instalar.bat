@echo off
echo.
echo  ========================================
echo   TallerPro - Instalacion
echo  ========================================
echo.

where node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
  echo  [ERROR] Node.js no esta instalado.
  echo  Descargalo desde: https://nodejs.org
  echo  Instala la version LTS y vuelve a ejecutar este archivo.
  pause
  exit /b
)

echo  [OK] Node.js encontrado.
echo  Instalando dependencias...
echo.

npm install

echo.
echo  ========================================
echo   Listo! Para iniciar la app ejecuta:
echo   npm start
echo  ========================================
echo.
pause

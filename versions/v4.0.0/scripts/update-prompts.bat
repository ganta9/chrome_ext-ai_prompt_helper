@echo off
echo ============================================
echo   AI Prompt Helper - Auto Update Script
echo ============================================
echo.

REM Node.jsがインストールされているかチェック
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js がインストールされていません
    echo Node.js をインストールしてください: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM スクリプト実行
echo プロンプトファイルを自動スキャンしています...
echo.

node update-prompts.js

echo.
echo 完了しました。Enterキーを押して終了してください。
pause >nul
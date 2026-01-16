@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo.
echo  ======================================
echo   PUAX MCP Server - 快速启动
echo  ======================================
echo.

REM 获取脚本所在目录
cd /d "%~dp0"

REM 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js 未安装或未添加到 PATH
    echo 请访问 https://nodejs.org 下载安装
    pause
    exit /b 1
)

REM 检查是否已构建
if not exist "build\index.js" (
    echo [构建] 未找到构建文件，正在构建...
    call npm run build
    if %errorlevel% neq 0 (
        echo [ERROR] 构建失败!
        pause
        exit /b 1
    )
)

echo [启动] 正在启动服务器...
echo.

REM 启动服务器
node build/index.js %*

echo.
pause